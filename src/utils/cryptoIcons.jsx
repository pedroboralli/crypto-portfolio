/**
 * Crypto icon utility - uses CoinGecko API for real crypto logos
 * Provides fallback SVG icons for unknown tokens
 */

// CoinGecko API base URL for crypto icons
const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images';

// Mapping of common crypto symbols to CoinGecko IDs
const CRYPTO_ID_MAP = {
  'BTC': { id: 1, name: 'Bitcoin' },
  'ETH': { id: 279, name: 'Ethereum' },
  'BNB': { id: 825, name: 'BNB' },
  'MATIC': { id: 4713, name: 'Polygon' },
  'ARB': { id: 11841, name: 'Arbitrum' },
  'USDT': { id: 325, name: 'Tether' },
  'USDC': { id: 6319, name: 'USD Coin' },
  'DAI': { id: 2308, name: 'Dai' },
  'WETH': { id: 2396, name: 'Wrapped Ether' },
  'WBTC': { id: 3717, name: 'Wrapped Bitcoin' },
  'BTCB': { id: 14108, name: 'Binance Bitcoin' },
  'WBNB': { id: 7192, name: 'Wrapped BNB' },
  'LINK': { id: 1975, name: 'Chainlink' },
  'UNI': { id: 7083, name: 'Uniswap' },
  'AAVE': { id: 7278, name: 'Aave' },
  'CRV': { id: 6538, name: 'Curve DAO' },
  'MKR': { id: 1518, name: 'Maker' },
  'SNX': { id: 2586, name: 'Synthetix' },
  'COMP': { id: 5692, name: 'Compound' },
  'SUSHI': { id: 6758, name: 'SushiSwap' },
  'CAKE': { id: 7186, name: 'PancakeSwap' },
  'XVS': { id: 7288, name: 'Venus' },
  'BUSD': { id: 9576, name: 'Binance USD' },
  'SHIB': { id: 11939, name: 'Shiba Inu' },
  'STETH': { id: 13456, name: 'Lido Staked Ether' },
  'WMATIC': { id: 8925, name: 'Wrapped Matic' },
};

/**
 * Get crypto icon URL from CoinGecko CDN
 */
export function getCryptoIconUrl(symbol, size = 'large') {
  const upperSymbol = symbol?.toUpperCase();
  const cryptoData = CRYPTO_ID_MAP[upperSymbol];

  if (cryptoData) {
    return `${COINGECKO_CDN}/${cryptoData.id}/${size}.png`;
  }

  return null;
}

/**
 * Get crypto name
 */
export function getCryptoName(symbol) {
  const upperSymbol = symbol?.toUpperCase();
  return CRYPTO_ID_MAP[upperSymbol]?.name || symbol;
}

/**
 * Fallback SVG icon component for unknown tokens
 */
export function DefaultCryptoIcon({ symbol, className = "w-8 h-8" }) {
  const initial = symbol ? symbol.charAt(0).toUpperCase() : '?';
  return (
    <div className={`${className} bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-inner ring-1 ring-white/10`}>
      {initial}
    </div>
  );
}
