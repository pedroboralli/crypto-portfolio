# Deploy no CasaOS

O app roda como um único container: o Express serve o frontend estático (`dist/`)
e as rotas `/api/*` na mesma porta, então não há CORS nem proxy para configurar.
Como o container fica na mesma máquina do Postgres, o banco continua acessível
apenas pelo tailnet.

A imagem é compilada pelo GitHub Actions e publicada no GHCR; a box só baixa a
imagem pronta. Veja [Deploy automático](#deploy-automático).

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

O `.env` fica só na máquina e é lido em runtime — nada dele entra na imagem.

## 3. Subir

```bash
docker compose up -d
```

Isso baixa a imagem do GHCR e sobe dois containers: o `crypto-portfolio` e o
`watchtower`, que cuida das atualizações automáticas.

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

As migrations **não** são aplicadas pelo deploy automático — rode à mão quando
adicionar uma nova.

## 5. HTTPS pelo tailnet (opcional)

```bash
tailscale serve --bg 3000
```

Passa a servir em `https://<maquina>.<tailnet>.ts.net` com certificado válido,
sem expor nada para fora do tailnet. (`tailscale funnel` publicaria na internet —
não use aqui, já que o objetivo é manter o acesso privado.)

## Deploy automático

Fluxo a cada push na `main`:

1. `.github/workflows/deploy.yml` compila a imagem e publica em
   `ghcr.io/pedroboralli/crypto-portfolio:latest` (mais uma tag `sha-<commit>`).
2. O Watchtower na box consulta o GHCR a cada 60s, vê o digest novo, baixa a
   imagem e recria o container com a mesma configuração.

Nenhuma porta é aberta para a internet: quem inicia a conexão é sempre a box.
Se o build falhar, o Actions não publica nada e a box continua rodando a versão
anterior.

### Configuração inicial (uma vez só)

O primeiro push cria o package no GHCR como **privado**. Para a box baixar sem
credencial, deixe-o público:

> GitHub → seu perfil → **Packages** → `crypto-portfolio` → **Package settings**
> → **Change visibility** → **Public**

A imagem não contém segredo algum (o `.env` está no `.dockerignore` e o código
já é público), então publicá-la não expõe nada a mais.

Preferindo manter o package privado, autentique a box com um PAT de escopo
`read:packages` e dê ao Watchtower acesso ao mesmo login:

```bash
echo "$GHCR_PAT" | docker login ghcr.io -u pedroboralli --password-stdin
```

e monte a credencial no serviço `watchtower` do compose:

```yaml
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ~/.docker/config.json:/config.json:ro
```

### Acompanhar um deploy

```bash
docker logs -f watchtower                       # quando detecta e atualiza
docker compose logs -f crypto-portfolio         # o app depois de subir
docker inspect -f '{{.Config.Image}} {{.Created}}' crypto-portfolio
```

### Forçar uma atualização agora

Sem esperar o intervalo de 60s:

```bash
docker compose pull && docker compose up -d
```

### Voltar para uma versão anterior

As tags `sha-<commit>` ficam guardadas no GHCR:

```bash
docker compose down crypto-portfolio
docker run -d --name crypto-portfolio --restart unless-stopped \
  -p 3000:3000 --env-file .env \
  ghcr.io/pedroboralli/crypto-portfolio:sha-abc1234
```

Depois de corrigir o problema e dar push, volte ao fluxo normal com
`docker compose up -d`.

### Compilar na própria box

Para testar uma alteração antes do push, sem passar pelo GHCR:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

O Watchtower ignora essa imagem local. Para voltar ao deploy automático:

```bash
docker compose up -d
```
