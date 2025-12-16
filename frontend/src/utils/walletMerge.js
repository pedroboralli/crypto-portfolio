/**
 * Merges multiple wallet portfolios into a single combined portfolio
 * @param {Array} wallets - Array of wallet objects with portfolioData
 * @returns {Object|null} - Merged portfolio object or null if no valid data
 */
export function mergeWalletPortfolios(wallets) {
  // Filter out wallets with errors or no data
  const validWallets = wallets.filter(w => w.portfolioData && !w.error);

  if (validWallets.length === 0) {
    return null;
  }

  // Initialize merged totals
  let totalValueBRL = 0;
  let totalValueUSD = 0;
  let totalValueBTC = 0;

  // Create a Map to merge chains (chainId -> chain object)
  const chainMap = new Map();

  // Process each valid wallet
  validWallets.forEach(wallet => {
    const portfolio = wallet.portfolioData;

    // Add to global totals
    totalValueBRL += portfolio.totalValueBRL || 0;
    totalValueUSD += portfolio.totalValueUSD || 0;
    totalValueBTC += portfolio.totalValueBTC || 0;

    // Process each chain in the portfolio
    portfolio.chains.forEach(chain => {
      if (chainMap.has(chain.chainId)) {
        // Chain already exists - merge assets
        const existingChain = chainMap.get(chain.chainId);

        // Create assetMap to merge assets (key -> asset)
        const assetMap = new Map();

        // Add existing assets to map
        existingChain.assets.forEach(asset => {
          const key = getAssetKey(asset);
          assetMap.set(key, asset);
        });

        // Merge new assets
        chain.assets.forEach(newAsset => {
          const key = getAssetKey(newAsset);

          if (assetMap.has(key)) {
            // Asset exists - sum balances and values
            const existing = assetMap.get(key);
            assetMap.set(key, {
              ...existing,
              balance: sumBalances(existing.balance, newAsset.balance),
              valueBRL: (existing.valueBRL || 0) + (newAsset.valueBRL || 0),
              valueUSD: (existing.valueUSD || 0) + (newAsset.valueUSD || 0),
              valueBTC: (existing.valueBTC || 0) + (newAsset.valueBTC || 0),
            });
          } else {
            // New asset - add to map
            assetMap.set(key, { ...newAsset });
          }
        });

        // Update chain with merged assets
        existingChain.assets = Array.from(assetMap.values());
        existingChain.totalValueBRL = (existingChain.totalValueBRL || 0) + (chain.totalValueBRL || 0);
        existingChain.totalValueUSD = (existingChain.totalValueUSD || 0) + (chain.totalValueUSD || 0);
        existingChain.totalValueBTC = (existingChain.totalValueBTC || 0) + (chain.totalValueBTC || 0);
      } else {
        // New chain - add to map
        chainMap.set(chain.chainId, {
          ...chain,
          assets: chain.assets.map(asset => ({ ...asset }))
        });
      }
    });
  });

  // Convert Map to array
  let mergedChains = Array.from(chainMap.values());

  // Sort assets within each chain by value (descending)
  mergedChains = mergedChains.map(chain => ({
    ...chain,
    assets: chain.assets.sort((a, b) => (b.valueBRL || 0) - (a.valueBRL || 0))
  }));

  // Sort chains by total value (descending)
  mergedChains.sort((a, b) => (b.totalValueBRL || 0) - (a.totalValueBRL || 0));

  // Recalculate portfolio percentages
  mergedChains = mergedChains.map(chain => ({
    ...chain,
    assets: chain.assets.map(asset => ({
      ...asset,
      portfolioPercentage: totalValueBRL > 0
        ? ((asset.valueBRL || 0) / totalValueBRL) * 100
        : 0
    }))
  }));

  // Calculate value-weighted portfolio 24h change
  let weightedChange = 0;
  let totalValueForChange = 0;

  mergedChains.forEach(chain => {
    chain.assets.forEach(asset => {
      const assetValue = asset.valueBRL || 0;
      const assetChange = asset.priceChange24h || 0;

      // Only include assets with valid price change data
      if (assetValue > 0 && assetChange !== 0) {
        weightedChange += assetValue * assetChange;
        totalValueForChange += assetValue;
      }
    });
  });

  const portfolio24hChange = totalValueForChange > 0
    ? weightedChange / totalValueForChange
    : 0;

  // Collect all addresses by type
  const evmAddresses = validWallets
    .filter(w => w.type === 'evm')
    .map(w => w.address);

  const bitcoinAddresses = validWallets
    .filter(w => w.type === 'bitcoin')
    .map(w => w.address);

  // Build final merged portfolio object
  return {
    addresses: {
      evm: evmAddresses.length > 0 ? evmAddresses : null,
      bitcoin: bitcoinAddresses.length > 0 ? bitcoinAddresses : null
    },
    totalValueBRL,
    totalValueUSD,
    totalValueBTC,
    chains: mergedChains,
    timestamp: new Date().toISOString(),
    cached: false,
    walletCount: validWallets.length,
    portfolio24hChange
  };
}

/**
 * Generates a unique key for an asset to identify duplicates
 * @param {Object} asset - The asset object
 * @returns {string} - Unique key for the asset
 */
function getAssetKey(asset) {
  // For native tokens, use symbol as key
  if (asset.isNative) {
    return `native-${asset.symbol}`;
  }
  // For token contracts, use address as key (case-insensitive)
  return asset.address ? asset.address.toLowerCase() : `symbol-${asset.symbol}`;
}

/**
 * Sums two balance strings (preserving precision)
 * @param {string} balance1 - First balance
 * @param {string} balance2 - Second balance
 * @returns {string} - Summed balance
 */
function sumBalances(balance1, balance2) {
  const num1 = parseFloat(balance1) || 0;
  const num2 = parseFloat(balance2) || 0;
  return (num1 + num2).toString();
}
