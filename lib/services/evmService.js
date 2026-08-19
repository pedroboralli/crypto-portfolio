import { ethers } from 'ethers';
import { getTopTokens } from './tokenListService.js';
import { discoverTokens } from './tokenDiscoveryService.js';

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
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
      'https://1rpc.io/eth',
    ].filter(Boolean),
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
  },
  arbitrum: {
    name: 'Arbitrum',
    networkId: 42161,
    rpcUrls: [
      process.env.ARBITRUM_RPC_URL,
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://1rpc.io/arb',
    ].filter(Boolean),
    nativeToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18, coingeckoId: 'ethereum' },
  },
  polygon: {
    name: 'Polygon',
    networkId: 137,
    rpcUrls: [
      process.env.POLYGON_RPC_URL,
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon.drpc.org',
      'https://1rpc.io/matic',
    ].filter(Boolean),
    nativeToken: { symbol: 'MATIC', name: 'Polygon', decimals: 18, coingeckoId: 'matic-network' },
  },
  bnb: {
    name: 'BNB Chain',
    networkId: 56,
    rpcUrls: [
      process.env.BNB_RPC_URL,
      'https://bsc-rpc.publicnode.com',
      'https://bsc-dataseed1.binance.org',
      'https://bsc.drpc.org',
    ].filter(Boolean),
    nativeToken: { symbol: 'BNB', name: 'BNB', decimals: 18, coingeckoId: 'binancecoin' },
  },
};

const CALL_TIMEOUT_MS = 12000;
// Quantas chamadas simultaneas por rede. Endpoint publico responde 429 quando
// recebe as ~70 chamadas de uma carteira de uma vez.
const CHAIN_CONCURRENCY = 6;
// Quanto tempo um RPC fica de fora depois de falhar
const RPC_COOLDOWN_MS = 2 * 60 * 1000;

// Teto de chamadas simultaneas por endpoint, somando TODAS as carteiras que
// estiverem sincronizando. Sem isso, 7 carteiras x 4 redes x 6 chamadas caiam
// de uma vez no mesmo host publico e voltavam 429.
const HOST_CONCURRENCY = 12;
const hostQueues = new Map(); // host -> { active, waiting[] }

const providerCache = new Map(); // url -> JsonRpcProvider
const rpcDownUntil = new Map(); // url -> timestamp
// symbol/name/decimals de um ERC-20 nao mudam: busca uma vez e reusa
const tokenMetadataCache = new Map(); // `${chainId}:${address}` -> metadata

function getRpcUrls(chainId) {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Chain ${chainId} not supported`);

  // Alchemy como prioridade se API key disponível
  const urls = [...chain.rpcUrls];
  if (process.env.ALCHEMY_API_KEY) {
    const alchemyMap = {
      ethereum: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      polygon: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      bnb: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    };
    if (alchemyMap[chainId]) urls.unshift(alchemyMap[chainId]);
  }

  // Endpoint que acabou de falhar vai para o fim em vez de sair da lista:
  // se todos estiverem em cooldown ainda vale a pena tentar.
  const healthy = urls.filter((url) => !isRpcDown(url));
  return healthy.length > 0 ? healthy : urls;
}

function isRpcDown(url) {
  const until = rpcDownUntil.get(url);
  if (!until) return false;
  if (Date.now() >= until) {
    rpcDownUntil.delete(url);
    return false;
  }
  return true;
}

/**
 * Erro de infraestrutura (endpoint fora do ar, 401/429, timeout) e diferente de
 * erro da chamada (contrato reverteu). Só o primeiro tira o RPC de circulacao.
 */
function isInfraError(error) {
  // Só CALL_EXCEPTION e um revert de verdade do contrato. BAD_DATA aparece
  // quando o endpoint devolve algo fora do padrao (foi assim que a Ankr passou
  // a responder ao exigir API key), e nesse caso o fallback precisa acontecer.
  return error?.code !== 'CALL_EXCEPTION';
}

function getProvider(chainId, rpcUrl) {
  let provider = providerCache.get(rpcUrl);
  if (!provider) {
    const network = ethers.Network.from(CHAINS[chainId].networkId);
    provider = new ethers.JsonRpcProvider(rpcUrl, network, {
      staticNetwork: true,
      batchMaxCount: 1,
    });
    providerCache.set(rpcUrl, provider);
  }
  return provider;
}

/**
 * Semaforo por host: segura a chamada ate haver vaga no endpoint.
 */
async function acquireHostSlot(host) {
  let queue = hostQueues.get(host);
  if (!queue) {
    queue = { active: 0, waiting: [] };
    hostQueues.set(host, queue);
  }

  if (queue.active >= HOST_CONCURRENCY) {
    await new Promise((resolve) => queue.waiting.push(resolve));
  }
  queue.active++;

  return () => {
    queue.active--;
    const next = queue.waiting.shift();
    if (next) next();
  };
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timeout')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Executa uma chamada percorrendo os RPCs da rede ate um responder.
 * Marca em cooldown o endpoint que falhar por infraestrutura, para que as
 * proximas chamadas da mesma sincronizacao nao repitam o endpoint quebrado.
 */
async function callWithFallback(chainId, operation) {
  const urls = getRpcUrls(chainId);
  let lastError = new Error(`No RPC available for ${chainId}`);

  for (const url of urls) {
    const release = await acquireHostSlot(new URL(url).host);
    try {
      return await withTimeout(operation(getProvider(chainId, url)), CALL_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (isInfraError(error)) {
        rpcDownUntil.set(url, Date.now() + RPC_COOLDOWN_MS);
      } else {
        throw error;
      }
    } finally {
      release();
    }
  }

  throw lastError;
}

/**
 * Roda as tarefas com um teto de execucoes simultaneas, preservando a ordem.
 */
async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
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

async function getNativeBalance(address, chainId) {
  const chain = CHAINS[chainId];

  try {
    const balance = await callWithFallback(chainId, (provider) => provider.getBalance(address));
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

/**
 * symbol/name/decimals do token, buscados uma unica vez por processo.
 */
async function getTokenMetadata(tokenAddress, chainId) {
  const key = `${chainId}:${tokenAddress.toLowerCase()}`;
  const cached = tokenMetadataCache.get(key);
  if (cached) return cached;

  const [decimals, symbol, name] = await callWithFallback(chainId, (provider) => {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return Promise.all([contract.decimals(), contract.symbol(), contract.name()]);
  });

  const metadata = { decimals: Number(decimals), symbol, name };
  tokenMetadataCache.set(key, metadata);
  return metadata;
}

/**
 * Saldo de um ERC-20. Retorna null quando a carteira nao tem o token.
 *
 * O balanceOf vem primeiro e sozinho: a maior parte dos 46 tokens da lista tem
 * saldo zero, e buscar symbol/name/decimals para todos eles multiplicava por 4
 * o numero de chamadas — era isso que derrubava os RPCs publicos no 429.
 *
 * @returns {Promise<Object|null|undefined>} objeto do ativo, null se zerado,
 *   undefined se a leitura falhou (saldo desconhecido)
 */
async function getTokenBalance(address, tokenAddress, chainId) {
  let balance;
  try {
    balance = await callWithFallback(chainId, (provider) =>
      new ethers.Contract(tokenAddress, ERC20_ABI, provider).balanceOf(address)
    );
  } catch (error) {
    console.error(`Error fetching token ${tokenAddress} on ${chainId}:`, error.message);
    return undefined;
  }

  if (balance === 0n) return null;

  try {
    const { decimals, symbol, name } = await getTokenMetadata(tokenAddress, chainId);
    return {
      symbol,
      name: normalizeTokenName(symbol, name),
      balance: ethers.formatUnits(balance, decimals),
      decimals,
      address: tokenAddress,
      isNative: false,
      image: getTokenImage(symbol),
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${tokenAddress} on ${chainId}:`, error.message);
    return undefined;
  }
}

async function getChainBalances(address, chainId) {
  const chain = CHAINS[chainId];
  const tokens = getTopTokens(chainId);

  // Lista curada (lida on-chain) e descoberta (indexador) correm juntas
  const [nativeBalance, tokenBalances, discovery] = await Promise.all([
    getNativeBalance(address, chainId),
    mapWithConcurrency(tokens, CHAIN_CONCURRENCY, async (token) => {
      const result = await getTokenBalance(address, token.address, chainId);
      return result ? { ...result, coingeckoId: token.coingeckoId } : result;
    }),
    discoverTokens(address, chainId),
  ]);

  // undefined = leitura falhou (saldo desconhecido); null = carteira nao tem o token
  const unreadableTokens = tokenBalances.filter((token) => token === undefined).length;
  const assets = [nativeBalance, ...tokenBalances].filter(Boolean);

  // O saldo lido on-chain manda: so entram os tokens que a lista curada nao cobre
  const known = new Set(
    assets.filter((asset) => asset.address).map((asset) => asset.address.toLowerCase())
  );
  for (const discovered of discovery.tokens) {
    if (known.has(discovered.address.toLowerCase())) continue;
    known.add(discovered.address.toLowerCase());
    assets.push(discovered);
  }

  return {
    chain: chain.name,
    chainId,
    assets,
    failed: Boolean(nativeBalance?.error),
    partial: unreadableTokens > 0,
    // Sem indexador nesta rodada a lista de tokens pode estar incompleta
    discoveryUnavailable: !discovery.available,
  };
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
