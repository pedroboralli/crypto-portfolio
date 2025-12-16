import axios from 'axios';
import NodeCache from 'node-cache';

// Cache market data for 5 minutes to avoid rate limits
const marketCache = new NodeCache({ stdTTL: 300 });

/**
 * Fetches the top 100 cryptocurrencies by market cap
 */
export async function getGlobalTop100() {
    const cacheKey = 'global_top_100';
    const cachedData = marketCache.get(cacheKey);

    if (cachedData) {
        console.log('Using cached global top 100 data');
        return cachedData;
    }

    try {
        console.log('Fetching global top 100 from CoinGecko...');
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: '1h,24h,7d'
            },
            timeout: 10000
        });

        if (response.data && response.data.length > 0) {
            marketCache.set(cacheKey, response.data);
            console.log('✓ Global top 100 fetched and cached');
            return response.data;
        }

        return [];
    } catch (error) {
        console.error('Error fetching global top 100:', error.message);
        throw error;
    }
}
