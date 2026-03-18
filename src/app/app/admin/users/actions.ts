"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { OrgRole } from "@/types/database";

export type InviteResult = { ok: true } | { ok: false; error: string };
export type UpdateRoleResult = { ok: true } | { ok: false; error: string };

const ADMIN_ROLES: OrgRole[] = ["owner", "admin"];

async function assertAdmin(orgId: string): Promise<{ ok: false; error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!member || !ADMIN_ROLES.includes(member.role as OrgRole)) {
    return { ok: false, error: "Sem permissão." };
  }
  return null;
}

export async function inviteUser(
  orgId: string,
  email: string,
  role: OrgRole
): Promise<InviteResult> {
  const err = await assertAdmin(orgId);
  if (err) return err;

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "E-mail obrigatório." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Serviço de convite não configurado (SUPABASE_SERVICE_ROLE_KEY)." };
  }
  const {
    data: inviteData,
    error: inviteError,
  } = await admin.auth.admin.inviteUserByEmail(trimmed, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/onboarding`,
    data: { role },
  });

  if (inviteError) {
    if (inviteError.message?.includes("already been registered") || inviteError.message?.includes("already exists")) {
      return { ok: false, error: "Este e-mail já está cadastrado. Use outra opção para adicionar à organização." };
    }
    return { ok: false, error: inviteError.message };
  }

  const invitedUserId = inviteData?.user?.id;
  if (!invitedUserId) return { ok: false, error: "Convite enviado, mas não foi possível adicionar à organização." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("org_members").insert({
    org_id: orgId,
    user_id: invitedUserId,
    role,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Esta pessoa já é membro da organização." };
    }
    return { ok: false, error: insertError.message };
  }

  revalidatePath("/app/admin/users");
  return { ok: true };
}

export async function updateMemberRole(
  orgId: string,
  memberId: string,
  newRole: OrgRole
): Promise<UpdateRoleResult> {
  const err = await assertAdmin(orgId);
  if (err) return err;

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("org_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("org_id", orgId)
    .single();

  if (!target) return { ok: false, error: "Membro não encontrado." };

  if (target.role === "owner") {
    const { count } = await supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "owner");
    if (count !== null && count <= 1) {
      return { ok: false, error: "A organização precisa de pelo menos um owner. Promova outro membro antes." };
    }
  }

  const { error } = await supabase
    .from("org_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/admin/users");
  return { ok: true };
}
