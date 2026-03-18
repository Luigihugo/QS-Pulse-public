-- Políticas para orgs: usuário só vê orgs em que é membro
CREATE POLICY "Users can view their orgs"
  ON orgs FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Políticas para profiles: todos podem ver (para exibir nomes na org); só o próprio pode atualizar
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Políticas para org_members: ver membros das orgs em que participa
CREATE POLICY "Members can view org_members in their orgs"
  ON org_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Usuário pode se inserir como primeiro membro (owner) da org - fluxo de onboarding
CREATE POLICY "User can insert self as first member"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM org_members om WHERE om.org_id = org_id
    )
  );

-- Apenas owner/admin podem inserir outros membros na org
CREATE POLICY "Owner and admin can insert org_members"
  ON org_members FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Apenas owner/admin podem atualizar roles na org
CREATE POLICY "Owner and admin can update org_members"
  ON org_members FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Apenas owner/admin podem remover membros (exceto owner da org - pode restringir em app)
CREATE POLICY "Owner and admin can delete org_members"
  ON org_members FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Permitir que usuários autenticados criem orgs e se tornem owner (via insert em orgs + org_members)
-- Como org_members depende de org_id, precisamos permitir INSERT em orgs para usuários autenticados
-- e depois INSERT em org_members. Uma abordagem: policy em orgs para INSERT com true (qualquer autenticado cria org).
CREATE POLICY "Authenticated users can create orgs"
  ON orgs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas owner da org pode atualizar a org (opcional, para editar nome/slug)
CREATE POLICY "Owner can update org"
  ON orgs FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
