import { requireAuth } from '../../../lib/middleware.js';
import supabase from '../../../lib/db.js';

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
      const { data, error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Address not found' });

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

      const { data, error } = await supabase
        .from('addresses')
        .update({ label })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Address not found' });

      return res.json({ address: data });
    } catch (error) {
      console.error('Update address error:', error);
      return res.status(500).json({ error: 'Failed to update address' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
