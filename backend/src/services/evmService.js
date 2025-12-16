import { ethers } from 'ethers';
import { getTopTokens } from './tokenListService.js';

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
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://rpc.ankr.com/eth',
    rpcUrls: [
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
      'https://eth.llamarpc.com',
      'https://cloudflare-eth.com'
    ],
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' }
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://rpc.ankr.com/arbitrum',
    rpcUrls: [
      'https://rpc.ankr.com/arbitrum',
      'https://arbitrum.llamarpc.com',
      'https://arb1.arbitrum.io/rpc'
    ],
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' }
  },
  polygon: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://rpc.ankr.com/polygon',
    rpcUrls: [
      'https://rpc.ankr.com/polygon',
      'https://polygon.llamarpc.com',
      'https://polygon-rpc.com'
    ],
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18, coingeckoId: 'matic-network' }
  },
  bnb: {
    name: 'BNB Chain',
    rpcUrl: process.env.BNB_RPC_URL || 'https://rpc.ankr.com/bsc',
    rpcUrls: [
      'https://rpc.ankr.com/bsc',
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc.publicnode.com'
    ],
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18, coingeckoId: 'binancecoin' }
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
  } else if (chain.rpcUrls && rpcIndex < chain.rpcUrls.length) {
    // Usa RPC alternativo se disponível
    rpcUrl = chain.rpcUrls[rpcIndex];
  }

  // Define network ID baseado na chain
  const networkMap = {
    ethereum: 1,
    arbitrum: 42161,
    polygon: 137,
    bnb: 56
  };

  // Cria provider com network ID explícito
  return new ethers.JsonRpcProvider(rpcUrl, networkMap[chainId]);
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

    console.log(`✓ Found native ${chain.nativeToken.symbol} balance on ${chainId}: ${balanceFormatted}`);

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
  const chain = CHAINS[chainId];
  const maxRetries = chain.rpcUrls ? chain.rpcUrls.length - 1 : 0;

  try {
    const provider = getProvider(chainId, retryCount);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Busca informações do token em paralelo com timeout
    const timeout = 15000; // 15 segundos
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
      console.log(`Retrying token ${tokenAddress} on ${chainId} with RPC ${retryCount + 1}/${maxRetries + 1}`);
      return getTokenBalance(address, tokenAddress, chainId, retryCount + 1);
    }

    // Log apenas em desenvolvimento ou para erros importantes
    if (process.env.NODE_ENV === 'development' || error.message !== 'Timeout') {
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

    // Busca lista dinâmica de tokens (top 200)
    console.log(`Fetching token list for ${chainId}...`);
    const tokens = await getTopTokens(chainId, 200);
    console.log(`Checking ${tokens.length} tokens on ${chainId}...`);

    // Busca saldos de tokens ERC-20
    const tokenBalancePromises = tokens.map(token =>
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

    console.log(`✓ Found ${assets.length} assets on ${chainId}`);

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
