import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Busca preços de múltiplas moedas em BRL e USD.
 * Cache removido (serverless stateless) — CoinGecko tem rate limit generoso para requests agrupados.
 *
 * @param {string[]} coingeckoIds
 * @returns {Promise<Record<string, {brl, usd, brl_24h_change, market_cap_brl}>>}
 */
export async function getPrices(coingeckoIds) {
  if (!coingeckoIds || coingeckoIds.length === 0) return {};

  const uniqueIds = [...new Set(coingeckoIds)];

  try {
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: uniqueIds.join(','),
        vs_currencies: 'brl,usd',
        include_24hr_change: true,
        include_market_cap: true,
      },
      timeout: 8000,
    });

    const prices = {};
    for (const [id, data] of Object.entries(response.data)) {
      prices[id] = {
        brl: data.brl || 0,
        usd: data.usd || 0,
        brl_24h_change: data.brl_24h_change || 0,
        market_cap_brl: data.brl_market_cap || 0,
      };
    }
    return prices;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error.message);
    // Fallback com preços zerados para não quebrar o portfólio
    const fallback = {};
    uniqueIds.forEach((id) => {
      fallback[id] = { brl: 0, usd: 0, brl_24h_change: 0, market_cap_brl: 0, error: true };
    });
    return fallback;
  }
}

export async function getPrice(coingeckoId) {
  const prices = await getPrices([coingeckoId]);
  return prices[coingeckoId] || { brl: 0, usd: 0, brl_24h_change: 0, market_cap_brl: 0, error: true };
}

export function convertToBRL(amount, priceInBRL) {
  return parseFloat(amount) * priceInBRL;
}

export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
