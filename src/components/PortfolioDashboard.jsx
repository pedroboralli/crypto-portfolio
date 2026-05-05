import { formatCurrency } from '../utils/currency';

function PortfolioDashboard({ data, onRefresh, loading, currency = 'BRL' }) {
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

  const get24hAbsoluteChange = () => {
    const totalValue = getTotalValue();
    const changePercent = data.portfolio24hChange || 0;
    return totalValue * (changePercent / 100);
  };

  const totalChains = data.chains?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(getTotalValue(), currency)}
            </p>
          </div>

          <div className="border-l border-gray-200 pl-8">
            <p className="text-sm text-gray-500 mb-1">24h Change</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${(data.portfolio24hChange || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}>
                {(data.portfolio24hChange || 0) >= 0 ? '+' : ''}
                {(data.portfolio24hChange || 0).toFixed(2)}%
              </p>
              <p className={`text-sm font-medium ${(data.portfolio24hChange || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}>
                ({(data.portfolio24hChange || 0) >= 0 ? '+' : ''}
                {formatCurrency(get24hAbsoluteChange(), currency)})
              </p>
            </div>
          </div>

          <div className="border-l border-gray-200 pl-8">
            <p className="text-sm text-gray-500 mb-1">Chains</p>
            <p className="text-2xl font-bold text-gray-900">{totalChains}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Refresh prices"
        >
          <svg
            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
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
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

export default PortfolioDashboard;
