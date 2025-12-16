import { useState } from 'react';
import WalletCard from './WalletCard';
import { validateAddress, getAddressType } from '../utils/validation';

function WalletManager({ wallets, onWalletsChange, onAddWallet, onRemoveWallet, onUpdateLabel, onFetchAll, loading }) {
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Add wallet function
  const handleAddWallet = async () => {
    const trimmedAddress = newAddress.trim();
    const trimmedLabel = newLabel.trim() || `Wallet ${wallets.length + 1}`;

    // Validate address
    const validationError = validateAddress(trimmedAddress);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = wallets.some(
      w => w.address.toLowerCase() === trimmedAddress.toLowerCase()
    );

    if (isDuplicate) {
      setError('Este endereço já foi adicionado');
      return;
    }

    // Determine address type
    const type = getAddressType(trimmedAddress);

    if (!type) {
      setError('Não foi possível determinar o tipo de endereço');
      return;
    }

    try {
      // Call the provided callback to add to database
      if (onAddWallet) {
        await onAddWallet(trimmedLabel, trimmedAddress, type);
      } else {
        // Fallback to local state if no callback provided
        const newWallet = {
          id: crypto.randomUUID(),
          label: trimmedLabel,
          address: trimmedAddress,
          type,
          portfolioData: null,
          loading: false,
          error: null
        };
        onWalletsChange([...wallets, newWallet]);
      }

      // Clear form
      setNewAddress('');
      setNewLabel('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add wallet');
    }
  };

  // Remove wallet function
  const handleRemoveWallet = async (id) => {
    try {
      if (onRemoveWallet) {
        await onRemoveWallet(id);
      } else {
        onWalletsChange(wallets.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove wallet:', err);
    }
  };

  // Edit label function
  const handleEditLabel = async (id, newLabel) => {
    try {
      if (onUpdateLabel) {
        await onUpdateLabel(id, newLabel);
      } else {
        onWalletsChange(
          wallets.map(w => w.id === id ? { ...w, label: newLabel } : w)
        );
      }
    } catch (err) {
      console.error('Failed to update label:', err);
    }
  };

  // Handle input change
  const handleAddressChange = (e) => {
    setNewAddress(e.target.value);
    if (error) {
      setError('');
    }
  };

  // Handle key press in address input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWallet();
    }
  };

  // Examples for quick testing
  const examples = [
    {
      label: 'Vitalik.eth',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      type: 'EVM'
    }
  ];

  const handleExampleClick = (exampleAddress) => {
    setNewAddress(exampleAddress);
    setError('');
  };

  return (
    <div className="card space-y-6">
      {/* Add Wallet Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Gerenciar Wallets
          </h3>
          {wallets.length > 0 && (
            <span className="badge badge-primary">
              {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Label Input */}
          <div>
            <label htmlFor="wallet-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Wallet (opcional)
            </label>
            <input
              id="wallet-label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Hardware Wallet, Carteira Principal..."
              className="input"
              disabled={loading}
            />
          </div>

          {/* Address Input */}
          <div>
            <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço da Wallet
            </label>
            <div className="relative">
              <input
                id="wallet-address"
                type="text"
                value={newAddress}
                onChange={handleAddressChange}
                onKeyPress={handleKeyPress}
                placeholder="0x... ou 1... / 3... / bc1..."
                className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={loading}
                autoComplete="off"
              />
              {newAddress && !error && validateAddress(newAddress.trim()) === null && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Suporta endereços EVM (Ethereum, Arbitrum, Polygon, BNB) e Bitcoin
            </p>
          </div>

          {/* Examples */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">Exemplos:</span>
            {examples.map((example) => (
              <button
                key={example.address}
                type="button"
                onClick={() => handleExampleClick(example.address)}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors"
                disabled={loading}
              >
                {example.label}
                <span className="ml-1 text-gray-500 dark:text-gray-400">({example.type})</span>
              </button>
            ))}
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddWallet}
            disabled={loading || !newAddress}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Adicionar Wallet
          </button>
        </div>
      </div>

      {/* Wallet List Section */}
      {wallets.length > 0 && (
        <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Wallets Adicionadas ({wallets.length})
          </h4>
          <div className="space-y-3">
            {wallets.map(wallet => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onRemove={() => handleRemoveWallet(wallet.id)}
                onEditLabel={(newLabel) => handleEditLabel(wallet.id, newLabel)}
                isEditing={editingId === wallet.id}
                setEditing={(editing) => setEditingId(editing ? wallet.id : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fetch Portfolio Button */}
      {wallets.length > 0 && (
        <div className="border-t border-gray-200 dark:border-dark-600 pt-6">
          <button
            onClick={onFetchAll}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Buscando portfólio...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Portfólio ({wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'})
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {wallets.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Nenhuma wallet adicionada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Adicione uma ou mais wallets para visualizar seu portfólio combinado
          </p>
        </div>
      )}
    </div>
  );
}

export default WalletManager;
