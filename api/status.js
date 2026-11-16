// GET /api/status?click_id=...  ->  {paid:boolean}. Read by the checkout page while the buyer pays in the pop-out.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, STATUS_ORIGIN (default https://turkeygobbler420.github.io)
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

module.exports = async function handler(req, res) {
  const origin = process.env.STATUS_ORIGIN || 'https://turkeygobbler420.github.io';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET'); return res.status(204).end(); }
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });

  const id = String((req.query || {}).click_id || '');
  if (!CLICK_ID_RE.test(id)) return res.status(400).json({ error: 'bad click_id' });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return res.status(200).json({ paid: false, configured: false });

  try {
    const r = await fetch(url.replace(/\/$/, '') + '/rest/v1/paid_clicks?select=click_id&limit=1&click_id=eq.' + encodeURIComponent(id),
      { headers: { apikey: key, Authorization: 'Bearer ' + key } });
    if (!r.ok) return res.status(200).json({ paid: false });
    const rows = await r.json();
    return res.status(200).json({ paid: Array.isArray(rows) && rows.length > 0 });
  } catch (e) {
    return res.status(200).json({ paid: false });
  }
};
