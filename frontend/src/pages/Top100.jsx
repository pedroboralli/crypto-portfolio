import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import api from '../services/api';

function Top100() {
    const [coins, setCoins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTop100();
    }, []);

    const fetchTop100 = async () => {
        try {
            setLoading(true);
            // Calls our backend proxy which caches CoinGecko data
            // Uses shared api instance which handles base URL automatically
            // Endpoint renamed to 'data' to bypass AdBlockers that block 'market'
            const response = await api.get('/api/data/top-coins');
            setCoins(response.data);
        } catch (err) {
            console.error('Error fetching top 100:', err);
            // Check for specific blocking errors
            if (err.message && (err.message.includes('Network Error') || err.message.includes('BLOCKED'))) {
                setError('A requisição foi bloqueada. Se estiver usando um bloqueador de anúncios, tente desativá-lo ou adicionar uma exceção.');
            } else {
                setError('Falha ao carregar dados do mercado. Tente novamente em instantes.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getChangeColor = (value) => {
        if (!value) return 'text-gray-400';
        return value >= 0 ? 'text-green-600' : 'text-red-600';
    };

    const formatPercentage = (value) => {
        if (value === undefined || value === null) return '-';
        return `${value >= 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium text-lg">Carregando...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="text-center">
                    <p className="mb-4 text-red-600">{error}</p>
                    <button onClick={fetchTop100} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Top 100 Criptomoedas por Capitalização de Mercado</h1>

                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Preço</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">1h %</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">24h %</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">7d %</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cap. de Mercado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {coins.map((coin) => (
                                <tr key={coin.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                                        {coin.market_cap_rank}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-8 w-8 rounded-full mr-3" src={coin.image} alt={coin.name} />
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{coin.name}</div>
                                                <div className="text-xs text-gray-500 uppercase">{coin.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                        {formatCurrency(coin.current_price, 'USD')}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getChangeColor(coin.price_change_percentage_1h_in_currency)}`}>
                                        {formatPercentage(coin.price_change_percentage_1h_in_currency)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getChangeColor(coin.price_change_percentage_24h)}`}>
                                        {formatPercentage(coin.price_change_percentage_24h)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getChangeColor(coin.price_change_percentage_7d_in_currency)}`}>
                                        {formatPercentage(coin.price_change_percentage_7d_in_currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                        {formatCurrency(coin.market_cap, 'USD').replace('.00', '')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-center text-xs text-gray-500">
                    Dados fornecidos por CoinGecko. Atualização automática a cada 5 minutos.
                </div>
            </div>
        </div>
    );
}

export default Top100;
