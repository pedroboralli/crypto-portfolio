import axios from 'axios';
import NodeCache from 'node-cache';

// Cache de preços (TTL configurável via env, padrão 60 segundos)
const priceCache = new NodeCache({ stdTTL: process.env.CACHE_TTL || 60 });

// Base URL da API do CoinGecko (API pública, sem necessidade de key)
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

/**
 * Busca preços de múltiplas moedas em BRL
 * @param {string[]} coingeckoIds - Array de IDs do CoinGecko
 * @returns {Object} Objeto com preços indexados por ID
 */
export async function getPrices(coingeckoIds) {
  if (!coingeckoIds || coingeckoIds.length === 0) {
    return {};
  }

  // Remove duplicatas
  const uniqueIds = [...new Set(coingeckoIds)];

  // Verifica cache
  const cacheKey = uniqueIds.sort().join(',');
  const cachedPrices = priceCache.get(cacheKey);

  if (cachedPrices) {
    console.log('Returning cached prices');
    return cachedPrices;
  }

  try {
    // Faz requisição para CoinGecko
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: uniqueIds.join(','),
        vs_currencies: 'brl,usd',
        include_24hr_change: true,
        include_market_cap: true
      },
      timeout: 10000
    });

    const prices = {};

    // Formata resposta
    for (const [id, data] of Object.entries(response.data)) {
      prices[id] = {
        brl: data.brl || 0,
        usd: data.usd || 0,
        brl_24h_change: data.brl_24h_change || 0,
        market_cap_brl: data.brl_market_cap || 0
      };
    }

    // Salva no cache
    priceCache.set(cacheKey, prices);

    return prices;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error.message);

    // Se falhar, retorna preços zerados para não quebrar a aplicação
    const fallbackPrices = {};
    uniqueIds.forEach(id => {
      fallbackPrices[id] = {
        brl: 0,
        usd: 0,
        brl_24h_change: 0,
        market_cap_brl: 0,
        error: true
      };
    });

    return fallbackPrices;
  }
}

/**
 * Busca preço de uma única moeda
 * @param {string} coingeckoId - ID do CoinGecko
 * @returns {Object} Objeto com preço e informações
 */
export async function getPrice(coingeckoId) {
  const prices = await getPrices([coingeckoId]);
  return prices[coingeckoId] || {
    brl: 0,
    usd: 0,
    brl_24h_change: 0,
    market_cap_brl: 0,
    error: true
  };
}

/**
 * Busca informações detalhadas de uma moeda
 */
export async function getCoinInfo(coingeckoId) {
  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coingeckoId}`,
      {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        },
        timeout: 10000
      }
    );

    return {
      id: response.data.id,
      symbol: response.data.symbol,
      name: response.data.name,
      image: response.data.image?.small,
      current_price_brl: response.data.market_data?.current_price?.brl || 0,
      current_price_usd: response.data.market_data?.current_price?.usd || 0,
      market_cap_brl: response.data.market_data?.market_cap?.brl || 0,
      price_change_24h: response.data.market_data?.price_change_percentage_24h || 0,
      price_change_7d: response.data.market_data?.price_change_percentage_7d || 0,
      price_change_30d: response.data.market_data?.price_change_percentage_30d || 0,
      total_volume_brl: response.data.market_data?.total_volume?.brl || 0,
      circulating_supply: response.data.market_data?.circulating_supply || 0,
      total_supply: response.data.market_data?.total_supply || 0
    };
  } catch (error) {
    console.error(`Error fetching info for ${coingeckoId}:`, error.message);
    throw error;
  }
}

/**
 * Limpa o cache de preços
 */
export function clearPriceCache() {
  priceCache.flushAll();
  console.log('Price cache cleared');
}

/**
 * Busca lista de moedas suportadas pelo CoinGecko
 */
export async function getSupportedCoins() {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/list`, {
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching supported coins:', error.message);
    throw error;
  }
}

/**
 * Converte valor de uma moeda para BRL
 */
export function convertToBRL(amount, priceInBRL) {
  return parseFloat(amount) * priceInBRL;
}

/**
 * Formata valor em BRL
 */
export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
