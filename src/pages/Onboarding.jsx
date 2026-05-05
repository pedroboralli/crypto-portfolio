import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CURRENCIES = [
  { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'BTC', label: 'Bitcoin', symbol: '₿' },
];

function Onboarding() {
  const [currency, setCurrency] = useState('BRL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { onboard, session } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onboard(currency);
      navigate('/dashboard');
    } catch {
      setError('Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-3xl font-extrabold text-gray-900">Bem-vindo!</h2>
          <p className="mt-2 text-gray-500 text-sm">
            Logado como <span className="font-medium text-gray-700">{session?.user?.email}</span>
          </p>
          <p className="mt-4 text-gray-600">Escolha sua moeda padrão para começar</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {CURRENCIES.map((c) => (
              <label
                key={c.value}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  currency === c.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="currency"
                  value={c.value}
                  checked={currency === c.value}
                  onChange={() => setCurrency(c.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-2xl w-8 text-center">{c.symbol}</span>
                <div>
                  <p className="font-medium text-gray-900">{c.label}</p>
                  <p className="text-sm text-gray-500">{c.value}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Configurando...' : 'Começar agora'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Onboarding;
