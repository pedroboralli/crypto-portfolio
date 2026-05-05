import { useState } from 'react';

function WalletCard({ wallet, onRemove, onEditLabel, isEditing, setEditing }) {
  const [tempLabel, setTempLabel] = useState(wallet.label);

  const handleSaveLabel = () => {
    if (tempLabel.trim()) {
      onEditLabel(tempLabel.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveLabel();
    } else if (e.key === 'Escape') {
      setTempLabel(wallet.label);
      setEditing(false);
    }
  };

  // Truncate address for display
  const truncateAddress = (addr) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  return (
    <div className="bg-white/70 dark:bg-dark-800/50 rounded-xl p-4 border border-gray-200 dark:border-dark-600 backdrop-blur-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label (editable) */}
          {isEditing ? (
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={handleKeyDown}
              className="input w-full mb-2 text-sm py-1.5"
              autoFocus
              placeholder="Nome da wallet"
            />
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {wallet.label}
              </h4>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Editar nome"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          {/* Address */}
          <p
            className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2"
            title={wallet.address}
          >
            {truncateAddress(wallet.address)}
          </p>

          {/* Type badge */}
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            wallet.type === 'evm'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
          }`}>
            {wallet.type === 'evm' ? 'EVM' : 'Bitcoin'}
          </span>

          {/* Status indicators */}
          {wallet.loading && (
            <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-2">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
              Carregando...
            </div>
          )}

          {wallet.error && (
            <div className="flex items-start text-xs text-red-600 dark:text-red-400 mt-2">
              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{wallet.error}</span>
            </div>
          )}

          {wallet.portfolioData && !wallet.loading && !wallet.error && (
            <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-2">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Dados carregados
            </div>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Remover wallet"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default WalletCard;
