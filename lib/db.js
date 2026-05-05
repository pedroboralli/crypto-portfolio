import { createClient } from '@supabase/supabase-js';

/**
 * Cria o cliente Supabase de forma lazy — lido no primeiro uso,
 * não no import do módulo. Necessário em serverless (Vercel Functions)
 * onde env vars são injetadas após o módulo ser carregado.
 */
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Singleton em memória — reutiliza a mesma instância dentro da mesma invocação
let _client = null;

export default new Proxy({}, {
  get(_, prop) {
    if (!_client) _client = getSupabase();
    return _client[prop];
  },
});
