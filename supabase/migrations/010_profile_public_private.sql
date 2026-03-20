-- Perfil v2: separa informações públicas e dados internos de RH/admin.

-- Campos públicos (visíveis para todos os colaboradores)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS headline text;

-- Dados internos (visíveis para owner/admin/hr e para o próprio usuário)
CREATE TABLE IF NOT EXISTS profile_private_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date date,
  hire_date date,
  shoe_size text,
  address_line text,
  address_number text,
  address_city text,
  address_state text,
  address_zip text,
  emergency_contact_name text,
  emergency_contact_phone text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_private_org_user
  ON profile_private_data (org_id, user_id);

ALTER TABLE profile_private_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Private profile visible to admin/hr/owner and self" ON profile_private_data;
CREATE POLICY "Private profile visible to admin/hr/owner and self"
  ON profile_private_data FOR SELECT
  USING (
    public.current_user_is_org_member(org_id)
    AND (
      user_id = auth.uid()
      OR public.current_user_has_org_role(
        org_id,
        ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]
      )
    )
  );

DROP POLICY IF EXISTS "Private profile upsert by admin/hr/owner and self" ON profile_private_data;
CREATE POLICY "Private profile upsert by admin/hr/owner and self"
  ON profile_private_data FOR INSERT
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND (
      user_id = auth.uid()
      OR public.current_user_has_org_role(
        org_id,
        ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]
      )
    )
  );

DROP POLICY IF EXISTS "Private profile update by admin/hr/owner and self" ON profile_private_data;
CREATE POLICY "Private profile update by admin/hr/owner and self"
  ON profile_private_data FOR UPDATE
  USING (
    public.current_user_is_org_member(org_id)
    AND (
      user_id = auth.uid()
      OR public.current_user_has_org_role(
        org_id,
        ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]
      )
    )
  )
  WITH CHECK (
    public.current_user_is_org_member(org_id)
    AND (
      user_id = auth.uid()
      OR public.current_user_has_org_role(
        org_id,
        ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]
      )
    )
  );
