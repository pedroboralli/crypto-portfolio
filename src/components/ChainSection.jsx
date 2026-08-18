import { useState } from 'react';
import { formatCurrency, formatNumber, getAssetValue, getAssetPrice, getChainTotal } from '../utils/currency';
import ChainIcon from './ChainIcon';
import CryptoIcon from './CryptoIcon';

function ChainSection({ chain, currency = 'BRL' }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Cores por chain
  const chainConfig = {
    ethereum: {
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    arbitrum: {
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
    },
    polygon: {
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
    },
    bitcoin: {
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
    },
    bnb: {
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
    }
  };

  const config = chainConfig[chain.chainId] || chainConfig.ethereum;

  return (
    <div className={`card border-2 ${config.borderColor}`}>
      {/* Header da Chain */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`${config.color} text-white p-3 rounded-lg`}>
            <ChainIcon chainId={chain.chainId} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{chain.chain}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {chain.assets.length} {chain.assets.length === 1 ? 'asset' : 'assets'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Valor Total ({currency})</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(getChainTotal(chain, currency), currency)}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              className={`w-6 h-6 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Lista de Assets */}
      {isExpanded && chain.assets.length > 0 && (
        <div className="mt-6 space-y-3">
          {chain.assets.map((asset, index) => (
            <div
              key={`${asset.symbol}-${index}`}
              className={`${config.bgColor} rounded-lg p-4 border ${config.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <CryptoIcon 
                      symbol={asset.symbol} 
                      name={asset.name} 
                      imageUrl={asset.image}
                      size="medium"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {asset.symbol}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</p>
                    </div>
                    {asset.isNative && (
                      <span className="badge bg-primary-100 text-primary-700">
                        Native
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Quantidade</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">
                        {formatNumber(asset.balance, asset.decimals)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Preço ({currency})</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(getAssetPrice(asset, currency), currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total ({currency})</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(getAssetValue(asset, currency), currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Variação 24h */}
                {asset.priceChange24h !== undefined && asset.priceChange24h !== 0 && (
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">24h</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        asset.priceChange24h >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {asset.priceChange24h >= 0 ? '+' : ''}
                      {asset.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Endereço do contrato (se não for nativo) */}
              {!asset.isNative && asset.address && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Endereço do Contrato</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate mt-1">
                    {asset.address}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isExpanded && chain.assets.length === 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Nenhum asset encontrado nesta chain</p>
        </div>
      )}
    </div>
  );
}

export default ChainSection;
