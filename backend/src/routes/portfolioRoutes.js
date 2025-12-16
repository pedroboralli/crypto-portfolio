import express from 'express';
import {
  getPortfolio,
  getPricesEndpoint,
  clearCache,
  healthCheck
} from '../controllers/portfolioController.js';

const router = express.Router();

/**
 * POST /api/portfolio
 * Busca portfólio completo para endereços fornecidos
 * Body: { address: string } ou { evmAddress: string, btcAddress: string }
 */
router.post('/portfolio', getPortfolio);

/**
 * GET /api/prices?symbols=ETH,BTC,MATIC
 * Busca preços de criptomoedas em BRL
 */
router.get('/prices', getPricesEndpoint);

/**
 * POST /api/portfolio/clear-cache
 * Limpa cache do portfólio
 */
router.post('/portfolio/clear-cache', clearCache);

/**
 * GET /api/health
 * Health check com informações do sistema
 */
router.get('/health', healthCheck);

export default router;
