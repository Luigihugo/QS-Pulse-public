-- Times (hierárquicos) e membros por time
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_org_id ON teams(org_id);
CREATE INDEX idx_teams_parent ON teams(parent_team_id);

CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams: qualquer membro da org pode ler; owner/admin podem gerenciar
CREATE POLICY "Members can view org teams"
  ON teams FOR SELECT
  USING (public.current_user_is_org_member(org_id));

CREATE POLICY "Owner and admin can manage teams"
  ON teams FOR ALL
  USING (public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role]));

-- Team members: qualquer membro da org pode ler; owner/admin podem gerenciar
CREATE POLICY "Members can view team_members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_id AND public.current_user_is_org_member(t.org_id)
    )
  );

CREATE POLICY "Owner and admin can manage team_members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_id AND public.current_user_has_org_role(t.org_id, ARRAY['owner'::org_role, 'admin'::org_role])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_id AND public.current_user_has_org_role(t.org_id, ARRAY['owner'::org_role, 'admin'::org_role])
    )
  );
