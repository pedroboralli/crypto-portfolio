import { requireAuth } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

export default async function handler(req, res) {
  let decoded;
  try {
    decoded = await requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  const userId = decoded.userId;
  const { id } = req.query;

  // DELETE /api/user/addresses/[id]
  if (req.method === 'DELETE') {
    try {
      const { rows } = await query(
        'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Address not found' });

      return res.json({ message: 'Address deleted successfully' });
    } catch (error) {
      console.error('Delete address error:', error);
      return res.status(500).json({ error: 'Failed to delete address' });
    }
  }

  // PATCH /api/user/addresses/[id]
  if (req.method === 'PATCH') {
    try {
      const { label } = req.body;
      if (!label || label.trim().length === 0) {
        return res.status(400).json({ error: 'Label is required' });
      }

      const { rows } = await query(
        'UPDATE addresses SET label = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [label, id, userId]
      );

      if (!rows[0]) return res.status(404).json({ error: 'Address not found' });

      return res.json({ address: rows[0] });
    } catch (error) {
      console.error('Update address error:', error);
      return res.status(500).json({ error: 'Failed to update address' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
