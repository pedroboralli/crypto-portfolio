import { useState } from 'react';
import { formatCurrency, formatNumber, getAssetValue, getAssetPrice } from '../utils/currency';

function AssetList({ chains, currency = 'BRL' }) {
  const [sortBy, setSortBy] = useState('value'); // 'value', 'balance', 'symbol'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Consolida todos os assets de todas as chains
  const allAssets = chains.flatMap(chain =>
    chain.assets.map(asset => ({
      ...asset,
      chain: chain.chain,
      chainId: chain.chainId
    }))
  );

  // Ordena assets
  const sortedAssets = [...allAssets].sort((a, b) => {
    let compareValue;

    switch (sortBy) {
      case 'value':
        compareValue = getAssetValue(b, currency) - getAssetValue(a, currency);
        break;
      case 'balance':
        compareValue = parseFloat(b.balance) - parseFloat(a.balance);
        break;
      case 'symbol':
        compareValue = a.symbol.localeCompare(b.symbol);
        break;
      default:
        compareValue = 0;
    }

    return sortOrder === 'asc' ? -compareValue : compareValue;
  });

  // Handler para mudar ordenação
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Ícone de ordenação
  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Badge de chain
  const ChainBadge = ({ chainId, chain }) => {
    const colors = {
      ethereum: 'bg-blue-100 text-blue-800',
      arbitrum: 'bg-purple-100 text-purple-800',
      polygon: 'bg-indigo-100 text-indigo-800',
      bitcoin: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={`badge ${colors[chainId] || 'bg-gray-100 text-gray-800'}`}>
        {chain}
      </span>
    );
  };

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-1">
                  <span>Asset</span>
                  <SortIcon column="symbol" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Chain
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                onClick={() => handleSort('balance')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Quantidade</span>
                  <SortIcon column="balance" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Preço ({currency})
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Valor ({currency})</span>
                  <SortIcon column="value" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                24h
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAssets.map((asset, index) => (
              <tr key={`${asset.chain}-${asset.symbol}-${index}`} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.symbol}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ChainBadge chainId={asset.chainId} chain={asset.chain} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {formatNumber(asset.balance, asset.decimals)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                  {formatCurrency(getAssetPrice(asset, currency), currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(getAssetValue(asset, currency), currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {asset.priceChange24h !== undefined && asset.priceChange24h !== 0 ? (
                    <span
                      className={`inline-flex items-center ${
                        asset.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {asset.priceChange24h >= 0 ? (
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {Math.abs(asset.priceChange24h).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhum asset encontrado</p>
        </div>
      )}
    </div>
  );
}

export default AssetList;
