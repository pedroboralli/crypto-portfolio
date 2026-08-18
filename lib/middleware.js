import { verifyToken } from './auth.js';
import { query } from './db.js';

export async function requireAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) throw { status: 401, error: 'Invalid or expired token' };

  const { rows } = await query('SELECT id, email, created_at FROM users WHERE id = $1', [payload.userId]);
  const user = rows[0];
  if (!user) throw { status: 401, error: 'User not found' };

  return { userId: user.id, email: user.email, createdAt: user.created_at };
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
