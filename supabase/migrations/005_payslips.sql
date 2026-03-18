-- Funções usadas pelas políticas de storage (bucket payslips)
-- Path no bucket: org_id/user_id/filename (ex: uuid/uuid/2025-01.pdf)
CREATE OR REPLACE FUNCTION public.can_upload_payslip_to_org(org_id_text text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.current_user_has_org_role(org_id_text::uuid, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]);
$$;

CREATE OR REPLACE FUNCTION public.can_download_payslip(object_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  parts text[];
  org_id_val uuid;
  user_id_val uuid;
BEGIN
  parts := string_to_array(object_path, '/');
  IF array_length(parts, 1) < 2 THEN
    RETURN false;
  END IF;
  org_id_val := parts[1]::uuid;
  user_id_val := parts[2]::uuid;
  -- Dono do holerite ou hr/admin/owner da org
  RETURN (user_id_val = auth.uid())
     OR public.current_user_has_org_role(org_id_val, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role]);
END;
$$;

-- Tabela de holerites/contracheques
CREATE TABLE payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, year, month)
);

CREATE INDEX idx_payslips_org_user ON payslips(org_id, user_id);
CREATE INDEX idx_payslips_org_year_month ON payslips(org_id, year, month);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- SELECT: employee vê só os próprios; hr/admin/owner vê todos da org
CREATE POLICY "Users can view own payslips"
  ON payslips FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "HR and above can view all org payslips"
  ON payslips FOR SELECT
  USING (
    public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role])
  );

-- INSERT/UPDATE/DELETE: só hr, admin, owner
CREATE POLICY "HR and above can manage payslips"
  ON payslips FOR ALL
  USING (
    public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role])
  )
  WITH CHECK (
    public.current_user_has_org_role(org_id, ARRAY['owner'::org_role, 'admin'::org_role, 'hr'::org_role])
  );
