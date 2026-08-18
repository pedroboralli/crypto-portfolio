/**
 * Cache local do último portfólio sincronizado.
 *
 * Guarda o resultado por usuário no localStorage para que, ao entrar, o saldo
 * apareça na hora (valor da última sessão) enquanto a sincronização roda em
 * segundo plano — em vez de uma tela de "Sincronizando..." em branco.
 */

const CACHE_PREFIX = 'portfolio_cache_v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function cacheKey(userId) {
  return `${CACHE_PREFIX}:${userId ?? 'anon'}`;
}

/**
 * Lê o portfólio salvo do usuário.
 * @param {string|number} userId
 * @returns {{portfolio: object, updatedAt: string}|null}
 */
export function loadPortfolioCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.portfolio || !Array.isArray(parsed.portfolio.chains)) return null;

    const updatedAt = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
    if (!updatedAt || Date.now() - updatedAt > MAX_AGE_MS) {
      localStorage.removeItem(cacheKey(userId));
      return null;
    }

    return { portfolio: parsed.portfolio, updatedAt: parsed.updatedAt };
  } catch (error) {
    console.error('Failed to read portfolio cache:', error);
    return null;
  }
}

/**
 * Salva o portfólio do usuário.
 * @param {string|number} userId
 * @param {object} portfolio
 * @param {string} [updatedAt] ISO date; padrao: agora
 * @returns {string|null} o updatedAt gravado
 */
export function savePortfolioCache(userId, portfolio, updatedAt) {
  if (!portfolio) return null;

  const stamp = updatedAt || new Date().toISOString();
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify({ portfolio, updatedAt: stamp }));
    return stamp;
  } catch (error) {
    // Cota estourada / modo privado: cache é otimização, não pode quebrar o app
    console.error('Failed to write portfolio cache:', error);
    return stamp;
  }
}

/**
 * Remove o portfólio salvo do usuário (ex.: ao remover todas as carteiras).
 * @param {string|number} userId
 */
export function clearPortfolioCache(userId) {
  try {
    localStorage.removeItem(cacheKey(userId));
  } catch (error) {
    console.error('Failed to clear portfolio cache:', error);
  }
}
