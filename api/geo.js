// Visitor country from Vercel's edge (two letters, or empty when unknown).
export default function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  res.send(String(req.headers['x-vercel-ip-country'] || ''));
}
