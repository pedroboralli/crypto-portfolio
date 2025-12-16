import axios from 'axios';

// Base URL da API (usa variável de ambiente ou fallback para desenvolvimento local)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cria instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de requisições (adiciona logs em desenvolvimento)
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respostas (trata erros globalmente)
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response:', response.status, response.data);
    }
    return response;
  },
  (error) => {
    console.error('Response Error:', error);

    // Trata diferentes tipos de erros
    if (error.response) {
      // Servidor respondeu com status de erro
      const message = error.response.data?.error?.message || 'Erro na requisição';
      throw new Error(message);
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      throw new Error('Servidor não está respondendo. Verifique sua conexão.');
    } else {
      // Erro na configuração da requisição
      throw new Error('Erro ao fazer requisição: ' + error.message);
    }
  }
);

/**
 * Busca portfólio completo para um endereço
 * @param {string} address - Endereço da wallet (EVM ou Bitcoin)
 * @returns {Promise<Object>} Dados do portfólio
 */
export async function getPortfolio(address) {
  try {
    const response = await api.post('/api/portfolio', { address });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca portfólio com endereços separados para EVM e Bitcoin
 * @param {string} evmAddress - Endereço EVM
 * @param {string} btcAddress - Endereço Bitcoin
 * @returns {Promise<Object>} Dados do portfólio
 */
export async function getPortfolioMultiAddress(evmAddress, btcAddress) {
  try {
    const response = await api.post('/api/portfolio', {
      evmAddress,
      btcAddress
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca preços de criptomoedas
 * @param {string[]} symbols - Array de símbolos (ex: ['ETH', 'BTC', 'MATIC'])
 * @returns {Promise<Object>} Objeto com preços
 */
export async function getPrices(symbols) {
  try {
    const response = await api.get('/api/prices', {
      params: { symbols: symbols.join(',') }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Limpa cache do portfólio no backend
 * @returns {Promise<Object>} Confirmação
 */
export async function clearCache() {
  try {
    const response = await api.post('/api/portfolio/clear-cache');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Health check da API
 * @returns {Promise<Object>} Status da API
 */
export async function healthCheck() {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Exporta instância do axios para usos customizados
export default api;
