import { formatCurrency } from '../utils/currency';

function PortfolioDashboard({ data, onRefresh, loading, currency = 'BRL' }) {
  // Obtém o valor total na moeda selecionada
  const getTotalValue = () => {
    switch (currency) {
      case 'BRL':
        return data.totalValueBRL || 0;
      case 'USD':
        return data.totalValueUSD || 0;
      case 'BTC':
        return data.totalValueBTC || 0;
      default:
        return data.totalValueBRL || 0;
    }
  };

  // Calculate 24h absolute value change
  const get24hAbsoluteChange = () => {
    const totalValue = getTotalValue();
    const changePercent = data.portfolio24hChange || 0;
    return totalValue * (changePercent / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header com valor total e botão refresh */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Valor Total do Portfólio ({currency})
            </h2>
            <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(getTotalValue(), currency)}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary flex items-center disabled:opacity-50"
            title="Atualizar preços"
          >
            <svg
              className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Atualizar
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.walletCount || 1}
              </p>
            </div>
          </div>

          {/* 24h Portfolio Change */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                (data.portfolio24hChange || 0) >= 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    (data.portfolio24hChange || 0) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {(data.portfolio24hChange || 0) >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  )}
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">24h Change</p>
              <p className={`text-2xl font-bold ${
                (data.portfolio24hChange || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(data.portfolio24hChange || 0) >= 0 ? '+' : ''}
                {(data.portfolio24hChange || 0).toFixed(2)}%
              </p>
              <p className={`text-sm font-medium ${
                (data.portfolio24hChange || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(data.portfolio24hChange || 0) >= 0 ? '+' : ''}
                {formatCurrency(get24hAbsoluteChange(), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioDashboard;
