const UP = 'https://llyanlleeynuznywttjg.supabase.co/functions/v1/link';
// Same-origin proxy: no CORS needed. The upstream only accepts the site origin, so it is set here.
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end(); // CORS preflight from GitHub Pages
  if (req.method !== 'POST') return res.status(405).end();
  // Forward the visitor's real IP and user agent: the link function stores them as TikTok match data.
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const r = await fetch(UP, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://mindmetric.info', 'user-agent': String(req.headers['user-agent'] || ''), 'x-client-ip': ip }, body });
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'application/json');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.status(502).end('x'); }
}
