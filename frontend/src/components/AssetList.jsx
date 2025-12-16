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
