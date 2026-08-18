import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Cache de preços em memória.
 *
 * O CoinGecko gratuito limita agressivamente (429) e antes disso o fallback
 * devolvia preços zerados — o portfólio inteiro virava R$ 0,00 a cada
 * "Atualizar". Agora guardamos o último preço bom de cada moeda e o
 * reutilizamos quando a API falha, marcando a entrada como `stale`.
 *
 * TTL curto para respostas frescas; o valor antigo continua disponível
 * indefinidamente como rede de segurança.
 */
const FRESH_TTL_MS = 60 * 1000;
const priceCache = new Map(); // coingeckoId -> { price, fetchedAt }

function readCache(id) {
  return priceCache.get(id) || null;
}

function writeCache(id, price) {
  priceCache.set(id, { price, fetchedAt: Date.now() });
}

function isFresh(entry) {
  return entry && Date.now() - entry.fetchedAt < FRESH_TTL_MS;
}

function emptyPrice() {
  return { brl: 0, usd: 0, brl_24h_change: 0, market_cap_brl: 0, error: true };
}

/**
 * Busca preços de múltiplas moedas em BRL e USD.
 * Nunca zera um preço que já foi conhecido: em caso de falha devolve o último
 * valor em cache marcado com `stale: true`.
 *
 * @param {string[]} coingeckoIds
 * @returns {Promise<Record<string, {brl, usd, brl_24h_change, market_cap_brl, stale?, error?}>>}
 */
export async function getPrices(coingeckoIds) {
  if (!coingeckoIds || coingeckoIds.length === 0) return {};

  const uniqueIds = [...new Set(coingeckoIds)];
  const prices = {};

  // Serve do cache o que ainda está fresco e busca só o restante
  const idsToFetch = [];
  for (const id of uniqueIds) {
    const entry = readCache(id);
    if (isFresh(entry)) {
      prices[id] = { ...entry.price };
    } else {
      idsToFetch.push(id);
    }
  }

  if (idsToFetch.length === 0) return prices;

  try {
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: idsToFetch.join(','),
        vs_currencies: 'brl,usd',
        include_24hr_change: true,
        include_market_cap: true,
      },
      timeout: 8000,
    });

    for (const id of idsToFetch) {
      const data = response.data?.[id];

      // A CoinGecko omite ids desconhecidos; não trate isso como preço zero
      if (!data || (data.brl == null && data.usd == null)) {
        const cached = readCache(id);
        prices[id] = cached ? { ...cached.price, stale: true } : emptyPrice();
        continue;
      }

      const price = {
        brl: data.brl || 0,
        usd: data.usd || 0,
        brl_24h_change: data.brl_24h_change || 0,
        market_cap_brl: data.brl_market_cap || 0,
      };
      writeCache(id, price);
      prices[id] = { ...price };
    }

    return prices;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error.message);

    // Fallback: último preço conhecido (marcado como stale) em vez de zero
    for (const id of idsToFetch) {
      const cached = readCache(id);
      prices[id] = cached ? { ...cached.price, stale: true } : emptyPrice();
    }
    return prices;
  }
}

export async function getPrice(coingeckoId) {
  const prices = await getPrices([coingeckoId]);
  return prices[coingeckoId] || emptyPrice();
}

export function convertToBRL(amount, priceInBRL) {
  return parseFloat(amount) * priceInBRL;
}

export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
