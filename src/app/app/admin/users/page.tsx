import { redirect } from "next/navigation";
import { getCurrentOrg, canAccessAdminUsers } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import { MemberRow } from "./MemberRow";
import type { OrgRole } from "@/types/database";

export default async function AdminUsersPage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();

  if (!org || !user) redirect("/login");
  if (!canAccessAdminUsers(org.role)) redirect("/app");

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("org_members")
    .select("id, user_id, role")
    .eq("org_id", org.id)
    .order("role", { ascending: true });

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileByUserId = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Usuários</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Gerencie membros e funções da organização. Apenas owner e admin têm acesso a esta página.
      </p>

      <div className="mt-6">
        <InviteForm orgId={org.id} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Membros</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">
                  Função
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <MemberRow
                  key={m.id}
                  orgId={org.id}
                  member={{
                    id: m.id,
                    user_id: m.user_id,
                    role: m.role as OrgRole,
                    full_name: profileByUserId.get(m.user_id) ?? null,
                  }}
                  currentUserId={user.id}
                />
              ))}
            </tbody>
          </table>
        </div>
        {(!members || members.length === 0) && (
          <p className="mt-4 text-sm text-neutral-500">Nenhum membro além de você.</p>
        )}
      </div>
    </div>
  );
}
