import { useState } from 'react';

function WalletInput({ onSubmit, loading }) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  // Validação básica de endereço
  const validateAddress = (addr) => {
    if (!addr || addr.trim().length === 0) {
      return 'Endereço é obrigatório';
    }

    // Valida endereço Ethereum (0x + 40 caracteres hexadecimais)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;

    // Valida endereço Bitcoin (vários formatos)
    const btcLegacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const btcSegwitRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const btcBech32Regex = /^(bc1)[a-z0-9]{39,59}$/;

    const isEthAddress = ethRegex.test(addr);
    const isBtcAddress = btcLegacyRegex.test(addr) || btcSegwitRegex.test(addr) || btcBech32Regex.test(addr);

    if (!isEthAddress && !isBtcAddress) {
      return 'Endereço inválido. Use um endereço EVM (0x...) ou Bitcoin';
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedAddress = address.trim();
    const validationError = validateAddress(trimmedAddress);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit(trimmedAddress);
  };

  const handleInputChange = (e) => {
    setAddress(e.target.value);
    if (error) {
      setError('');
    }
  };

  // Exemplos de endereços para facilitar testes
  const examples = [
    {
      label: 'Vitalik.eth',
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      type: 'EVM'
    }
  ];

  const handleExampleClick = (exampleAddress) => {
    setAddress(exampleAddress);
    setError('');
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endereço da Wallet
          </label>
          <div className="relative">
            <input
              id="wallet-address"
              type="text"
              value={address}
              onChange={handleInputChange}
              placeholder="0x... ou 1... / 3... / bc1..."
              className={`input ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={loading}
              autoComplete="off"
            />
            {address && !error && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Suporta endereços EVM (Ethereum, Arbitrum, Polygon) e Bitcoin
          </p>
        </div>

        {/* Exemplos */}
        <div className="flex flex-wrap gap-2">
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

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={loading || !address}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Buscando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar Portfólio
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default WalletInput;
