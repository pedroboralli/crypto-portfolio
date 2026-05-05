import { verifySupabaseToken } from '../../lib/middleware.js';
import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let authUser;
  try {
    authUser = await verifySupabaseToken(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', authUser.email)
      .maybeSingle();

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
}
