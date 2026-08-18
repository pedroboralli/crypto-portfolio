import { requireAuth } from '../../lib/middleware.js';
import { addressSchema } from '../../lib/validation.js';
import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  const userId = decoded.userId;

  // GET /api/user/addresses
  if (req.method === 'GET') {
    try {
      const { rows } = await query(
        `SELECT id, label, address, type, created_at FROM addresses
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
      return res.json({ addresses: rows });
    } catch (error) {
      console.error('Get addresses error:', error);
      return res.status(500).json({ error: 'Failed to get addresses' });
    }
  }

  // POST /api/user/addresses
  if (req.method === 'POST') {
    try {
      const { error: validationError } = addressSchema.validate(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError.details[0].message });
      }

      const { label, address, type } = req.body;

      // Verifica duplicidade (case-insensitive)
      const { rows: existing } = await query(
        'SELECT id FROM addresses WHERE user_id = $1 AND LOWER(address) = LOWER($2)',
        [userId, address]
      );

      if (existing[0]) {
        return res.status(400).json({ error: 'Address already added' });
      }

      const { rows } = await query(
        `INSERT INTO addresses (user_id, label, address, type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, label, address, type]
      );

      return res.status(201).json({ address: rows[0] });
    } catch (error) {
      console.error('Add address error:', error);
      return res.status(500).json({ error: 'Failed to add address' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
