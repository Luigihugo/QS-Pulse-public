-- Adiciona luigihugo11@gmail.com à org "QS" se usuário e org existirem e ele ainda não for membro.
-- Rode no Supabase → SQL Editor (como service role / postgres, RLS não bloqueia).

-- Garantir perfil
INSERT INTO public.profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE email = 'luigihugo11@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Inserir em org_members se existir usuário + org "QS" e ainda não for membro
INSERT INTO public.org_members (org_id, user_id, role)
SELECT o.id, u.id, 'owner'
FROM auth.users u
CROSS JOIN public.orgs o
WHERE u.email = 'luigihugo11@gmail.com'
  AND (o.name ILIKE 'QS' OR o.slug ILIKE 'qs')
  AND NOT EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = o.id AND om.user_id = u.id
  )
ON CONFLICT (org_id, user_id) DO NOTHING;
