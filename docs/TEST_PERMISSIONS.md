# QS Pulse – Roteiro de Teste de Permissões (Fase 7)

Este roteiro assume que:
- As migrations 001–007 já foram aplicadas.
- O seed `supabase/seed.sql` foi executado no projeto Supabase.
- O app está rodando em `http://localhost:3000`.

## 1. Executar o seed

No terminal, na pasta do projeto, use o cliente psql/supabase para rodar o seed (ambiente de **desenvolvimento**):

```bash
# Exemplo usando Supabase CLI (ajuste a URL/credenciais do seu projeto)
# AVISO: isso insere usuários e pode sobrescrever dados locais.

supabase db execute --file supabase/seed.sql
```

Ou copie o conteúdo de `supabase/seed.sql` e execute no **SQL Editor** do Supabase.

Depois do seed você terá:
- Org `Quantum Solutions`.
- Usuário **admin** (owner) com e-mail definido em `admin_email`.
- Usuário **colaborador** (employee) com e-mail definido em `employee_email`.

## 2. Login como ADMIN (owner)

1. Acesse `/login` e entre com o e-mail/senha de **admin**.
2. Você deve ser redirecionado para `/app/feed`.

### Verificações

- **Feed** (`/app/feed`)
  - Consegue criar post.
  - Consegue ver posts criados por ele mesmo.

- **Holerites** (`/app/payslips`)
  - Consegue ver lista de holerites da org.
  - Consegue enviar holerite para qualquer colaborador.

- **Admin Users** (`/app/admin/users`)
  - Consegue ver todos os membros da org.
  - Consegue convidar novo usuário por e-mail e definir role.
  - Consegue alterar role de um membro (exceto remover o último `owner`).

- **Org chart** (`/app/org-chart`)
  - Consegue criar times.
  - Consegue editar/excluir times.
  - Consegue adicionar/remover pessoas dos times.

## 3. Login como COLABORADOR (employee)

1. Faça logout ou abra janela anônima.
2. Acesse `/login` e entre com o e-mail/senha de **colaborador**.

### Verificações

- **Sidebar**
  - Deve ver: `Feed`, `Holerites`, `Org Chart`, `Configurações`.
  - **Não** deve ver o item `Usuários`.

- **Feed** (`/app/feed`)
  - Consegue ver posts da org.
  - **Não** vê formulário de criar post.

- **Holerites** (`/app/payslips`)
  - Vê **apenas** os próprios holerites.
  - Não vê botão de upload.

- **Admin Users** (`/app/admin/users`)
  - Se tentar acessar a URL diretamente, deve ser redirecionado para `/app/feed`.

- **Org chart** (`/app/org-chart`)
  - Consegue ver a árvore de times e membros.
  - **Não** vê botões de criar/editar/excluir time nem de adicionar/remover pessoas.

## 4. Regras gerais de navegação

- Usuário **não autenticado**
  - `/app/*` e `/onboarding` redirecionam para `/login`.
  - `/login` exibe formulário normalmente.

- Usuário autenticado
  - Acessar `/login` redireciona para `/app/feed`.

## 5. Dicas

- Use navegador em janela anônima para logar como usuários diferentes.
- Para resetar o estado local do banco em ambiente de desenvolvimento, use os comandos da Supabase CLI (por exemplo, `supabase db reset`) e depois rode o `supabase/seed.sql` novamente.

