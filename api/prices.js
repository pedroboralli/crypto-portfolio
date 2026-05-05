import { getPrices } from '../../lib/services/priceService.js';

const SYMBOL_TO_ID = {
  ETH: 'ethereum', BTC: 'bitcoin', BNB: 'binancecoin',
  MATIC: 'matic-network', USDT: 'tether', USDC: 'usd-coin',
  BUSD: 'binance-usd', DAI: 'dai', WBTC: 'wrapped-bitcoin',
  BTCB: 'binance-bitcoin', WETH: 'weth', WBNB: 'wbnb',
  LINK: 'chainlink', UNI: 'uniswap', ARB: 'arbitrum',
  CAKE: 'pancakeswap-token', XVS: 'venus', SHIB: 'shiba-inu',
  STETH: 'staked-ether', WMATIC: 'wmatic', ADA: 'cardano',
  XRP: 'ripple', DOGE: 'dogecoin', DOT: 'polkadot',
  LTC: 'litecoin', BCH: 'bitcoin-cash',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: { message: 'symbols parameter is required' } });
  }

  const symbolsArray = symbols.split(',').map((s) => s.trim().toUpperCase());
  const coingeckoIds = symbolsArray
    .map((s) => SYMBOL_TO_ID[s])
    .filter(Boolean);

  if (coingeckoIds.length === 0) {
    return res.status(400).json({ error: { message: 'No valid symbols provided' } });
  }

  try {
    const prices = await getPrices(coingeckoIds);

    const result = {};
    symbolsArray.forEach((symbol) => {
      const id = SYMBOL_TO_ID[symbol];
      if (id && prices[id]) result[symbol] = prices[id];
    });

    return res.json({ prices: result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in /api/prices:', error);
    return res.status(500).json({ error: { message: 'Failed to fetch prices' } });
  }
}
