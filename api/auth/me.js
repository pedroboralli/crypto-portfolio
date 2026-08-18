import { requireAuth } from '../../lib/middleware.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await requireAuth(req);
    return res.json({
      user: { id: authUser.userId, email: authUser.email, created_at: authUser.createdAt },
    });
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.error || 'Unauthorized' });
  }
}
