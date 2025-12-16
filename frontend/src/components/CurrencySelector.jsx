import { useState, useEffect } from 'react';

const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', flag: '🇧🇷' },
  { code: 'USD', symbol: '$', name: 'Dólar Americano', flag: '🇺🇸' },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', flag: '₿' }
];

function CurrencySelector({ selectedCurrency, onCurrencyChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.currency-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (currency) => {
    onCurrencyChange(currency.code);
    setIsOpen(false);
  };

  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  return (
    <div className="currency-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary flex items-center space-x-2 px-4 py-2"
        aria-label="Selecionar moeda"
      >
        <span className="text-lg">{currentCurrency.flag}</span>
        <span className="font-semibold">{currentCurrency.code}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
          <div className="py-1">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center justify-between ${
                  currency.code === selectedCurrency
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{currency.flag}</span>
                  <div>
                    <div className="font-semibold">{currency.code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                  </div>
                </div>
                {currency.code === selectedCurrency && (
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            Os valores são convertidos em tempo real
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencySelector;
