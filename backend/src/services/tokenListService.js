import axios from 'axios';
import NodeCache from 'node-cache';

// Cache de listas de tokens (24 horas)
const tokenListCache = new NodeCache({ stdTTL: 86400 });

// Mapeamento de chain IDs para plataformas do CoinGecko
const CHAIN_TO_PLATFORM = {
    ethereum: 'ethereum',
    arbitrum: 'arbitrum-one',
    polygon: 'polygon-pos',
    bnb: 'binance-smart-chain'
};

// Fallback: Top tokens estáticos por chain (caso API falhe)
const STATIC_TOKEN_LISTS = {
    ethereum: [
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', coingeckoId: 'tether' },
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', coingeckoId: 'usd-coin' },
        { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', coingeckoId: 'dai' },
        { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', coingeckoId: 'wrapped-bitcoin' },
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', coingeckoId: 'weth' },
        { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', coingeckoId: 'chainlink' },
        { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', coingeckoId: 'uniswap' },
        { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', coingeckoId: 'matic-network' },
        { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', coingeckoId: 'shiba-inu' },
        { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', coingeckoId: 'staked-ether' }
    ],
    arbitrum: [
        { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', coingeckoId: 'tether' },
        { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', coingeckoId: 'usd-coin' },
        { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', coingeckoId: 'usd-coin' },
        { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', coingeckoId: 'dai' },
        { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', coingeckoId: 'wrapped-bitcoin' },
        { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', coingeckoId: 'weth' },
        { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', coingeckoId: 'chainlink' },
        { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', coingeckoId: 'uniswap' },
        { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', coingeckoId: 'arbitrum' }
    ],
    polygon: [
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', coingeckoId: 'tether' },
        { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', coingeckoId: 'usd-coin' },
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', coingeckoId: 'usd-coin' },
        { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', coingeckoId: 'dai' },
        { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', coingeckoId: 'wrapped-bitcoin' },
        { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', coingeckoId: 'weth' },
        { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', coingeckoId: 'chainlink' },
        { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', coingeckoId: 'uniswap' },
        { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', coingeckoId: 'wmatic' }
    ],
    bnb: [
        { address: '0x55d398326f99059fF775485246999027B3197955', coingeckoId: 'tether' },
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', coingeckoId: 'usd-coin' },
        { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', coingeckoId: 'binance-usd' },
        { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', coingeckoId: 'dai' },
        { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', coingeckoId: 'binance-bitcoin' },
        { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', coingeckoId: 'weth' },
        { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', coingeckoId: 'wbnb' },
        { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', coingeckoId: 'pancakeswap-token' },
        { address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', coingeckoId: 'venus' },
        { address: '0xfb6115445bff7b52feb98650c87f44907e58f802', coingeckoId: 'aave' }
    ]
};

/**
 * Busca top tokens de uma chain específica via CoinGecko API
 */
async function fetchTopTokensFromAPI(chainId, limit = 200) {
    try {
        const platform = CHAIN_TO_PLATFORM[chainId];
        if (!platform) {
            console.warn(`No CoinGecko platform mapping for ${chainId}`);
            return null;
        }

        console.log(`Fetching top ${limit} tokens for ${chainId} from CoinGecko...`);

        // Busca tokens por plataforma
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                category: platform,
                order: 'market_cap_desc',
                per_page: limit,
                page: 1,
                sparkline: false
            },
            timeout: 10000
        });

        if (!response.data || response.data.length === 0) {
            console.warn(`No tokens returned from CoinGecko for ${chainId}`);
            return null;
        }

        // Extrai endereços de contrato
        const tokens = [];
        for (const coin of response.data) {
            if (coin.platforms && coin.platforms[platform]) {
                const address = coin.platforms[platform];
                if (address && address !== '') {
                    tokens.push({
                        address: address,
                        coingeckoId: coin.id,
                        symbol: coin.symbol,
                        name: coin.name,
                        marketCap: coin.market_cap
                    });
                }
            }
        }

        console.log(`✓ Found ${tokens.length} tokens for ${chainId} from CoinGecko`);
        return tokens;
    } catch (error) {
        console.error(`Error fetching tokens from CoinGecko for ${chainId}:`, error.message);
        return null;
    }
}

/**
 * Obtém lista de tokens para uma chain (com cache)
 */
export async function getTopTokens(chainId, limit = 200) {
    // Verifica cache
    const cacheKey = `tokens_${chainId}_${limit}`;
    const cached = tokenListCache.get(cacheKey);

    if (cached) {
        console.log(`Using cached token list for ${chainId} (${cached.length} tokens)`);
        return cached;
    }

    // Tenta buscar da API
    // let tokens = await fetchTopTokensFromAPI(chainId, limit);

    // Temporariamente desabilitado - usando apenas lista estática
    let tokens = null;

    // Fallback para lista estática
    if (!tokens || tokens.length === 0) {
        console.log(`Using static fallback token list for ${chainId}`);
        tokens = STATIC_TOKEN_LISTS[chainId] || [];
    }

    // Salva no cache
    if (tokens.length > 0) {
        tokenListCache.set(cacheKey, tokens);
    }

    return tokens;
}

/**
 * Atualiza listas de tokens para todas as chains
 */
export async function refreshAllTokenLists(limit = 200) {
    console.log('Refreshing token lists for all chains...');

    const chains = Object.keys(CHAIN_TO_PLATFORM);
    const promises = chains.map(chainId => getTopTokens(chainId, limit));

    await Promise.all(promises);

    console.log('✓ Token lists refreshed');
}

/**
 * Limpa cache de listas de tokens
 */
export function clearTokenListCache() {
    tokenListCache.flushAll();
    console.log('Token list cache cleared');
}

/**
 * Obtém estatísticas do cache
 */
export function getTokenListCacheStats() {
    return {
        keys: tokenListCache.keys(),
        stats: tokenListCache.getStats()
    };
}
