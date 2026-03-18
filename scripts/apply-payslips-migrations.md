# Aplicar migrations dos holerites (Fase 4)

O projeto precisa estar linkado ao Supabase para `db push`. Duas opções:

## Opção 1: Supabase CLI (recomendado)

```bash
# Uma vez: vincular ao projeto (pede ref e senha do DB)
npx supabase link --project-ref SEU_PROJECT_REF

# Aplicar todas as migrations pendentes
npx supabase db push
```

## Opção 2: Dashboard do Supabase

1. Acesse o projeto no [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Execute na ordem:
   - Conteúdo de `supabase/migrations/005_payslips.sql`
   - Conteúdo de `supabase/migrations/006_storage_payslips_bucket.sql`

Depois disso, a rota `/app/payslips` e o bucket `payslips` estarão ativos.
