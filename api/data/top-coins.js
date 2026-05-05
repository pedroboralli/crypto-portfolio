import { getGlobalTop100 } from '../../../lib/services/marketService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await getGlobalTop100();
    // Cache via Vercel CDN por 5 minutos (mesmo TTL do node-cache anterior)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.json(data);
  } catch (error) {
    console.error('Error in /api/data/top-coins:', error);
    return res.status(500).json({ error: 'Failed to fetch coin data' });
  }
}
