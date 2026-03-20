import { createClient } from "@/lib/supabase/server";
import type { Org, OrgWithMember } from "@/types/database";

const DEFAULT_ORG_NAME = "QS";
const DEFAULT_ORG_SLUG = "qs";

async function ensureDefaultOrgForUser(userId: string): Promise<OrgWithMember | null> {
  const supabase = await createClient();

  // 1) Tenta encontrar a org única padrão.
  let { data: defaultOrg } = await supabase
    .from("orgs")
    .select("id, name, slug, created_at, updated_at")
    .eq("slug", DEFAULT_ORG_SLUG)
    .maybeSingle();

  // 2) Se não existir, tenta criar.
  if (!defaultOrg) {
    const insertRes = await supabase
      .from("orgs")
      .insert({ name: DEFAULT_ORG_NAME, slug: DEFAULT_ORG_SLUG })
      .select("id, name, slug, created_at, updated_at")
      .single();
    defaultOrg = insertRes.data ?? null;

    // Em corrida de criação (slug já criado por outro request), relê.
    if (!defaultOrg) {
      const retryRes = await supabase
        .from("orgs")
        .select("id, name, slug, created_at, updated_at")
        .eq("slug", DEFAULT_ORG_SLUG)
        .maybeSingle();
      defaultOrg = retryRes.data ?? null;
    }
  }

  if (!defaultOrg) return null;

  // 3) Garante membership do usuário nessa org.
  const membershipRes = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", defaultOrg.id)
    .eq("user_id", userId)
    .maybeSingle();

  let role: OrgWithMember["role"] | null = (membershipRes.data?.role as OrgWithMember["role"]) ?? null;

  if (!role) {
    const countRes = await supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", defaultOrg.id);
    const hasMembers = (countRes.count ?? 0) > 0;
    const initialRole: OrgWithMember["role"] = hasMembers ? "employee" : "owner";

    const insertMember = await supabase
      .from("org_members")
      .insert({ org_id: defaultOrg.id, user_id: userId, role: initialRole })
      .select("role")
      .single();

    role = (insertMember.data?.role as OrgWithMember["role"]) ?? null;

    // Corrida em cadastro simultâneo: tenta reler.
    if (!role) {
      const retryMember = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", defaultOrg.id)
        .eq("user_id", userId)
        .maybeSingle();
      role = (retryMember.data?.role as OrgWithMember["role"]) ?? null;
    }
  }

  if (!role) return null;

  return {
    ...defaultOrg,
    role,
  };
}

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
  if (!first?.orgs) {
    return ensureDefaultOrgForUser(user.id);
  }

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

/** Owner, admin e HR acessam o painel administrativo (dashboard + gestão de holerites). */
export function canAccessAdminPanel(role: OrgWithMember["role"]): boolean {
  return role === "owner" || role === "admin" || role === "hr";
}
