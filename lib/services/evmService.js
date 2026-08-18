import { ethers } from 'ethers';
import { getTopTokens } from './tokenListService.js';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

const CHAINS = {
  ethereum: {
    name: 'Ethereum',
    networkId: 1,
    rpcUrls: [
      process.env.ETHEREUM_RPC_URL,
      'https://ethereum.publicnode.com',
      'https://eth.llamarpc.com',
      'https://cloudflare-eth.com',
    ].filter(Boolean),
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
  },
  arbitrum: {
    name: 'Arbitrum',
    networkId: 42161,
    rpcUrls: [
      process.env.ARBITRUM_RPC_URL,
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
      'https://arbitrum-one.publicnode.com',
    ].filter(Boolean),
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
  },
  polygon: {
    name: 'Polygon',
    networkId: 137,
    rpcUrls: [
      process.env.POLYGON_RPC_URL,
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
      'https://polygon-bor-rpc.publicnode.com',
    ].filter(Boolean),
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18, coingeckoId: 'matic-network' },
  },
  bnb: {
    name: 'BNB Chain',
    networkId: 56,
    rpcUrls: [
      process.env.BNB_RPC_URL,
      'https://bsc-dataseed1.binance.org',
      'https://bsc-dataseed2.binance.org',
      'https://bsc.publicnode.com',
    ].filter(Boolean),
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18, coingeckoId: 'binancecoin' },
  },
};

function getProvider(chainId, rpcIndex = 0) {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Chain ${chainId} not supported`);

  let rpcUrl = chain.rpcUrls[rpcIndex] || chain.rpcUrls[0];

  // Alchemy como prioridade se API key disponível
  if (process.env.ALCHEMY_API_KEY) {
    const alchemyMap = {
      ethereum: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      polygon: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      bnb: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    };
    if (rpcIndex === 0 && alchemyMap[chainId]) rpcUrl = alchemyMap[chainId];
  }

  const network = ethers.Network.from(chain.networkId);
  return new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: true,
    batchMaxCount: 1,
  });
}

function getTokenImage(symbol) {
  const images = {
    ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    WETH: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    POL: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    WBTC: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    UNI: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
    AAVE: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
    SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  };
  return images[symbol?.toUpperCase()] || null;
}

function normalizeTokenName(symbol, contractName) {
  const knownNames = {
    USDT: 'Tether USD', USDC: 'USD Coin', DAI: 'Dai Stablecoin',
    WETH: 'Wrapped Ether', WBTC: 'Wrapped Bitcoin', LINK: 'Chainlink',
    UNI: 'Uniswap', AAVE: 'Aave', ARB: 'Arbitrum',
    MATIC: 'Polygon', POL: 'Polygon', BNB: 'BNB', ETH: 'Ethereum',
  };
  return knownNames[symbol?.toUpperCase()] || contractName || symbol;
}

async function getNativeBalance(address, chainId, retryCount = 0) {
  const chain = CHAINS[chainId];
  const maxRetries = chain.rpcUrls.length - 1;

  try {
    const provider = getProvider(chainId, retryCount);
    const balance = await Promise.race([
      provider.getBalance(address),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000)),
    ]);
    const balanceFormatted = ethers.formatEther(balance);
    return {
      symbol: chain.nativeToken.symbol,
      name: chain.nativeToken.name,
      balance: balanceFormatted,
      decimals: chain.nativeToken.decimals,
      coingeckoId: chain.nativeToken.coingeckoId,
      isNative: true,
      image: getTokenImage(chain.nativeToken.symbol),
    };
  } catch (error) {
    // Tenta o proximo RPC da lista antes de desistir: um endpoint fora do ar
    // nao pode zerar o saldo nativo da rede inteira.
    if (retryCount < maxRetries) {
      return getNativeBalance(address, chainId, retryCount + 1);
    }

    console.error(`Error fetching native balance for ${chainId}:`, error.message);
    // Saldo desconhecido, nao zero: o `error` avisa o chamador para nao tratar
    // a falha de RPC como "a carteira esvaziou".
    return {
      symbol: chain.nativeToken.symbol,
      name: chain.nativeToken.name,
      balance: '0',
      decimals: chain.nativeToken.decimals,
      coingeckoId: chain.nativeToken.coingeckoId,
      isNative: true,
      image: getTokenImage(chain.nativeToken.symbol),
      error: true,
    };
  }
}

async function getTokenBalance(address, tokenAddress, chainId, retryCount = 0) {
  const chain = CHAINS[chainId];
  const maxRetries = chain.rpcUrls.length - 1;

  try {
    const provider = getProvider(chainId, retryCount);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balance, decimals, symbol, name] = await Promise.race([
      Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol(),
        contract.name(),
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 12000)),
    ]);

    const balanceFormatted = ethers.formatUnits(balance, decimals);
    if (parseFloat(balanceFormatted) === 0) return null;

    return {
      symbol,
      name: normalizeTokenName(symbol, name),
      balance: balanceFormatted,
      decimals: Number(decimals),
      address: tokenAddress,
      isNative: false,
      image: getTokenImage(symbol),
    };
  } catch (error) {
    if (retryCount < maxRetries) {
      return getTokenBalance(address, tokenAddress, chainId, retryCount + 1);
    }
    return null;
  }
}

async function getChainBalances(address, chainId) {
  const chain = CHAINS[chainId];
  const tokens = getTopTokens(chainId);

  const [nativeBalance, ...tokenBalances] = await Promise.all([
    getNativeBalance(address, chainId),
    ...tokens.map((token) =>
      getTokenBalance(address, token.address, chainId).then((result) =>
        result ? { ...result, coingeckoId: token.coingeckoId } : null
      )
    ),
  ]);

  const assets = [nativeBalance, ...tokenBalances].filter(Boolean);
  return { chain: chain.name, chainId, assets, failed: Boolean(nativeBalance?.error) };
}

export async function getAllEVMBalances(address) {
  if (!ethers.isAddress(address)) throw new Error('Invalid Ethereum address');

  // allSettled: uma rede fora do ar nao pode derrubar o portfolio inteiro
  const settled = await Promise.allSettled(
    Object.keys(CHAINS).map((chainId) => getChainBalances(address, chainId))
  );

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;

    const chainId = Object.keys(CHAINS)[index];
    console.error(`Error fetching chain ${chainId}:`, result.reason?.message);
    return { chain: CHAINS[chainId].name, chainId, assets: [], failed: true };
  });
}

export function isValidEVMAddress(address) {
  return ethers.isAddress(address);
}
