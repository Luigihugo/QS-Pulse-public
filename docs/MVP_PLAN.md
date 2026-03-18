# QS Pulse – Plano MVP Completo (Fase 1)

Documento de referência para continuar o desenvolvimento quando o contexto for perdido. Use: "continuar a partir da Fase 2" ou "implementar Fase 3", etc.

---

## Objetivo do MVP (Fase 1)

- **Portal do Colaborador** com:
  1. Feed interno (celebrações/comunicados) estilo rede social simples.
  2. Holerites/contracheques: RH faz upload mensal; cada colaborador acessa apenas os seus.

---

## Fundação obrigatória

- **Multi-tenant:** orgs (empresas) e memberships (org_members).
- **Perfis e papéis (RBAC):** owner, admin, hr, manager, employee.
- **RLS** em todas as tabelas por org_id.
- **Supabase Storage:** bucket privado "payslips" + políticas de download.
- **Layout:** sidebar à esquerda + header com perfil no topo direito.
- **Área do usuário:** alterar nome/foto e logout.
- **Admin mínimo:** gestão de usuários (criar/convite) e atribuição de roles.

---

## Escopo de telas/rotas

| Rota | Descrição |
|------|------------|
| /login | Login (email/senha ou magic link) |
| /onboarding | Criar org e virar owner |
| /app/feed | Listar + criar post; comentários opcional |
| /app/payslips | Colaborador: próprios; RH/Admin: upload + lista geral |
| /app/org-chart | Versão simples: times e membros |
| /app/admin/users | Gerenciar membros/roles |
| /app/settings/profile | Editar nome/foto, logout |

---

## Regras de permissão

- **Feed:** qualquer membro da org pode ler; criar post: somente hr/admin/owner (MVP).
- **Holerites:** employee só lê os próprios; hr/admin faz upload, edita e vê todos.
- **Storage:** download permitido somente se o usuário tiver permissão em payslips (próprio ou hr/admin/owner da org).

---

## Banco (Postgres/Supabase)

### Tabelas

- **orgs** – id, name, slug, created_at, updated_at
- **profiles** – id (FK auth.users), full_name, avatar_url, created_at, updated_at
- **org_members** – id, org_id, user_id, role (enum), created_at — unique(org_id, user_id)
- **teams** – id, org_id, name, parent_team_id, created_at
- **team_members** – id, team_id, user_id, role — unique(team_id, user_id)
- **posts** – id, org_id, author_id, content, created_at, updated_at
- **payslips** – id, org_id, user_id, year, month, file_path, uploaded_by, created_at — unique(org_id, user_id, year, month)

### Índices e constraints

- Índices em org_members(org_id), org_members(user_id); posts(org_id, created_at); payslips(org_id, user_id), (org_id, year, month).

---

## RLS

- Políticas completas em todas as tabelas + storage (orgs, profiles, org_members, teams, team_members, posts, payslips; bucket payslips).

---

## Ordem de implementação (fases)

1. **Fase 0** – Next.js, Supabase client/server, middleware, env. (FEITO)
2. **Fase 1** – Auth + Tenant + Layout: migrations orgs/profiles/org_members + RLS, login, onboarding, layout (sidebar + header), settings/profile. (FEITO)
3. **Fase 2** – RLS completo para todas as tabelas já criadas e novas.
4. **Fase 3** – Feed: tabela posts, RLS, /app/feed (listar + criar).
5. **Fase 4** – Holerites + Storage: payslips, bucket, políticas, /app/payslips.
6. **Fase 5** – Admin Users: /app/admin/users (gestão membros/roles).
7. **Fase 6** – Org chart: teams, team_members, /app/org-chart.
8. **Fase 7** – Seed (um org, admin, employee) e instruções de teste de permissões.

---

## Estrutura de pastas (referência)

```
src/
  app/
    (auth)/ login, onboarding
    (app)/ layout (sidebar+header), feed, payslips, org-chart, admin/users, settings/profile
  components/ layout (Sidebar, Header), feed, payslips
  lib/ supabase (client, server), org.ts, auth
  types/ database.ts
supabase/ migrations/, seed.sql
docs/ MVP_PLAN.md (este arquivo)
```

---

## Migrations (ordem)

1. 001_orgs_profiles_org_members.sql
2. 002_rls_orgs_profiles_members.sql
3. 003_teams_team_members.sql (Fase 6)
4. 004_posts.sql (Fase 3)
5. 005_payslips.sql (Fase 4)
6. RLS para teams, posts, payslips
7. Storage bucket payslips + políticas (Fase 4)

---

## Como continuar

- **Fase 2:** Revisar e completar políticas RLS em todas as tabelas.
- **Fase 3:** Criar migration posts, RLS, página /app/feed com listagem e formulário de criação (hr/admin/owner).
- **Fase 4:** Migration payslips, bucket storage, políticas, página /app/payslips (lista + upload para RH).
- **Fase 5:** Página /app/admin/users (listar membros, convidar, editar role).
- **Fase 6:** Migrations teams/team_members, RLS, página /app/org-chart.
- **Fase 7:** Script seed e documento de teste de permissões.
