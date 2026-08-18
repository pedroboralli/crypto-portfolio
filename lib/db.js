import pg from 'pg';

const { Pool } = pg;

/**
 * Monta a config de conexão a partir das env vars do .env.
 * POSTGRES_URL só é usada para extrair host/porta (o scheme pode
 * vir incorreto, ex. "http://", dependendo de onde a env foi definida).
 */
function buildConfig() {
  const { POSTGRES_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env;

  if (!POSTGRES_URL) {
    throw new Error('Missing POSTGRES_URL environment variable');
  }

  const { hostname, port } = new URL(POSTGRES_URL);

  return {
    host: hostname,
    port: port ? Number(port) : 5432,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
  };
}

// Lazy — evita crash no boot do módulo em ambientes serverless
// onde as env vars são injetadas após o módulo ser carregado.
let _pool = null;
function getPool() {
  if (!_pool) _pool = new Pool(buildConfig());
  return _pool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

export default { query };
