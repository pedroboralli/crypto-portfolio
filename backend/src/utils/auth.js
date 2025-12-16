import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN_SHORT = '24h'; // Default session (no remember me)
const JWT_EXPIRES_IN_LONG = '7d';   // Remember me enabled

// Hash password
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Generate JWT token with optional custom expiration
export function generateToken(payload, rememberMe = false) {
  const expiresIn = rememberMe ? JWT_EXPIRES_IN_LONG : JWT_EXPIRES_IN_SHORT;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
