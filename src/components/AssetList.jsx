import { useState } from 'react';
import { formatCurrency, formatNumber, getAssetValue, getAssetPrice } from '../utils/currency';
import ChainIcon from './ChainIcon';
import CryptoIcon from './CryptoIcon';

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



  return (
    <div className="card-glass p-0 overflow-hidden border border-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-dark-800/50 backdrop-blur-md">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('chain')}
              >
                Rede <SortIcon column="chain" />
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('symbol')}
              >
                Ativo <SortIcon column="symbol" />
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('percentage')}
              >
                % Portfólio <SortIcon column="percentage" />
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                Preço
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('balance')}
              >
                Quantidade <SortIcon column="balance" />
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('value')}
              >
                Valor Total <SortIcon column="value" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedAssets.map((asset, index) => (
              <tr key={`${asset.chain}-${asset.symbol}-${index}`} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <ChainIcon chainId={asset.chainId} className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
                    <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{asset.chain}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <CryptoIcon 
                      symbol={asset.symbol} 
                      name={asset.name} 
                      imageUrl={asset.image}
                      size="large" 
                      className="shadow-lg bg-dark-800" 
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-100 group-hover:text-primary-400 transition-colors">{asset.symbol}</div>
                      <div className="text-xs text-gray-500">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-gray-200 font-medium">{asset.portfolioPercentage.toFixed(2)}%</span>
                    <div className="w-16 h-1 bg-dark-800 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full" 
                        style={{ width: `${Math.min(asset.portfolioPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300">
                  {formatCurrency(getAssetPrice(asset, currency), currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-300 font-mono">
                  {formatNumber(asset.balance, asset.decimals)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-white">
                  {formatCurrency(getAssetValue(asset, currency), currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAssets.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">Nenhum ativo encontrado</p>
        </div>
      )}
    </div>
  );
}

export default AssetList;
