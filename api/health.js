export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
