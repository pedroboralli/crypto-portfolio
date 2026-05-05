import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN_SHORT = '24h';
const JWT_EXPIRES_IN_LONG = '7d';

// Leitura lazy — não lança no import, só quando a função é chamada.
// Isso evita crash no boot do módulo em ambientes serverless
// onde as env vars são injetadas APÓS o módulo ser carregado.
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET environment variable');
  return secret;
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
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}
