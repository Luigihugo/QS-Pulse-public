import { getCurrentOrg, canManageTeams } from "@/lib/org";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamNode } from "./TeamNode";
import type { Team, TeamMember, TeamWithMembers } from "@/types/database";

function buildTree(
  teams: Team[],
  membersByTeam: Map<string, (TeamMember & { full_name: string | null })[]>,
  parentId: string | null
): TeamWithMembers[] {
  return teams
    .filter((t) => t.parent_team_id === parentId)
    .map((t) => ({
      ...t,
      members: membersByTeam.get(t.id) ?? [],
      children: buildTree(teams, membersByTeam, t.id),
    }));
}

export default async function OrgChartPage() {
  const org = await getCurrentOrg();
  const user = await getCurrentUser();
  if (!org || !user) redirect("/login");

  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("org_id", org.id)
    .order("name");

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role, created_at")
    .in("team_id", (teams ?? []).map((t) => t.id));

  const userIds = Array.from(new Set((teamMembers ?? []).map((tm) => tm.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

  const membersByTeam = new Map<string, (TeamMember & { full_name: string | null })[]>();
  (teamMembers ?? []).forEach((tm) => {
    const list = membersByTeam.get(tm.team_id) ?? [];
    list.push({
      ...tm,
      full_name: profileMap.get(tm.user_id) ?? null,
    });
    membersByTeam.set(tm.team_id, list);
  });

  const teamList = (teams ?? []) as Team[];
  const tree = buildTree(teamList, membersByTeam, null);

  const { data: orgMembers } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", org.id);

  const memberIds = (orgMembers ?? []).map((m) => m.user_id);
  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", memberIds);

  const orgMembersWithNames = memberIds.map((id) => ({
    user_id: id,
    full_name: memberProfiles?.find((p) => p.id === id)?.full_name ?? null,
  }));

  const canManage = canManageTeams(org.role);
  const flatTeams: TeamWithMembers[] = tree.flatMap(function flatten(t): TeamWithMembers[] {
    return [t, ...t.children.flatMap(flatten)];
  });

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Org Chart</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {canManage
          ? "Estrutura de times e membros. Você pode criar times, editar e adicionar pessoas."
          : "Estrutura de times e membros da organização."}
      </p>

      {canManage && (
        <div className="mt-6">
          <CreateTeamForm orgId={org.id} teams={tree} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {tree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-16 text-center">
            <p className="text-neutral-500">
              {canManage ? "Nenhum time ainda. Crie o primeiro time." : "Nenhum time cadastrado."}
            </p>
          </div>
        ) : (
          tree.map((team) => (
            <TeamNode
              key={team.id}
              orgId={org.id}
              team={team}
              allTeams={flatTeams}
              orgMembers={orgMembersWithNames}
              canManage={canManage}
            />
          ))
        )}
      </div>
    </div>
  );
}
