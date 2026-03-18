"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertCanManage(orgId: string): Promise<{ ok: false; error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: m } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  if (!m || (m.role !== "owner" && m.role !== "admin")) {
    return { ok: false, error: "Sem permissão." };
  }
  return null;
}

export type TeamResult = { ok: true } | { ok: false; error: string };

export async function createTeam(orgId: string, name: string, parentTeamId: string | null): Promise<TeamResult> {
  const err = await assertCanManage(orgId);
  if (err) return err;
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome do time é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({
    org_id: orgId,
    name: trimmed,
    parent_team_id: parentTeamId || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/org-chart");
  return { ok: true };
}

export async function updateTeam(
  orgId: string,
  teamId: string,
  name: string,
  parentTeamId: string | null
): Promise<TeamResult> {
  const err = await assertCanManage(orgId);
  if (err) return err;
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nome do time é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ name: trimmed, parent_team_id: parentTeamId || null })
    .eq("id", teamId)
    .eq("org_id", orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/org-chart");
  return { ok: true };
}

export async function deleteTeam(orgId: string, teamId: string): Promise<TeamResult> {
  const err = await assertCanManage(orgId);
  if (err) return err;

  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", teamId).eq("org_id", orgId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/org-chart");
  return { ok: true };
}

export async function addTeamMember(orgId: string, teamId: string, userId: string, role: string): Promise<TeamResult> {
  const err = await assertCanManage(orgId);
  if (err) return err;

  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: userId,
    role: role || "member",
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esta pessoa já está no time." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/app/org-chart");
  return { ok: true };
}

export async function removeTeamMember(orgId: string, teamMemberId: string): Promise<TeamResult> {
  const err = await assertCanManage(orgId);
  if (err) return err;

  const supabase = await createClient();
  const { data: tm } = await supabase
    .from("team_members")
    .select("id, team_id")
    .eq("id", teamMemberId)
    .single();

  if (!tm) return { ok: false, error: "Membro não encontrado." };

  const { data: team } = await supabase.from("teams").select("org_id").eq("id", tm.team_id).single();
  if (!team || team.org_id !== orgId) return { ok: false, error: "Sem permissão." };

  const { error } = await supabase.from("team_members").delete().eq("id", teamMemberId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/org-chart");
  return { ok: true };
}
