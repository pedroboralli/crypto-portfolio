import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN_SHORT = '24h'; // sessão padrão
const JWT_EXPIRES_IN_LONG = '7d';   // remember me

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload, rememberMe = false) {
  const expiresIn = rememberMe ? JWT_EXPIRES_IN_LONG : JWT_EXPIRES_IN_SHORT;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
