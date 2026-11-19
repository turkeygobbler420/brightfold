const UP = 'https://llyanlleeynuznywttjg.supabase.co/functions/v1/sync';
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const h = { 'x-country': String(req.headers['x-vercel-ip-country'] || '') };
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const r = await fetch(UP, { method: 'POST', headers: { ...h, 'content-type': 'text/plain' }, body });
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'text/plain');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.status(502).end('x'); }
}
