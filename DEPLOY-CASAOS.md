# Deploy no CasaOS

O app roda como um único container: o Express serve o frontend estático (`dist/`)
e as rotas `/api/*` na mesma porta, então não há CORS nem proxy para configurar.
Como o container fica na mesma máquina do Postgres, o banco continua acessível
apenas pelo tailnet.

## 1. Clonar na máquina do CasaOS

```bash
git clone https://github.com/pedroboralli/crypto-portfolio.git
cd crypto-portfolio
```

## 2. Criar o `.env`

O `.env` é gitignored, então precisa ser criado na máquina:

```bash
cp .env.example .env
nano .env
```

Preencha:

```
POSTGRES_URL=http://100.101.132.16:5432
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
JWT_SECRET=...        # gere um novo: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
NODE_ENV=production
```

`POSTGRES_URL` pode continuar com o IP do Tailscale — funciona de dentro do
container. Se preferir não sair pela interface do tailnet, troque por
`http://host.docker.internal:5432` (o `extra_hosts` do compose já está pronto)
ou, se o Postgres for um container do CasaOS, use o nome dele na rede Docker.

## 3. Subir

```bash
docker compose up -d --build
```

O CasaOS detecta o container e o mostra no dashboard. Acesse em
`http://<ip-da-maquina>:3000` ou `http://100.101.132.16:3000` pelo tailnet.

Verificar:

```bash
docker compose logs -f crypto-portfolio
curl http://localhost:3000/api/health
```

## 4. Migrations

Se o schema ainda não foi aplicado, rode os arquivos de `supabase/migrations/`
contra o banco:

```bash
psql "$POSTGRES_URL" -f supabase/migrations/001_initial_schema.sql
psql "$POSTGRES_URL" -f supabase/migrations/002_rls_policies.sql
```

## 5. HTTPS pelo tailnet (opcional)

```bash
tailscale serve --bg 3000
```

Passa a servir em `https://<maquina>.<tailnet>.ts.net` com certificado válido,
sem expor nada para fora do tailnet. (`tailscale funnel` publicaria na internet —
não use aqui, já que o objetivo é manter o acesso privado.)

## Atualizar

```bash
git pull && docker compose up -d --build
```
