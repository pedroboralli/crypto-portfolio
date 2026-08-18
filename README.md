# Crypto Portfolio Tracker

Aplicativo completo para rastreamento de portfólio de criptomoedas com suporte a múltiplas blockchains (Ethereum, Arbitrum, Polygon e Bitcoin). Visualize seus saldos, preços em tempo real em BRL e análise detalhada de distribuição de assets.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

## 🚀 Funcionalidades

### ✨ Principais Features

- **Suporte Multi-Chain**: Ethereum, Arbitrum, Polygon, BNB Chain (EVM) e Bitcoin
- **Preços em Tempo Real**: Integração com CoinGecko API para cotações em BRL
- **Detecção Automática de Tokens**: Identifica automaticamente tokens ERC-20 populares
- **Dashboard Interativo**: Visualização completa com gráficos e estatísticas
- **Validação de Endereços**: Validação robusta para endereços EVM e Bitcoin
- **Cache Inteligente**: Sistema de cache para otimizar requisições (TTL: 60s)
- **UI Responsiva**: Interface mobile-first com TailwindCSS
- **Loading States**: Skeleton loaders e feedback visual durante carregamento
- **Error Handling**: Tratamento de erros com mensagens amigáveis

### 📊 Informações Exibidas

- Valor total do portfólio em BRL e USD
- Lista de assets por blockchain
- Quantidade, preço unitário e valor total de cada token
- Percentual de cada asset no portfólio
- Variação de preço 24h
- Gráfico de distribuição (pizza)
- Estatísticas rápidas (número de chains, total de assets)

## 🏗️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Blockchain**: ethers.js v6
- **HTTP Client**: axios
- **Cache**: node-cache
- **Env Management**: dotenv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **HTTP Client**: axios

### APIs Externas
- **RPC Providers**: Alchemy/Infura (opcional) ou endpoints públicos
- **Preços**: CoinGecko API (gratuita, sem API key)
- **Bitcoin**: Blockchain.com API / Blockstream API

### DevOps
- **Containerização**: Docker
- **Orquestração**: Docker Compose
- **Web Server**: Nginx (frontend)

## 📁 Estrutura do Projeto

```
crypto-portfolio/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Servidor Express
│   │   ├── services/
│   │   │   ├── evmService.js        # Serviços EVM (Ethereum, Arbitrum, Polygon)
│   │   │   ├── bitcoinService.js    # Serviço Bitcoin
│   │   │   └── priceService.js      # Integração CoinGecko
│   │   ├── controllers/
│   │   │   └── portfolioController.js  # Lógica de negócio
│   │   └── routes/
│   │       └── portfolioRoutes.js   # Rotas da API
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Componente principal
│   │   ├── main.jsx                 # Entry point
│   │   ├── index.css                # Estilos globais
│   │   ├── components/
│   │   │   ├── WalletInput.jsx      # Input de endereço
│   │   │   ├── PortfolioDashboard.jsx  # Dashboard principal
│   │   │   ├── AssetList.jsx        # Tabela de assets
│   │   │   └── ChainSection.jsx     # Seção por blockchain
│   │   └── services/
│   │       └── api.js               # Cliente HTTP
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── docker-compose.yml
└── README.md
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 18+ e npm
- Docker e Docker Compose (opcional, para execução containerizada)
- Git

### Opção 1: Execução Local (Desenvolvimento)

#### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd crypto-portfolio
```

#### 2. Configure o Backend

```bash
cd backend

# Instale dependências
npm install

# Configure variáveis de ambiente (opcional)
cp .env.example .env
# Edite o arquivo .env com suas API keys (opcional)

# Inicie o servidor em modo desenvolvimento
npm run dev
```

O backend estará disponível em `http://localhost:3001`

#### 3. Configure o Frontend

Em outro terminal:

```bash
cd frontend

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Opção 2: Execução com Docker Compose (Produção)

#### 1. Configure variáveis de ambiente (opcional)

Crie um arquivo `.env` na raiz do projeto:

```env
# Opcional: API Keys para RPC providers
ALCHEMY_API_KEY=your_alchemy_key
INFURA_API_KEY=your_infura_key
```

#### 2. Build e execute os containers

```bash
# Baixa a imagem publicada no GHCR e inicia os containers
docker compose up -d

# Ou, para compilar a imagem localmente em vez de baixar
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

> Em produção o deploy é automático: cada push na `main` publica a imagem no
> GHCR e o Watchtower atualiza o container. Veja [DEPLOY-CASAOS.md](DEPLOY-CASAOS.md).

#### 3. Acesse a aplicação

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

#### 4. Parar os containers

```bash
docker-compose down

# Para remover volumes também
docker-compose down -v
```

## 📡 API Endpoints

### POST `/api/portfolio`

Busca portfólio completo para um ou mais endereços.

**Request Body:**

```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

Ou com endereços separados:

```json
{
  "evmAddress": "0x...",
  "btcAddress": "1..."
}
```

**Response:**

```json
{
  "addresses": {
    "evm": "0x...",
    "bitcoin": null
  },
  "totalValueBRL": 125430.50,
  "totalValueUSD": 25000.00,
  "chains": [
    {
      "chain": "Ethereum",
      "chainId": "ethereum",
      "totalValueBRL": 100000.00,
      "assets": [
        {
          "symbol": "ETH",
          "name": "Ethereum",
          "balance": "10.5",
          "decimals": 18,
          "priceBRL": 9523.81,
          "priceUSD": 2000.00,
          "valueBRL": 100000.00,
          "portfolioPercentage": 79.73,
          "priceChange24h": 2.5,
          "isNative": true,
          "coingeckoId": "ethereum"
        }
      ]
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "cached": false
}
```

### GET `/api/prices?symbols=ETH,BTC,MATIC`

Busca preços de criptomoedas em BRL.

**Response:**

```json
{
  "prices": {
    "ETH": {
      "brl": 9523.81,
      "usd": 2000.00,
      "brl_24h_change": 2.5,
      "market_cap_brl": 2400000000000
    },
    "BTC": {
      "brl": 238095.24,
      "usd": 50000.00,
      "brl_24h_change": -1.2,
      "market_cap_brl": 9500000000000
    }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### POST `/api/portfolio/clear-cache`

Limpa o cache do portfólio.

### GET `/api/health`

Health check do backend.

## 🔧 Configuração

### Variáveis de Ambiente - Backend

Crie um arquivo `.env` no diretório `backend/`:

```env
# Server
PORT=3001
NODE_ENV=development

# Optional: RPC Provider API Keys
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key

# Optional: Custom RPC URLs
ETHEREUM_RPC_URL=https://eth.public-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
POLYGON_RPC_URL=https://polygon-rpc.com

# Cache
CACHE_TTL=60
```

### Variáveis de Ambiente - Frontend

Crie um arquivo `.env` no diretório `frontend/`:

```env
VITE_API_URL=http://localhost:3001
```

## 🎨 Customização

### Adicionar Novos Tokens ERC-20

Edite `backend/src/services/evmService.js` e adicione o token na lista correspondente:

```javascript
tokens: [
  {
    address: '0x...',
    coingeckoId: 'token-id'
  }
]
```

### Adicionar Nova Chain EVM

Adicione uma nova entrada no objeto `CHAINS` em `evmService.js`:

```javascript
newchain: {
  name: 'New Chain',
  rpcUrl: 'https://rpc.newchain.com',
  nativeToken: {
    symbol: 'NEW',
    name: 'New Chain',
    decimals: 18,
    coingeckoId: 'new-chain'
  },
  tokens: [...]
}
```

### Customizar Cores e Tema

Edite `frontend/tailwind.config.js` para personalizar o tema:

```javascript
colors: {
  primary: {
    // Suas cores personalizadas
  }
}
```

## 🧪 Testes

### Endereços de Teste

Use estes endereços públicos para testar a aplicação:

- **Vitalik.eth**: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- **Endereço Bitcoin de exemplo**: Consulte explorers públicos

## 📝 Tokens Suportados

### Ethereum
- ETH (nativo)
- USDT, USDC, DAI
- WBTC, WETH
- LINK, UNI
- MATIC, SHIB, stETH

### Arbitrum
- ETH (nativo)
- USDT, USDC, USDC.e
- DAI, WBTC, WETH
- LINK, UNI, ARB

### Polygon
- MATIC (nativo)
- USDT, USDC, USDC.e
- DAI, WBTC, WETH
- LINK, UNI, WMATIC

### BNB Chain
- BNB (nativo)
- USDT, USDC, BUSD
- DAI, BTCB, ETH
- WBNB, CAKE, XVS, ADA

### Bitcoin
- BTC (nativo)

## 🐛 Troubleshooting

### Backend não inicia

- Verifique se a porta 3001 está livre
- Confirme que o Node.js 18+ está instalado
- Verifique logs: `docker-compose logs backend`

### Frontend não se conecta ao backend

- Confirme que o backend está rodando
- Verifique a variável `VITE_API_URL` no frontend
- Verifique se há erros de CORS nos logs

### Saldos não aparecem

- Verifique se o endereço é válido
- Confirme que há saldo nas chains suportadas
- RPC providers públicos podem ter rate limits

### Preços não atualizam

- CoinGecko API gratuita tem rate limit (50 req/min)
- Cache padrão é 60 segundos
- Use o botão "Atualizar" para forçar refresh

## 🔒 Segurança

### Boas Práticas Implementadas

- Validação de entrada em todas as rotas
- Sanitização de endereços
- Rate limiting (implícito via cache)
- Headers de segurança no nginx
- Containers com usuários não-root
- Secrets via variáveis de ambiente
- HTTPS recomendado em produção

### Recomendações para Produção

1. Use HTTPS/TLS
2. Configure rate limiting (ex: nginx)
3. Use API keys privadas para RPC providers
4. Implemente autenticação se necessário
5. Configure firewall e WAF
6. Monitore logs e métricas

## 📈 Performance

### Otimizações Implementadas

- Cache de 60s para resultados de portfólio
- Cache de 60s para preços
- Requisições paralelas para múltiplas chains
- Lazy loading de componentes
- Code splitting no build
- Compressão gzip no nginx
- Assets estáticos com cache longo

### Limites e Considerações

- **CoinGecko API**: 50 requisições/minuto (tier gratuito)
- **RPC Públicos**: Rate limits variáveis
- **Cache**: Pode exibir dados defasados (máx 60s)

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## 🙏 Agradecimentos

- [CoinGecko](https://www.coingecko.com/) - API de preços
- [ethers.js](https://ethers.org/) - Biblioteca Ethereum
- [Alchemy](https://www.alchemy.com/) & [Infura](https://infura.io/) - RPC providers
- [Blockchain.com](https://www.blockchain.com/) - API Bitcoin

## 📧 Contato

Para dúvidas ou sugestões, abra uma issue no GitHub.

---

Desenvolvido com ❤️ usando React + Node.js
