import { useState } from 'react';
import { Wallet, ChevronDown, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

function WalletWidget({ wallets, onExpand, onAddWallet }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const walletCount = wallets.length;

  return (
    <div className="relative">
      <button
        onClick={onExpand}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-dark-700/60 transition-all duration-300 shadow-lg"
        title="Gerenciar wallets"
      >
        <Wallet className="w-4 h-4 text-primary-400" />
        <span className="text-sm font-medium text-gray-200">
          {walletCount} {walletCount === 1 ? 'carteira' : 'carteiras'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Tooltip with wallet list */}
      {showTooltip && wallets.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-dark-800/90 rounded-xl shadow-2xl border border-white/10 p-3 z-50 backdrop-blur-xl animate-fade-in">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Minhas Carteiras
          </h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {wallets.map(wallet => (
              <div key={wallet.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                <span className="text-gray-300 truncate flex-1 font-medium" title={wallet.label}>
                  {wallet.label}
                </span>
                {wallet.error ? (
                  <AlertCircle className="w-4 h-4 text-red-400 ml-2 shrink-0" />
                ) : wallet.portfolioData ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-2 shrink-0" />
                ) : null}
              </div>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddWallet();
              setShowTooltip(false);
            }}
            className="mt-3 w-full text-xs btn-primary py-2 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Carteira
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletWidget;
