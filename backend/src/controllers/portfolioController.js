import { getAllEVMBalances, isValidEVMAddress } from '../services/evmService.js';
import { getBitcoinBalance, isValidBitcoinAddress } from '../services/bitcoinService.js';
import { getPrices, convertToBRL } from '../services/priceService.js';
import NodeCache from 'node-cache';

// Cache para resultados de portfólio (1 minuto)
const portfolioCache = new NodeCache({ stdTTL: 60 });

/**
 * Busca portfólio completo para um ou mais endereços
 * POST /api/portfolio
 * Body: { address: string } ou { evmAddress: string, btcAddress: string }
 */
export async function getPortfolio(req, res) {
  try {
    const { address, evmAddress, btcAddress } = req.body;

    // Valida que pelo menos um endereço foi fornecido
    if (!address && !evmAddress && !btcAddress) {
      return res.status(400).json({
        error: {
          message: 'Address is required',
          details: 'Provide either "address" for EVM, or "evmAddress" and/or "btcAddress"'
        }
      });
    }

    // Define endereços a serem buscados
    const evmAddr = address || evmAddress;
    const btcAddr = btcAddress;

    // Valida endereços
    if (evmAddr && !isValidEVMAddress(evmAddr)) {
      return res.status(400).json({
        error: { message: 'Invalid EVM address format' }
      });
    }

    if (btcAddr && !isValidBitcoinAddress(btcAddr)) {
      return res.status(400).json({
        error: { message: 'Invalid Bitcoin address format' }
      });
    }

    // Verifica cache
    const cacheKey = `${evmAddr || 'no-evm'}_${btcAddr || 'no-btc'}`;
    const cachedResult = portfolioCache.get(cacheKey);

    if (cachedResult) {
      console.log('Returning cached portfolio');
      return res.json(cachedResult);
    }

    // Busca saldos de todas as chains em paralelo
    const balancePromises = [];

    if (evmAddr) {
      balancePromises.push(getAllEVMBalances(evmAddr));
    }

    if (btcAddr) {
      balancePromises.push(getBitcoinBalance(btcAddr));
    }

    const results = await Promise.all(balancePromises);

    // Consolida resultados
    let allChains = [];

    if (evmAddr) {
      // Resultados EVM são array de chains
      allChains = allChains.concat(results[0]);
    }

    if (btcAddr) {
      // Resultado Bitcoin é um objeto de chain
      const btcIndex = evmAddr ? 1 : 0;
      allChains.push(results[btcIndex]);
    }

    // Coleta todos os coingeckoIds únicos
    const coingeckoIds = new Set();

    allChains.forEach(chain => {
      chain.assets.forEach(asset => {
        if (asset.coingeckoId) {
          coingeckoIds.add(asset.coingeckoId);
        }
      });
    });

    // Busca preços
    const prices = await getPrices([...coingeckoIds]);

    // Adiciona preços e valores aos assets
    let totalValueBRL = 0;
    let totalValueUSD = 0;
    let totalValueBTC = 0;

    // Obtém preço do Bitcoin para conversão
    const btcPriceBRL = prices['bitcoin']?.brl || 0;
    const btcPriceUSD = prices['bitcoin']?.usd || 0;

    allChains = allChains.map(chain => {
      const assetsWithPrices = chain.assets.map(asset => {
        const price = prices[asset.coingeckoId];
        const priceBRL = price ? price.brl : 0;
        const priceUSD = price ? price.usd : 0;
        const priceBTC = (priceUSD && btcPriceUSD) ? priceUSD / btcPriceUSD : 0;

        const valueBRL = parseFloat(asset.balance) * priceBRL;
        const valueUSD = parseFloat(asset.balance) * priceUSD;
        const valueBTC = parseFloat(asset.balance) * priceBTC;

        totalValueBRL += valueBRL;
        totalValueUSD += valueUSD;
        totalValueBTC += valueBTC;

        return {
          ...asset,
          priceBRL,
          priceUSD,
          priceBTC,
          valueBRL,
          valueUSD,
          valueBTC,
          priceChange24h: price ? price.brl_24h_change : 0
        };
      });

      // Ordena assets por valor (maior primeiro)
      assetsWithPrices.sort((a, b) => b.valueBRL - a.valueBRL);

      return {
        ...chain,
        assets: assetsWithPrices,
        totalValueBRL: assetsWithPrices.reduce((sum, asset) => sum + asset.valueBRL, 0),
        totalValueUSD: assetsWithPrices.reduce((sum, asset) => sum + asset.valueUSD, 0),
        totalValueBTC: assetsWithPrices.reduce((sum, asset) => sum + asset.valueBTC, 0)
      };
    });

    // Ordena chains por valor total (maior primeiro)
    allChains.sort((a, b) => b.totalValueBRL - a.totalValueBRL);

    // Calcula percentuais de cada asset no portfólio
    allChains = allChains.map(chain => ({
      ...chain,
      assets: chain.assets.map(asset => ({
        ...asset,
        portfolioPercentage: totalValueBRL > 0 ? (asset.valueBRL / totalValueBRL) * 100 : 0
      }))
    }));

    // Prepara resposta
    const response = {
      addresses: {
        evm: evmAddr || null,
        bitcoin: btcAddr || null
      },
      totalValueBRL,
      totalValueUSD,
      totalValueBTC,
      chains: allChains,
      timestamp: new Date().toISOString(),
      cached: false
    };

    // Salva no cache
    portfolioCache.set(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error('Error in getPortfolio:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Failed to fetch portfolio',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}

/**
 * Busca apenas preços de criptomoedas
 * GET /api/prices?symbols=ETH,BTC,MATIC
 */
export async function getPricesEndpoint(req, res) {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        error: { message: 'symbols parameter is required' }
      });
    }

    // Mapeia símbolos para IDs do CoinGecko
    const symbolToId = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BUSD': 'binance-usd',
      'DAI': 'dai',
      'WBTC': 'wrapped-bitcoin',
      'BTCB': 'binance-bitcoin',
      'WETH': 'weth',
      'WBNB': 'wbnb',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ARB': 'arbitrum',
      'CAKE': 'pancakeswap-token',
      'XVS': 'venus',
      'SHIB': 'shiba-inu',
      'STETH': 'staked-ether',
      'WMATIC': 'wmatic',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'EOS': 'eos',
      'FIL': 'filecoin'
    };

    const symbolsArray = symbols.split(',').map(s => s.trim().toUpperCase());
    const coingeckoIds = symbolsArray
      .map(symbol => symbolToId[symbol])
      .filter(id => id !== undefined);

    if (coingeckoIds.length === 0) {
      return res.status(400).json({
        error: { message: 'No valid symbols provided' }
      });
    }

    const prices = await getPrices(coingeckoIds);

    // Mapeia de volta para símbolos
    const result = {};
    symbolsArray.forEach(symbol => {
      const id = symbolToId[symbol];
      if (id && prices[id]) {
        result[symbol] = prices[id];
      }
    });

    res.json({
      prices: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getPricesEndpoint:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch prices' }
    });
  }
}

/**
 * Limpa cache do portfólio
 * POST /api/portfolio/clear-cache
 */
export async function clearCache(req, res) {
  try {
    portfolioCache.flushAll();
    res.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: { message: 'Failed to clear cache' }
    });
  }
}

/**
 * Health check com informações do sistema
 * GET /api/health
 */
export async function healthCheck(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      keys: portfolioCache.keys().length,
      stats: portfolioCache.getStats()
    },
    environment: process.env.NODE_ENV || 'development'
  });
}
