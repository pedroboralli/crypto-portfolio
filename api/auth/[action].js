import { verifySupabaseToken } from '../../lib/middleware.js';
import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'POST' && action === 'onboard') {
    return handleOnboard(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleOnboard(req, res) {
  let authUser;
  try {
    authUser = await verifySupabaseToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', authUser.email)
      .maybeSingle();

    if (existing) {
      return res.json({
        user: { id: existing.id, email: existing.email, createdAt: existing.created_at },
      });
    }

    const { default_currency = 'BRL' } = req.body || {};

    const { data: user, error } = await supabase
      .from('users')
      .insert({ email: authUser.email })
      .select('id, email, created_at')
      .single();

    if (error) throw error;

    await supabase
      .from('user_preferences')
      .insert({ user_id: user.id, default_currency });

    return res.status(201).json({
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch (error) {
    console.error('Onboard error:', error);
    return res.status(500).json({ error: 'Onboarding failed' });
  }
}
