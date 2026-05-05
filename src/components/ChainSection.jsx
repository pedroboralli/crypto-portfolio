import { useState } from 'react';
import { formatCurrency, formatNumber, getAssetValue, getAssetPrice, getChainTotal } from '../utils/currency';

function ChainSection({ chain, currency = 'BRL' }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Cores e ícones por chain
  const chainConfig = {
    ethereum: {
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 256 417" fill="currentColor">
          <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fillOpacity=".6" />
          <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
          <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fillOpacity=".6" />
          <path d="M127.962 416.905v-104.72L0 236.585z" />
        </svg>
      )
    },
    arbitrum: {
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.47l7 3.5v7.85l-7-3.5V9.47zm9 11.35v-7.85l7-3.5v7.85l-7 3.5z" />
        </svg>
      )
    },
    polygon: {
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      )
    },
    bitcoin: {
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" />
        </svg>
      )
    },
    bnb: {
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 2500 2500" fill="currentColor">
          <path d="M764.48 1050.52L1250 565l485.75 485.73 282.5-282.5L1250 0 482.02 767.98l282.46 282.54z" />
          <path d="M0 1250l282.5-282.5L565 1250 282.5 1532.5z" />
          <path d="M764.48 1449.48L1250 1935l485.74-485.73 282.65 282.35-.14.15L1250 2500l-768.13-768.13-.14-.15 282.75-282.24z" />
          <path d="M1935 1250l282.5-282.5L2500 1250l-282.5 282.5z" />
          <path d="M1536.52 1250L1250 963.48 1038.99 1174.5l-24.49 24.49-39.01 39.01L1250 1512.5l286.52-286.52-.03-.03.03.05z" />
        </svg>
      )
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
            {config.icon}
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
