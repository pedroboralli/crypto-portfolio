import { requireAuth } from '../../lib/middleware.js';
import { query } from '../../lib/db.js';

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
      const { rows } = await query(
        'SELECT default_currency FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      return res.json({ preferences: rows[0] || { default_currency: 'BRL' } });
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

      const { rows } = await query(
        `INSERT INTO user_preferences (user_id, default_currency)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET default_currency = EXCLUDED.default_currency
         RETURNING *`,
        [userId, default_currency]
      );

      return res.json({ preferences: rows[0] });
    } catch (error) {
      console.error('Update preferences error:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
