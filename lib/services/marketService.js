import axios from 'axios';

/**
 * Fetches the top 100 cryptocurrencies by market cap from CoinGecko.
 * Cache removido — serverless stateless. Considere Vercel Edge Cache via headers.
 */
export async function getGlobalTop100() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: '1h,24h,7d',
      },
      timeout: 8000,
    });

    return response.data ?? [];
  } catch (error) {
    console.error('Error fetching global top 100:', error.message);
    throw error;
  }
}
