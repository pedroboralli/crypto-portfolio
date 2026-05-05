import { useState } from 'react';
import { formatCurrency, formatNumber, getAssetValue, getAssetPrice } from '../utils/currency';

function AssetList({ chains, currency = 'BRL', totalValue = 0 }) {
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');

  // Consolida todos os assets de todas as chains
  const allAssets = chains.flatMap(chain =>
    chain.assets.map(asset => ({
      ...asset,
      chain: chain.chain,
      chainId: chain.chainId
    }))
  );

  // Calcula a porcentagem do portfolio para cada asset
  const assetsWithPercentage = allAssets.map(asset => ({
    ...asset,
    portfolioPercentage: totalValue > 0 ? (getAssetValue(asset, currency) / totalValue) * 100 : 0
  }));

  // Ordena assets
  const sortedAssets = [...assetsWithPercentage].sort((a, b) => {
    let compareValue;

    switch (sortBy) {
      case 'value':
        compareValue = getAssetValue(b, currency) - getAssetValue(a, currency);
        break;
      case 'percentage':
        compareValue = b.portfolioPercentage - a.portfolioPercentage;
        break;
      case 'balance':
        compareValue = parseFloat(b.balance) - parseFloat(a.balance);
        break;
      case 'symbol':
        compareValue = a.symbol.localeCompare(b.symbol);
        break;
      case 'chain':
        compareValue = a.chain.localeCompare(b.chain);
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'asc' ? -compareValue : compareValue;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;

    return sortOrder === 'asc' ? (
      <svg className="w-3 h-3 ml-1 inline" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1 inline" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };

  const getChainIcon = (chainId) => {
    const icons = {
      ethereum: '🔷',
      arbitrum: '🔵',
      polygon: '🟣',
      bitcoin: '🟠',
      bnb: '🟡'
    };
    return icons[chainId] || '⚪';
  };

  // Get token icon URL from CoinGecko or fallback
  const getTokenIcon = (asset) => {
    // If asset has image property, use it directly
    if (asset.image) return asset.image;

    // Fallback to common token icons by symbol (CoinGecko direct URLs)
    const commonIcons = {
      'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      'POL': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
      'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
      'DAI': 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
      'WBTC': 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      'ARB': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
      'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
      'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
      'AAVE': 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
      'CRV': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
      'MKR': 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
      'SNX': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
      'COMP': 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
      'SUSHI': 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      'YFI': 'https://assets.coingecko.com/coins/images/11849/small/yearn-finance-yfi.png',
      'BAL': 'https://assets.coingecko.com/coins/images/11683/small/Balancer.png',
      'GRT': 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png',
      'LDO': 'https://assets.coingecko.com/coins/images/13573/small/Lido_DAO.png',
      'RPL': 'https://assets.coingecko.com/coins/images/2090/small/rocket_pool_%28RPL%29.png',
      'GMX': 'https://assets.coingecko.com/coins/images/18323/small/arbit.png',
      'PEPE': 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
      'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
    };

    const symbolUpper = asset.symbol?.toUpperCase();
    if (commonIcons[symbolUpper]) {
      return commonIcons[symbolUpper];
    }

    // Use CryptoCompare API as final fallback (more reliable for unknown tokens)
    if (symbolUpper) {
      return `https://www.cryptocompare.com/media/37746251/${symbolUpper.toLowerCase()}.png`;
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('chain')}
              >
                Chain <SortIcon column="chain" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('symbol')}
              >
                Token <SortIcon column="symbol" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('percentage')}
              >
                Portfolio % <SortIcon column="percentage" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('balance')}
              >
                Amount <SortIcon column="balance" />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('value')}
              >
                Value <SortIcon column="value" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAssets.map((asset, index) => (
              <tr key={`${asset.chain}-${asset.symbol}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">{getChainIcon(asset.chainId)}</span>
                    <span className="text-gray-900">{asset.chain}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTokenIcon(asset) ? (
                      <img
                        className="h-8 w-8 rounded-full mr-3"
                        src={getTokenIcon(asset)}
                        alt={asset.symbol}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {asset.symbol?.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{asset.symbol}</div>
                      <div className="text-xs text-gray-500">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                  {asset.portfolioPercentage.toFixed(2)}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                  {formatCurrency(getAssetPrice(asset, currency), currency)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 font-mono">
                  {formatNumber(asset.balance, asset.decimals)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(getAssetValue(asset, currency), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum asset encontrado</p>
        </div>
      )}
    </div>
  );
}

export default AssetList;
