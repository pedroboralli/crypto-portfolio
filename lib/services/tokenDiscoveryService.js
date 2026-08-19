import { ethers } from 'ethers';

/**
 * Descoberta dos tokens que a carteira realmente possui.
 *
 * A lista estática de tokenListService cobre só as moedas principais (~46
 * contratos), então tudo fora dela ficava invisível no portfólio. Aqui
 * consultamos o indexador público do Blockscout, que devolve saldo, decimais e
 * cotação de cada token que o endereço carrega — sem exigir API key.
 *
 * A consulta é best-effort: tem orçamento de tempo curto e, se estourar, a
 * sincronização segue com a lista estática enquanto a busca termina em segundo
 * plano e preenche o cache para a próxima vez.
 */

const BLOCKSCOUT_HOSTS = {
  ethereum: 'https://eth.blockscout.com',
  polygon: 'https://polygon.blockscout.com',
  arbitrum: 'https://arbitrum.blockscout.com',
};

const CACHE_TTL_MS = 10 * 60 * 1000;
// Quanto a sincronização espera pela descoberta antes de seguir sem ela
const BUDGET_MS = 9000;
// Quanto a busca continua rodando em segundo plano para popular o cache
const REQUEST_TIMEOUT_MS = 25000;
// Teto de tokens por rede: um endereço antigo acumula centenas de airdrops
const MAX_TOKENS_PER_CHAIN = 60;
// Poeira sem valor só polui a lista de ativos
const MIN_USD_VALUE = 0.01;
// Um token sem mercado tem cotação de fachada: o indexador chega a marcar
// US$ 400 mil num airdrop que negociou US$ 11 em 24h. Somar isso ao patrimônio
// inflaria o saldo total, então exigimos um mercado minimamente real.
const MIN_VOLUME_24H_USD = 10000;
// E a posição não pode ser absurdamente maior do que o mercado inteiro negocia
const MAX_VALUE_TO_VOLUME_RATIO = 10;

const cache = new Map(); // `${chainId}:${address}` -> { tokens, fetchedAt }
const inFlight = new Map(); // mesma chave -> Promise, evita busca duplicada

const TIMED_OUT = Symbol('timed-out');

export function isDiscoverySupported(chainId) {
  return Boolean(BLOCKSCOUT_HOSTS[chainId]);
}

/**
 * @returns {Promise<{tokens: Array, available: boolean}>} available=false
 *   significa que não temos dado algum (nem cache) para esta rede agora.
 */
export async function discoverTokens(address, chainId) {
  // Rede sem indexador não é falha: a lista estática continua valendo
  if (!isDiscoverySupported(chainId)) return { tokens: [], available: true };

  const key = `${chainId}:${address.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { tokens: cached.tokens, available: true };
  }

  let pending = inFlight.get(key);
  if (!pending) {
    pending = fetchTokenBalances(address, chainId)
      .then((tokens) => {
        cache.set(key, { tokens, fetchedAt: Date.now() });
        return tokens;
      })
      .catch((error) => {
        console.error(`Token discovery failed for ${chainId}:`, error.message);
        return null;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }

  const result = await Promise.race([pending, delay(BUDGET_MS).then(() => TIMED_OUT)]);

  if (result === TIMED_OUT || result === null) {
    // Cache vencido ainda é melhor que nada; a busca segue em segundo plano
    return cached
      ? { tokens: cached.tokens, available: true }
      : { tokens: [], available: false };
  }

  return { tokens: result, available: true };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTokenBalances(address, chainId) {
  const host = BLOCKSCOUT_HOSTS[chainId];
  const response = await fetch(`${host}/api/v2/addresses/${address}/token-balances`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const body = await response.json();
  if (!Array.isArray(body)) throw new Error('Unexpected response shape');

  return body
    .map((entry) => toAsset(entry))
    .filter(Boolean)
    .sort((a, b) => b.valueUSD - a.valueUSD)
    .slice(0, MAX_TOKENS_PER_CHAIN);
}

function toAsset(entry) {
  const token = entry?.token;
  if (!token || token.type !== 'ERC-20') return null;
  if (token.reputation === 'scam') return null;
  if (!token.address_hash || token.decimals == null) return null;

  // Sem cotação não dá para valorizar, e quase sempre é airdrop sem mercado
  const priceUSD = Number(token.exchange_rate);
  if (!Number.isFinite(priceUSD) || priceUSD <= 0) return null;

  const decimals = Number(token.decimals);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null;

  let balance;
  try {
    balance = ethers.formatUnits(entry.value ?? '0', decimals);
  } catch {
    return null;
  }

  const valueUSD = parseFloat(balance) * priceUSD;
  if (!(valueUSD >= MIN_USD_VALUE)) return null;

  const volume24h = Number(token.volume_24h);
  if (!Number.isFinite(volume24h) || volume24h < MIN_VOLUME_24H_USD) return null;
  if (valueUSD > volume24h * MAX_VALUE_TO_VOLUME_RATIO) return null;

  return {
    symbol: token.symbol || '???',
    name: token.name || token.symbol || 'Token',
    balance,
    decimals,
    address: token.address_hash,
    isNative: false,
    image: token.icon_url || null,
    // Sem coingeckoId: a cotação vem do próprio indexador
    priceUSDSource: priceUSD,
    valueUSD,
  };
}
