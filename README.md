# QS Pulse

Portal do Colaborador – MVP (Next.js + Supabase).

## Setup

1. Clone o repositório e instale as dependências:

   ```bash
   npm install
   ```

2. Crie um projeto no [Supabase](https://supabase.com) e copie as variáveis de ambiente:

   ```bash
   cp .env.local.example .env.local
   ```

   Preencha em `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL` – URL do projeto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – chave anon (public)

3. Rode as migrations no Supabase (Dashboard → SQL Editor ou CLI):

   - `supabase/migrations/001_orgs_profiles_org_members.sql`
   - `supabase/migrations/002_rls_orgs_profiles_members.sql`
   - (e as demais na ordem, até `008_feedback.sql` para o módulo de Feedbacks)

   **Ou**, para aplicar só a migration de feedback: no Supabase (Settings → Database) copie a **Connection string (URI)**; em `.env.local` adicione `DATABASE_URL=<essa URL>` (substitua `[YOUR-PASSWORD]` pela senha do banco). Depois rode:

   ```bash
   npm run db:migrate:feedback
   ```

4. Inicie o app:

   ```bash
   npm run dev
   ```

5. Crie um usuário em Authentication no Supabase, faça login em `/login`, depois crie uma organização em `/onboarding`.

## Rotas

- `/` – Página inicial
- `/login` – Login
- `/onboarding` – Criar organização (primeiro acesso)
- `/app/feed` – Feed (Fase 3)
- `/app/payslips` – Holerites (Fase 4)
- `/app/org-chart` – Org chart (Fase 6)
- `/app/admin/users` – Usuários (Fase 5)
- `/app/settings/profile` – Perfil

## Plano do MVP

Ver `docs/MVP_PLAN.md` para o plano completo e próximas fases.
