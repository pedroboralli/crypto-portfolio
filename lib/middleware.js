import supabase from './db.js';

export async function verifySupabaseToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    throw { status: 401, error: 'No token provided' };
  }
  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw { status: 401, error: 'Invalid or expired token' };
  return user;
}

export async function requireAuth(req) {
  const authUser = await verifySupabaseToken(req);

  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', authUser.email)
    .maybeSingle();

  if (!user) throw { status: 403, error: 'Onboarding required' };

  return { userId: user.id, email: user.email };
}

export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
