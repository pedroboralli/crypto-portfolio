import { requireAuth } from '../../lib/middleware.js';
import { addressSchema } from '../../lib/validation.js';
import supabase from '../../lib/db.js';

export default async function handler(req, res) {
  let decoded;
  try {
    decoded = requireAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }

  const userId = decoded.userId;

  // GET /api/user/addresses
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('id, label, address, type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ addresses: data });
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
      const { data: existing } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', userId)
        .ilike('address', address)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: 'Address already added' });
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({ user_id: userId, label, address, type })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ address: data });
    } catch (error) {
      console.error('Add address error:', error);
      return res.status(500).json({ error: 'Failed to add address' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
