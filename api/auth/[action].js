import { query } from '../../lib/db.js';
import { hashPassword, verifyPassword, generateToken } from '../../lib/auth.js';
import { registerSchema, loginSchema } from '../../lib/validation.js';

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'POST' && action === 'register') return handleRegister(req, res);
  if (req.method === 'POST' && action === 'login') return handleLogin(req, res);

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleRegister(req, res) {
  const { error: validationError } = registerSchema.validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError.details[0].message });
  }

  const { email, password } = req.body;

  try {
    const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing[0]) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    const user = rows[0];

    await query(
      'INSERT INTO user_preferences (user_id, default_currency) VALUES ($1, $2)',
      [user.id, 'BRL']
    );

    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleLogin(req, res) {
  const { error: validationError } = loginSchema.validate(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError.details[0].message });
  }

  const { email, password, rememberMe } = req.body;

  try {
    const { rows } = await query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ userId: user.id, email: user.email }, rememberMe);

    return res.json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
