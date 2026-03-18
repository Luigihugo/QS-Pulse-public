-- Seed do QS Pulse (MVP) para ambiente de desenvolvimento
-- IMPORTANTE: substitua os valores de e-mail e senha antes de usar em produção.
-- Este script cria:
-- - 1 organização de exemplo ("Quantum Solutions")
-- - 1 usuário admin/owner
-- - 1 usuário colaborador (employee)

-- Ajuste estes valores conforme necessário
\set admin_email 'admin@example.com'
\set admin_password 'Admin123!'
\set employee_email 'employee@example.com'
\set employee_password 'Employee123!'

-- Extensão necessária para criptografar senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_employee_id uuid := gen_random_uuid();
  v_org_id uuid := gen_random_uuid();
BEGIN
  -- Usuário admin (auth.users)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    :'admin_email',
    crypt(:'admin_password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', 'Admin QS Pulse')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data)
  VALUES (
    gen_random_uuid(),
    v_admin_id,
    v_admin_id::text,
    'email',
    jsonb_build_object('sub', v_admin_id::text, 'email', :'admin_email')
  )
  ON CONFLICT DO NOTHING;

  -- Usuário colaborador (auth.users)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    v_employee_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    :'employee_email',
    crypt(:'employee_password', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('full_name', 'Colaborador QS Pulse')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data)
  VALUES (
    gen_random_uuid(),
    v_employee_id,
    v_employee_id::text,
    'email',
    jsonb_build_object('sub', v_employee_id::text, 'email', :'employee_email')
  )
  ON CONFLICT DO NOTHING;

  -- Organização de exemplo
  INSERT INTO public.orgs (id, name, slug)
  VALUES (v_org_id, 'Quantum Solutions', 'quantum-solutions')
  ON CONFLICT (id) DO NOTHING;

  -- Membros da org (org_members)
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES
    (v_org_id, v_admin_id, 'owner'::org_role),
    (v_org_id, v_employee_id, 'employee'::org_role)
  ON CONFLICT (org_id, user_id) DO NOTHING;
END
$$;

