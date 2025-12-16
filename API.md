# Documentação da API

## Base URL

```
http://localhost:3001/api
```

## Endpoints

### 1. Buscar Portfólio

Busca saldos de todas as blockchains suportadas para um ou mais endereços.

**Endpoint:** `POST /api/portfolio`

**Request Body:**

Opção 1 - Endereço único (EVM):
```json
{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
}
```

Opção 2 - Endereços separados:
```json
{
  "evmAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "btcAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

**Response:** `200 OK`

```json
{
  "addresses": {
    "evm": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
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
        },
        {
          "symbol": "USDT",
          "name": "Tether USD",
          "balance": "5000.0",
          "decimals": 6,
          "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          "priceBRL": 5.00,
          "priceUSD": 1.00,
          "valueBRL": 25000.00,
          "portfolioPercentage": 19.93,
          "priceChange24h": 0.1,
          "isNative": false,
          "coingeckoId": "tether"
        }
      ]
    },
    {
      "chain": "Arbitrum",
      "chainId": "arbitrum",
      "totalValueBRL": 430.50,
      "assets": [...]
    },
    {
      "chain": "Polygon",
      "chainId": "polygon",
      "totalValueBRL": 0,
      "assets": []
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z",
  "cached": false
}
```

**Errors:**

```json
// 400 Bad Request - Endereço inválido
{
  "error": {
    "message": "Invalid EVM address format"
  }
}

// 500 Internal Server Error
{
  "error": {
    "message": "Failed to fetch portfolio",
    "details": "..." // Apenas em development
  }
}
```

---

### 2. Buscar Preços

Busca preços atualizados de criptomoedas em BRL e USD.

**Endpoint:** `GET /api/prices`

**Query Parameters:**
- `symbols` (string, required): Símbolos separados por vírgula

**Exemplo:**
```
GET /api/prices?symbols=ETH,BTC,MATIC,USDT
```

**Response:** `200 OK`

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
    },
    "MATIC": {
      "brl": 4.76,
      "usd": 1.00,
      "brl_24h_change": 5.3,
      "market_cap_brl": 45000000000
    },
    "USDT": {
      "brl": 5.00,
      "usd": 1.00,
      "brl_24h_change": 0.1,
      "market_cap_brl": 470000000000
    }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Símbolos Suportados:**
- `ETH` - Ethereum
- `BTC` - Bitcoin
- `BNB` - BNB
- `MATIC` - Polygon
- `USDT` - Tether
- `USDC` - USD Coin
- `BUSD` - Binance USD
- `DAI` - Dai
- `WBTC` - Wrapped Bitcoin
- `BTCB` - Bitcoin BEP2
- `WETH` - Wrapped Ether
- `WBNB` - Wrapped BNB
- `LINK` - Chainlink
- `UNI` - Uniswap
- `ARB` - Arbitrum
- `CAKE` - PancakeSwap
- `XVS` - Venus
- `SHIB` - Shiba Inu
- `STETH` - Staked Ether
- `WMATIC` - Wrapped Matic
- `ADA` - Cardano (BEP20)

**Errors:**

```json
// 400 Bad Request
{
  "error": {
    "message": "symbols parameter is required"
  }
}

// 400 Bad Request - Símbolos inválidos
{
  "error": {
    "message": "No valid symbols provided"
  }
}
```

---

### 3. Limpar Cache

Limpa o cache de portfólios no backend.

**Endpoint:** `POST /api/portfolio/clear-cache`

**Request Body:** Nenhum

**Response:** `200 OK`

```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### 4. Health Check

Verifica status da API e informações do sistema.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "cache": {
    "keys": 5,
    "stats": {
      "hits": 42,
      "misses": 8,
      "keys": 5,
      "ksize": 5,
      "vsize": 15000
    }
  },
  "environment": "production"
}
```

---

## Rate Limits

### CoinGecko API
- **Limite:** 50 requisições/minuto (tier gratuito)
- **Cache:** 60 segundos (configurável via `CACHE_TTL`)

### RPC Providers Públicos
- **Ethereum:** ~10 req/s
- **Arbitrum:** ~10 req/s
- **Polygon:** ~10 req/s
- **BNB Chain:** ~10 req/s

**Recomendação:** Use API keys privadas (Alchemy/Infura) para maior throughput.

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida (endereço inválido, parâmetros faltando) |
| 404 | Rota não encontrada |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |
| 503 | Serviço temporariamente indisponível |

---

## Cache

A API implementa cache automático para otimizar performance:

- **Portfólios:** 60 segundos
- **Preços:** 60 segundos

Para forçar atualização, use o endpoint `/api/portfolio/clear-cache`.

---

## Exemplos com cURL

### Buscar Portfólio

```bash
curl -X POST http://localhost:3001/api/portfolio \
  -H "Content-Type: application/json" \
  -d '{"address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
```

### Buscar Preços

```bash
curl "http://localhost:3001/api/prices?symbols=ETH,BTC,MATIC"
```

### Limpar Cache

```bash
curl -X POST http://localhost:3001/api/portfolio/clear-cache
```

### Health Check

```bash
curl http://localhost:3001/api/health
```

---

## Exemplos com JavaScript (Fetch API)

### Buscar Portfólio

```javascript
async function getPortfolio(address) {
  const response = await fetch('http://localhost:3001/api/portfolio', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch portfolio');
  }

  return await response.json();
}

// Uso
getPortfolio('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Buscar Preços

```javascript
async function getPrices(symbols) {
  const response = await fetch(
    `http://localhost:3001/api/prices?symbols=${symbols.join(',')}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }

  return await response.json();
}

// Uso
getPrices(['ETH', 'BTC', 'MATIC'])
  .then(data => console.log(data.prices))
  .catch(error => console.error(error));
```

---

## Blockchains Suportadas

### Ethereum (ethereum)
- **RPC Público:** https://eth.public-rpc.com
- **Chain ID:** 1
- **Token Nativo:** ETH

### Arbitrum (arbitrum)
- **RPC Público:** https://arb1.arbitrum.io/rpc
- **Chain ID:** 42161
- **Token Nativo:** ETH

### Polygon (polygon)
- **RPC Público:** https://polygon-rpc.com
- **Chain ID:** 137
- **Token Nativo:** MATIC

### BNB Chain (bnb)
- **RPC Público:** https://bsc-dataseed.binance.org
- **Chain ID:** 56
- **Token Nativo:** BNB

### Bitcoin (bitcoin)
- **API:** Blockchain.com / Blockstream
- **Token Nativo:** BTC

---

## Erros Comuns

### "Invalid EVM address format"
O endereço fornecido não é um endereço Ethereum válido. Use formato: `0x...` (42 caracteres).

### "Invalid Bitcoin address format"
O endereço Bitcoin não é válido. Formatos aceitos:
- Legacy: `1...`
- SegWit: `3...`
- Bech32: `bc1...`

### "Failed to fetch portfolio"
Erro ao buscar dados das blockchains. Possíveis causas:
- RPC providers offline
- Rate limit excedido
- Endereço sem saldos

### Cache exibindo dados desatualizados
O cache padrão é 60 segundos. Use `/api/portfolio/clear-cache` para forçar atualização.

---

## Segurança

### Headers de Segurança Implementados
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block

### Validação de Entrada
- Endereços são validados antes do processamento
- Queries são sanitizadas
- Rate limiting via cache

### Recomendações
- Use HTTPS em produção
- Implemente autenticação se necessário
- Configure CORS adequadamente
- Use API keys privadas para RPC providers

---

Para mais informações, consulte o [README.md](README.md) principal.
