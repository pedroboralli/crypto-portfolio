import { useState } from 'react';
import { Edit2, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="bg-dark-800/60 rounded-xl p-4 border border-white/5 backdrop-blur-md transition-all hover:border-white/10 hover:shadow-lg group">
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
              className="input w-full mb-2 text-sm py-1.5 focus:ring-primary-500"
              autoFocus
              placeholder="Nome da carteira"
            />
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-100 text-sm">
                {wallet.label}
              </h4>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-500 hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Editar nome"
              >
                <Edit2 className="w-3.5 h-3.5" />
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
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
            wallet.type === 'evm'
              ? 'bg-blue-900/20 text-blue-400 border-blue-500/20'
              : 'bg-orange-900/20 text-orange-400 border-orange-500/20'
          }`}>
            {wallet.type === 'evm' ? 'EVM' : 'Bitcoin'}
          </span>

          {/* Status indicators */}
          {wallet.loading && (
            <div className="flex items-center text-xs text-blue-400 mt-2.5">
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Sincronizando...
            </div>
          )}

          {wallet.error && (
            <div className="flex items-start text-xs text-red-400 mt-2.5 bg-red-900/10 p-1.5 rounded-md border border-red-500/10">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0" />
              <span>{wallet.error}</span>
            </div>
          )}

          {wallet.portfolioData && !wallet.loading && !wallet.error && (
            <div className="flex items-center text-xs text-green-400 mt-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Sincronizado
            </div>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="shrink-0 text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
          title="Remover carteira"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default WalletCard;
