import { requireAuth } from '../../lib/middleware.js';
import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  const userId = decoded.userId;

  // GET /api/user/preferences
  if (req.method === 'GET') {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('default_currency')
        .eq('user_id', userId)
        .maybeSingle();

      return res.json({ preferences: data || { default_currency: 'BRL' } });
    } catch (error) {
      console.error('Get preferences error:', error);
      return res.status(500).json({ error: 'Failed to get preferences' });
    }
  }

  // PUT /api/user/preferences
  if (req.method === 'PUT') {
    try {
      const { default_currency } = req.body;

      if (!['BRL', 'USD', 'BTC'].includes(default_currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: userId, default_currency },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return res.json({ preferences: data });
    } catch (error) {
      console.error('Update preferences error:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
