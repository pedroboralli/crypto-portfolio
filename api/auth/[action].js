import { hashPassword, verifyPassword, generateToken } from '../../lib/auth.js';
import { registerSchema, loginSchema } from '../../lib/validation.js';
import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'POST' && action === 'register') {
    return handleRegister(req, res);
  }

  if (req.method === 'POST' && action === 'login') {
    return handleLogin(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleRegister(req, res) {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password } = req.body;

    // Verifica duplicidade
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash })
      .select('id, email, created_at')
      .single();

    if (insertError) throw insertError;

    // Cria preferências padrão
    await supabase
      .from('user_preferences')
      .insert({ user_id: user.id, default_currency: 'BRL' });

    const token = generateToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleLogin(req, res) {
  try {
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password, rememberMe = false } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('id, email, password_hash, created_at')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
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
