const UP = 'https://llyanlleeynuznywttjg.supabase.co/functions/v1/sync';
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const h = { 'x-country': String(req.headers['x-vercel-ip-country'] || '') };
  try {
    let r;
    if (req.method === 'GET') {
      r = await fetch(UP + '?d=' + encodeURIComponent(String(req.query.d || '')), { headers: h });
    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      r = await fetch(UP, { method: 'POST', headers: { ...h, 'content-type': 'text/plain' }, body });
    } else return res.status(405).end();
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'text/plain');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.status(502).end('x'); }
}
