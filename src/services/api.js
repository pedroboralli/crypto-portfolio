import axios from 'axios';

/**
 * Instância axios com base relativa.
 * Em produção na Vercel, /api/* vai para as Vercel Functions.
 * Em dev local com `vercel dev`, idem.
 */
const api = axios.create({
  baseURL: '/',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.error?.message || error.response.data?.error || 'Erro na requisição';
      throw new Error(message);
    } else if (error.request) {
      throw new Error('Servidor não está respondendo. Verifique sua conexão.');
    } else {
      throw new Error('Erro ao fazer requisição: ' + error.message);
    }
  }
);

export async function getPortfolio(address) {
  const response = await api.post('/api/portfolio', { address });
  return response.data;
}

export async function getPortfolioMultiAddress(evmAddress, btcAddress) {
  const response = await api.post('/api/portfolio', { evmAddress, btcAddress });
  return response.data;
}

export async function getPrices(symbols) {
  const response = await api.get('/api/prices', {
    params: { symbols: symbols.join(',') },
  });
  return response.data;
}

export async function clearCache() {
  const response = await api.post('/api/portfolio/clear-cache');
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/api/health');
  return response.data;
}

export default api;
