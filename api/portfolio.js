import { getAllEVMBalances, isValidEVMAddress } from '../lib/services/evmService.js';
import { getBitcoinBalance, isValidBitcoinAddress } from '../lib/services/bitcoinService.js';
import { getPrices } from '../lib/services/priceService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, evmAddress, btcAddress } = req.body;

    if (!address && !evmAddress && !btcAddress) {
      return res.status(400).json({
        error: {
          message: 'Address is required',
          details: 'Provide "address" for EVM, or "evmAddress" and/or "btcAddress"',
        },
      });
    }

    const evmAddr = address || evmAddress;
    const btcAddr = btcAddress;

    if (evmAddr && !isValidEVMAddress(evmAddr)) {
      return res.status(400).json({ error: { message: 'Invalid EVM address format' } });
    }
    if (btcAddr && !isValidBitcoinAddress(btcAddr)) {
      return res.status(400).json({ error: { message: 'Invalid Bitcoin address format' } });
    }

    // Busca saldos em paralelo. allSettled para que a falha de uma rede
    // (RPC fora do ar, rate limit) nao derrube a resposta inteira: o cliente
    // recebe o que deu certo mais a lista do que falhou.
    const [evmResult, btcResult] = await Promise.allSettled([
      evmAddr ? getAllEVMBalances(evmAddr) : Promise.resolve([]),
      btcAddr ? getBitcoinBalance(btcAddr) : Promise.resolve(null),
    ]);

    const failedChains = [];
    const partialChains = [];
    const incompleteTokenLists = [];

    let allChains = [];
    if (evmResult.status === 'fulfilled') {
      allChains = [...evmResult.value];
    } else {
      console.error('EVM balances failed:', evmResult.reason?.message);
      failedChains.push('EVM');
    }

    if (btcResult.status === 'fulfilled') {
      if (btcResult.value) allChains.push(btcResult.value);
    } else {
      console.error('Bitcoin balance failed:', btcResult.reason?.message);
      failedChains.push('Bitcoin');
    }

    // failed = saldo nativo indisponivel (rede inteira suspeita);
    // partial = a rede respondeu mas algum token nao pode ser lido
    allChains.forEach((chain) => {
      if (chain.failed) failedChains.push(chain.chain);
      else if (chain.partial) partialChains.push(chain.chain);
      if (chain.discoveryUnavailable) incompleteTokenLists.push(chain.chain);
    });

    // Coleta coingeckoIds únicos. O bitcoin entra sempre: e ele que da a
    // ancora USD->BRL usada para converter os tokens que vem do indexador.
    const coingeckoIds = new Set(['bitcoin']);
    allChains.forEach((chain) =>
      chain.assets.forEach((asset) => {
        if (asset.coingeckoId) coingeckoIds.add(asset.coingeckoId);
      })
    );

    const prices = await getPrices([...coingeckoIds]);

    // Preco stale = veio do cache porque a CoinGecko falhou; error = nunca foi
    // conhecido, entao o valor sai zerado e a resposta e considerada degradada.
    const priceEntries = Object.values(prices);
    const stalePrices = priceEntries.some((p) => p.stale);
    const missingPrices = priceEntries.some((p) => p.error);

    let totalValueBRL = 0;
    let totalValueUSD = 0;
    let totalValueBTC = 0;

    const btcPriceBRL = prices['bitcoin']?.brl || 0;
    const btcPriceUSD = prices['bitcoin']?.usd || 0;
    // Token descoberto pelo indexador so tem cotacao em USD
    const brlPerUsd = btcPriceUSD ? btcPriceBRL / btcPriceUSD : 0;

    allChains = allChains.map((chain) => {
      const assetsWithPrices = chain.assets.map((asset) => {
        const price = prices[asset.coingeckoId];
        const hasCoingeckoPrice = Boolean(price && !price.error);

        const priceUSD = hasCoingeckoPrice ? price.usd || 0 : asset.priceUSDSource || 0;
        const priceBRL = hasCoingeckoPrice ? price.brl || 0 : priceUSD * brlPerUsd;
        const priceBTC = priceUSD && btcPriceUSD ? priceUSD / btcPriceUSD : 0;

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
          priceChange24h: price?.brl_24h_change || 0,
          // Marca de onde veio a cotacao, util para depurar valores estranhos
          priceSource: hasCoingeckoPrice ? 'coingecko' : asset.priceUSDSource ? 'indexer' : 'none',
        };
      });

      assetsWithPrices.sort((a, b) => b.valueBRL - a.valueBRL);

      return {
        ...chain,
        assets: assetsWithPrices,
        totalValueBRL: assetsWithPrices.reduce((s, a) => s + a.valueBRL, 0),
        totalValueUSD: assetsWithPrices.reduce((s, a) => s + a.valueUSD, 0),
        totalValueBTC: assetsWithPrices.reduce((s, a) => s + a.valueBTC, 0),
      };
    });

    allChains.sort((a, b) => b.totalValueBRL - a.totalValueBRL);

    allChains = allChains.map((chain) => ({
      ...chain,
      assets: chain.assets.map((asset) => ({
        ...asset,
        portfolioPercentage: totalValueBRL > 0 ? (asset.valueBRL / totalValueBRL) * 100 : 0,
      })),
    }));

    return res.json({
      addresses: { evm: evmAddr || null, bitcoin: btcAddr || null },
      totalValueBRL,
      totalValueUSD,
      totalValueBTC,
      chains: allChains,
      timestamp: new Date().toISOString(),
      cached: false,
      degraded: {
        // O cliente usa isso para nao sobrescrever o cache bom com dado ruim
        failedChains,
        partialChains,
        incompleteTokenLists,
        stalePrices,
        missingPrices,
        isDegraded:
          failedChains.length > 0 ||
          partialChains.length > 0 ||
          incompleteTokenLists.length > 0 ||
          missingPrices,
      },
    });
  } catch (error) {
    console.error('Error in /api/portfolio:', error);
    return res.status(500).json({
      error: {
        message: error.message || 'Failed to fetch portfolio',
      },
    });
  }
}
