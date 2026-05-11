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

    // Busca saldos em paralelo
    const results = await Promise.all([
      evmAddr ? getAllEVMBalances(evmAddr) : Promise.resolve([]),
      btcAddr ? getBitcoinBalance(btcAddr) : Promise.resolve(null),
    ]);

    let allChains = [...results[0]];
    if (results[1]) allChains.push(results[1]);

    // Coleta coingeckoIds únicos
    const coingeckoIds = new Set();
    allChains.forEach((chain) =>
      chain.assets.forEach((asset) => {
        if (asset.coingeckoId) coingeckoIds.add(asset.coingeckoId);
      })
    );

    const prices = await getPrices([...coingeckoIds]);

    let totalValueBRL = 0;
    let totalValueUSD = 0;
    let totalValueBTC = 0;

    const btcPriceBRL = prices['bitcoin']?.brl || 0;
    const btcPriceUSD = prices['bitcoin']?.usd || 0;

    allChains = allChains.map((chain) => {
      const assetsWithPrices = chain.assets.map((asset) => {
        const price = prices[asset.coingeckoId];
        const priceBRL = price?.brl || 0;
        const priceUSD = price?.usd || 0;
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
