-- ============================================================
-- Corrige recursão infinita nas políticas de org_members.
-- As políticas não podem fazer SELECT em org_members; usamos
-- funções SECURITY DEFINER que leem a tabela sem acionar RLS.
-- ============================================================

-- Função: a org ainda não tem nenhum membro? (usado no onboarding)
CREATE OR REPLACE FUNCTION public.org_has_no_members(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.org_members WHERE org_id = p_org_id);
$$;

-- Função: o usuário atual é membro da org com um dos roles dados?
CREATE OR REPLACE FUNCTION public.current_user_has_org_role(p_org_id uuid, p_roles org_role[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role = ANY(p_roles)
  );
$$;

-- Função: o usuário atual é membro da org? (qualquer role)
CREATE OR REPLACE FUNCTION public.current_user_is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- Remover políticas antigas de org_members que causam recursão
DROP POLICY IF EXISTS "Members can view org_members in their orgs" ON org_members;
DROP POLICY IF EXISTS "User can insert self as first member" ON org_members;
DROP POLICY IF EXISTS "Owner and admin can insert org_members" ON org_members;
DROP POLICY IF EXISTS "Owner and admin can update org_members" ON org_members;
DROP POLICY IF EXISTS "Owner and admin can delete org_members" ON org_members;

-- SELECT: usuário vê org_members apenas das orgs em que é membro (sem recursão)
CREATE POLICY "Members can view org_members in their orgs"
  ON org_members FOR SELECT
  USING (public.current_user_is_org_member(org_id));

-- INSERT: usuário pode se inserir como primeiro membro (onboarding) OU owner/admin pode inserir outros
CREATE POLICY "User can insert self as first member"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.org_has_no_members(org_id)
  );

CREATE POLICY "Owner and admin can insert org_members"
  ON org_members FOR INSERT
  WITH CHECK (
    public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  );

-- UPDATE: apenas owner/admin da org
CREATE POLICY "Owner and admin can update org_members"
  ON org_members FOR UPDATE
  USING (public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role]));

-- DELETE: apenas owner/admin da org
CREATE POLICY "Owner and admin can delete org_members"
  ON org_members FOR DELETE
  USING (public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role]));
