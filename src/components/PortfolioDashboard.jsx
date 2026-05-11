import { formatCurrency } from '../utils/currency';
import { RefreshCw, Wallet, TrendingUp, Layers } from 'lucide-react';

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
  const isPositive = (data.portfolio24hChange || 0) >= 0;

  return (
    <div className="card-glass p-8 border-t-2 border-t-primary-500 overflow-hidden relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 w-full">
          {/* Total Value */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Wallet className="w-4 h-4" />
              <p className="text-sm font-medium uppercase tracking-wider">Saldo Total</p>
            </div>
            <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {formatCurrency(getTotalValue(), currency)}
            </p>
          </div>

          {/* 24h Change */}
          <div className="hidden md:block w-px h-16 bg-white/10"></div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <p className="text-sm font-medium uppercase tracking-wider">Desempenho 24h</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}
                {(data.portfolio24hChange || 0).toFixed(2)}%
              </p>
              <p className={`text-sm font-medium bg-dark-800/50 px-2 py-1 rounded-md border ${isPositive ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                {isPositive ? '+' : ''}
                {formatCurrency(get24hAbsoluteChange(), currency)}
              </p>
            </div>
          </div>

          {/* Chains Count */}
          <div className="hidden md:block w-px h-16 bg-white/10"></div>
          
          <div className="flex-1 md:flex-none">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Layers className="w-4 h-4" />
              <p className="text-sm font-medium uppercase tracking-wider">Redes Ativas</p>
            </div>
            <p className="text-3xl font-bold text-white">{totalChains}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-primary shrink-0 self-start md:self-center"
          title="Atualizar preços"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Sincronizando...' : 'Atualizar'}
        </button>
      </div>
    </div>
  );
}

export default PortfolioDashboard;
