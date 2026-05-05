import { verifyToken } from './auth.js';

/**
 * Extrai e valida o JWT do header Authorization.
 * Retorna o payload decodificado ou lança um Response de erro.
 *
 * @param {Request} req - Request da Vercel Function
 * @returns {{ userId: number, email: string }} payload do token
 * @throws {Response} 401 se inválido
 */
export function requireAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    throw { status: 401, error: 'Invalid or expired token' };
  }

  return decoded;
}

/**
 * Helper para enviar respostas de erro padronizadas.
 */
export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
