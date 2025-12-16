#!/bin/sh
# Script de inicialização do backend com espera pelo banco de dados

echo "🔄 Waiting for database to be ready..."

# Espera o PostgreSQL estar pronto
until node -e "
const pg = require('pg');
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crypto',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});
pool.query('SELECT 1')
  .then(() => { pool.end(); process.exit(0); })
  .catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  echo "⏳ Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Executa migrações
echo "🔄 Running database migrations..."
npm run migrate

# Inicia o servidor
echo "🚀 Starting server..."
exec npm start
