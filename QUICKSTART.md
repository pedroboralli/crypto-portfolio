# Quick Start — Crypto Portfolio (Vercel + Supabase)

## Pré-requisitos

- **Node.js** 18+
- **Vercel CLI** (já instalado via `npm install -g vercel`)
- **Conta Supabase** com o projeto criado

---

## 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

```env
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=<gere com o comando abaixo>
```

Para gerar um `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 2. Banco de dados (Supabase)

No **SQL Editor** do seu projeto Supabase, execute em ordem:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

---

## 3. Rodar localmente

```bash
vercel dev
```

Acesse: **http://localhost:3000**

> O `vercel dev` roda o frontend (Vite) e as API Functions juntos,
> simulando exatamente o ambiente de produção da Vercel.

---

## 4. Deploy na Vercel

```bash
# Primeira vez
vercel

# Deploys subsequentes
vercel --prod
```

Configure as mesmas variáveis de `.env.local` no painel:
**Vercel Dashboard → Projeto → Settings → Environment Variables**
