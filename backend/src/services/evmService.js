import { ethers } from 'ethers';

// ABI mínimo para tokens ERC-20
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

// Configuração das chains suportadas
const CHAINS = {
  ethereum: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.public-rpc.com',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
    // Top tokens ERC-20 no Ethereum
    tokens: [
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', coingeckoId: 'tether' }, // USDT
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', coingeckoId: 'usd-coin' }, // USDC
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', coingeckoId: 'dai' }, // DAI
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', coingeckoId: 'wrapped-bitcoin' }, // WBTC
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', coingeckoId: 'weth' }, // WETH
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', coingeckoId: 'chainlink' }, // LINK
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', coingeckoId: 'uniswap' }, // UNI
      { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', coingeckoId: 'matic-network' }, // MATIC (on Ethereum)
      { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', coingeckoId: 'shiba-inu' }, // SHIB
      { address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', coingeckoId: 'staked-ether' } // stETH
    ]
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
    tokens: [
      { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', coingeckoId: 'tether' }, // USDT
      { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', coingeckoId: 'usd-coin' }, // USDC (native)
      { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', coingeckoId: 'usd-coin' }, // USDC.e (bridged)
      { address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', coingeckoId: 'dai' }, // DAI
      { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', coingeckoId: 'wrapped-bitcoin' }, // WBTC
      { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', coingeckoId: 'weth' }, // WETH
      { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', coingeckoId: 'chainlink' }, // LINK
      { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', coingeckoId: 'uniswap' }, // UNI
      { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', coingeckoId: 'arbitrum' } // ARB
    ]
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18, coingeckoId: 'matic-network' },
    tokens: [
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', coingeckoId: 'tether' }, // USDT
      { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', coingeckoId: 'usd-coin' }, // USDC (native)
      { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', coingeckoId: 'usd-coin' }, // USDC.e (bridged)
      { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', coingeckoId: 'dai' }, // DAI
      { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', coingeckoId: 'wrapped-bitcoin' }, // WBTC
      { address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', coingeckoId: 'weth' }, // WETH
      { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', coingeckoId: 'chainlink' }, // LINK
      { address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f', coingeckoId: 'uniswap' }, // UNI
      { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', coingeckoId: 'wmatic' } // WMATIC
    ]
  },
  bnb: {
    name: 'BNB Chain',
    rpcUrl: process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org',
    rpcUrls: [
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed3.binance.org',
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc.publicnode.com'
    ],
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18, coingeckoId: 'binancecoin' },
    // Top tokens BEP-20 na BNB Chain (endereços verificados)
    tokens: [
      { address: '0x55d398326f99059fF775485246999027B3197955', coingeckoId: 'tether' }, // USDT
      { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', coingeckoId: 'usd-coin' }, // USDC
      { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', coingeckoId: 'binance-usd' }, // BUSD
      { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', coingeckoId: 'dai' }, // DAI
      { address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', coingeckoId: 'binance-bitcoin' }, // BTCB
      { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', coingeckoId: 'weth' }, // ETH
      { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', coingeckoId: 'wbnb' }, // WBNB
      { address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', coingeckoId: 'pancakeswap-token' }, // CAKE
      { address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', coingeckoId: 'venus' }, // XVS
      { address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', coingeckoId: 'ripple' }, // XRP
      { address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', coingeckoId: 'dogecoin' }, // DOGE
      { address: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153', coingeckoId: 'binance-peg-filecoin' }, // FIL
      { address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', coingeckoId: 'polkadot' }, // DOT
      { address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', coingeckoId: 'cardano' }, // ADA
      { address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', coingeckoId: 'chainlink' }, // LINK
      { address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', coingeckoId: 'litecoin' }, // LTC
      { address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', coingeckoId: 'uniswap' }, // UNI
      { address: '0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf', coingeckoId: 'bitcoin-cash' }, // BCH
      { address: '0x56b6fB708fC5732DEC1Afc8D8556423A2EDcCbD6', coingeckoId: 'eos' }, // EOS
      { address: '0xfb6115445bff7b52feb98650c87f44907e58f802', coingeckoId: 'aave' } // AAVE
      
    ]
  }
};

/**
 * Obtém o provider para uma chain específica com fallback
 */
function getProvider(chainId, rpcIndex = 0) {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  // Tenta usar API keys se disponível, senão usa RPC público
  let rpcUrl = chain.rpcUrl;

  if (chainId === 'ethereum' && process.env.ALCHEMY_API_KEY) {
    rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  } else if (chainId === 'ethereum' && process.env.INFURA_API_KEY) {
    rpcUrl = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;
  } else if (chainId === 'arbitrum' && process.env.ALCHEMY_API_KEY) {
    rpcUrl = `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  } else if (chainId === 'polygon' && process.env.ALCHEMY_API_KEY) {
    rpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  } else if (chainId === 'bnb' && process.env.ALCHEMY_API_KEY) {
    rpcUrl = `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  } else if (chainId === 'bnb' && chain.rpcUrls && rpcIndex < chain.rpcUrls.length) {
    // Para BNB Chain, usa RPC alternativo se disponível
    rpcUrl = chain.rpcUrls[rpcIndex];
  }

  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Busca o saldo do token nativo (ETH, MATIC, BNB)
 */
async function getNativeBalance(address, chainId) {
  try {
    const provider = getProvider(chainId);
    const chain = CHAINS[chainId];

    const balance = await provider.getBalance(address);
    const balanceFormatted = ethers.formatEther(balance);

    if (parseFloat(balanceFormatted) === 0) {
      return null;
    }

    return {
      symbol: chain.nativeToken.symbol,
      name: chain.nativeToken.name,
      balance: balanceFormatted,
      decimals: chain.nativeToken.decimals,
      coingeckoId: chain.nativeToken.coingeckoId,
      isNative: true
    };
  } catch (error) {
    console.error(`Error fetching native balance for ${chainId}:`, error.message);
    return null;
  }
}

/**
 * Busca o saldo de um token ERC-20 com retry
 */
async function getTokenBalance(address, tokenAddress, chainId, retryCount = 0) {
  const maxRetries = chainId === 'bnb' ? 2 : 0; // Mais retries para BNB Chain

  try {
    const provider = getProvider(chainId, retryCount);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Busca informações do token em paralelo com timeout
    const timeout = 10000; // 10 segundos
    const balancePromise = Promise.race([
      Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);

    const [balance, decimals, symbol, name] = await balancePromise;

    const balanceFormatted = ethers.formatUnits(balance, decimals);

    // Ignora tokens com saldo zero
    if (parseFloat(balanceFormatted) === 0) {
      return null;
    }

    console.log(`✓ Found ${symbol} balance on ${chainId}: ${balanceFormatted}`);

    return {
      symbol,
      name,
      balance: balanceFormatted,
      decimals: Number(decimals),
      address: tokenAddress,
      isNative: false
    };
  } catch (error) {
    // Retry com outro RPC se disponível
    if (retryCount < maxRetries) {
      console.log(`Retrying token ${tokenAddress} on ${chainId} (attempt ${retryCount + 1}/${maxRetries + 1})`);
      return getTokenBalance(address, tokenAddress, chainId, retryCount + 1);
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`Token ${tokenAddress} on ${chainId}: ${error.message}`);
    }
    return null;
  }
}

/**
 * Busca todos os saldos de uma chain (nativo + tokens ERC-20)
 */
async function getChainBalances(address, chainId) {
  try {
    const chain = CHAINS[chainId];

    // Busca saldo nativo
    const nativeBalancePromise = getNativeBalance(address, chainId);

    // Busca saldos de tokens ERC-20
    const tokenBalancePromises = chain.tokens.map(token =>
      getTokenBalance(address, token.address, chainId)
        .then(result => result ? { ...result, coingeckoId: token.coingeckoId } : null)
    );

    // Aguarda todas as promises
    const [nativeBalance, ...tokenBalances] = await Promise.all([
      nativeBalancePromise,
      ...tokenBalancePromises
    ]);

    // Filtra resultados nulos e retorna
    const assets = [nativeBalance, ...tokenBalances].filter(asset => asset !== null);

    return {
      chain: chain.name,
      chainId,
      assets
    };
  } catch (error) {
    console.error(`Error fetching balances for ${chainId}:`, error.message);
    throw error;
  }
}

/**
 * Busca saldos de todas as chains EVM para um endereço
 */
export async function getAllEVMBalances(address) {
  // Valida endereço Ethereum
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  try {
    // Busca saldos de todas as chains em paralelo
    const balancesPromises = Object.keys(CHAINS).map(chainId =>
      getChainBalances(address, chainId)
    );

    const balances = await Promise.all(balancesPromises);

    return balances;
  } catch (error) {
    console.error('Error fetching EVM balances:', error.message);
    throw error;
  }
}

/**
 * Valida se um endereço é válido
 */
export function isValidEVMAddress(address) {
  return ethers.isAddress(address);
}
