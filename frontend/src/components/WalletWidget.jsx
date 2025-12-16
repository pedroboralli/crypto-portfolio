import { useState } from 'react';

function WalletWidget({ wallets, onExpand, onAddWallet }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const walletCount = wallets.length;

  return (
    <div className="relative">
      <button
        onClick={onExpand}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-gray-200 dark:border-dark-600 hover:bg-white dark:hover:bg-dark-800 transition-all"
        title="Gerenciar wallets"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {walletCount} {walletCount === 1 ? 'wallet' : 'wallets'}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tooltip with wallet list */}
      {showTooltip && wallets.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-600 p-3 z-50 backdrop-blur-xl">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Minhas Wallets
          </h4>
          <div className="space-y-2">
            {wallets.map(wallet => (
              <div key={wallet.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 truncate flex-1" title={wallet.label}>
                  {wallet.label}
                </span>
                {wallet.error ? (
                  <span className="text-xs text-red-600 dark:text-red-400 ml-2">Erro</span>
                ) : wallet.portfolioData ? (
                  <svg className="w-4 h-4 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddWallet();
            }}
            className="mt-3 w-full text-xs btn-primary py-1.5"
          >
            + Adicionar Wallet
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletWidget;
