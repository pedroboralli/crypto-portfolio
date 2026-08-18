import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fora do Docker as env vars vêm do .env; no container elas já chegam
// prontas pelo compose (o .env não é copiado para a imagem).
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

import health from './api/health.js';
import portfolio from './api/portfolio.js';
import prices from './api/prices.js';
import topCoins from './api/data/top-coins.js';
import authMe from './api/auth/me.js';
import authAction from './api/auth/[action].js';
import addresses from './api/user/addresses.js';
import addressById from './api/user/addresses/[id].js';
import preferences from './api/user/preferences.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

/**
 * Adapta um handler no formato Vercel para o Express.
 * A Vercel entrega os segmentos dinâmicos da rota dentro de req.query;
 * no Express eles chegam em req.params, então mesclamos os dois. req.query
 * é um getter do protótipo, por isso a redefinição via defineProperty.
 */
function adapt(handler) {
  return async (req, res, next) => {
    try {
      if (Object.keys(req.params).length > 0) {
        Object.defineProperty(req, 'query', {
          value: { ...req.query, ...req.params },
          writable: true,
          configurable: true,
        });
      }
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

app.all('/api/health', adapt(health));
app.all('/api/portfolio', adapt(portfolio));
app.all('/api/prices', adapt(prices));
app.all('/api/data/top-coins', adapt(topCoins));

// /api/auth/me antes de /api/auth/:action, senão "me" cairia no handler genérico
app.all('/api/auth/me', adapt(authMe));
app.all('/api/auth/:action', adapt(authAction));

app.all('/api/user/addresses', adapt(addresses));
app.all('/api/user/addresses/:id', adapt(addressById));
app.all('/api/user/preferences', adapt(preferences));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Frontend estático + fallback de SPA para tudo que não for /api
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist, { index: false }));
app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Crypto Portfolio ouvindo em http://0.0.0.0:${port}`);
});
