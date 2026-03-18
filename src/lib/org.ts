import { createClient } from "@/lib/supabase/server";
import type { Org, OrgWithMember } from "@/types/database";

/**
 * Retorna a organização atual do usuário (primeira por criação).
 * Usado em Server Components e server actions.
 */
export async function getCurrentOrg(): Promise<OrgWithMember | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("org_members")
    .select(
      `
      role,
      orgs (
        id,
        name,
        slug,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const first = memberships?.[0] as
    | { role: OrgWithMember["role"]; orgs: Org | null }
    | undefined;
  if (!first?.orgs) return null;

  return {
    ...first.orgs,
    role: first.role,
  };
}

/**
 * Retorna a primeira org do usuário com role (para redirecionamento).
 */
export async function getUserOrgId(): Promise<string | null> {
  const org = await getCurrentOrg();
  return org?.id ?? null;
}

/** No MVP, só hr, admin e owner podem criar post no feed. */
export function canCreatePost(role: OrgWithMember["role"]): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}

/** RH, admin e owner podem fazer upload e ver todos os holerites da org. */
export function canManagePayslips(role: OrgWithMember["role"]): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}

/** Apenas owner e admin acessam o painel de usuários (gestão de membros/roles). */
export function canAccessAdminUsers(role: OrgWithMember["role"]): boolean {
  return role === "owner" || role === "admin";
}

/** Owner e admin podem criar/editar times e membros no org chart. */
export function canManageTeams(role: OrgWithMember["role"]): boolean {
  return role === "owner" || role === "admin";
}
