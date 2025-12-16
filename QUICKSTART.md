# Guia Rápido - Crypto Portfolio

## 🚀 Início Rápido (5 minutos)

### Opção 1: Docker Compose (Recomendado)

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd crypto-portfolio

# 2. (Opcional) Configure API keys
cp .env.example .env
# Edite .env e adicione suas API keys (opcional)

# 3. Inicie a aplicação
docker-compose up -d

# 4. Acesse
# Frontend: http://localhost
# Backend: http://localhost:3001
```

### Opção 2: Desenvolvimento Local

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## 📝 Como Usar

1. **Digite um endereço de wallet**:
   - EVM: `0x...` (Ethereum, Arbitrum, Polygon)
   - Bitcoin: `1...`, `3...` ou `bc1...`

2. **Clique em "Buscar Portfólio"**

3. **Visualize**:
   - Valor total em BRL
   - Distribuição de assets
   - Detalhes por blockchain

4. **Atualize**: Use o botão "Atualizar" para novos preços

## 🧪 Testar com Endereço Público

Use o endereço do Vitalik Buterin:
```
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

## 🛑 Parar a Aplicação

```bash
docker-compose down
```

## 📚 Mais Informações

Consulte o [README.md](README.md) completo para:
- Documentação detalhada da API
- Configurações avançadas
- Troubleshooting
- Customização

## 🆘 Problemas Comuns

**Porta já em uso:**
```bash
# Mude as portas no docker-compose.yml
ports:
  - "8080:80"  # Frontend
  - "3002:3001"  # Backend
```

**Backend não conecta:**
- Verifique se a porta 3001 está livre
- Confirme que o Docker está rodando

**Preços não aparecem:**
- CoinGecko tem rate limit (50 req/min)
- Aguarde 1 minuto entre requests

---

Dúvidas? Abra uma issue no GitHub!
