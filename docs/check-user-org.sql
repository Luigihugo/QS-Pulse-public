-- ============================================================
-- Verificar e corrigir usuário luigihugo11@gmail.com na org "QS"
-- Rode no Supabase Dashboard → SQL Editor (uma query por vez ou tudo)
-- ============================================================

-- 1) Ver se o usuário existe em auth.users e pegar o id
SELECT id, email, created_at
FROM auth.users
WHERE email = 'luigihugo11@gmail.com';
-- Se não retornar nada: crie o usuário em Authentication → Users → Add user.

-- 2) Ver se a org "QS" existe e pegar o id
SELECT id, name, slug
FROM public.orgs
WHERE name ILIKE '%QS%' OR slug ILIKE '%qs%';
-- Se não retornar nada: faça login no app e use /onboarding para criar a org "QS".

-- 3) Ver se esse usuário já é membro de alguma org (e qual)
SELECT om.id, om.org_id, o.name AS org_name, om.role
FROM public.org_members om
JOIN public.orgs o ON o.id = om.org_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'luigihugo11@gmail.com';

-- 4) Se o usuário EXISTE e a org "QS" EXISTE mas o usuário NÃO está em org_members,
--    rode o bloco abaixo substituindo os UUIDs pelos resultados dos SELECTs acima:
/*
-- Pegar user_id do SELECT 1 e org_id do SELECT 2, então:
INSERT INTO public.org_members (org_id, user_id, role)
VALUES (
  'COLE_AQUI_O_org_id_DA_ORG_QS',  -- uuid da org QS
  'COLE_AQUI_O_id_DO_usuario',     -- uuid do auth.users
  'owner'                           -- ou 'admin', 'hr', 'employee'
)
ON CONFLICT (org_id, user_id) DO NOTHING;
*/

-- 5) Garantir que o perfil existe (trigger cria ao cadastrar; se o usuário foi criado antes do trigger, insira manualmente)
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE email = 'luigihugo11@gmail.com'
ON CONFLICT (id) DO NOTHING;
