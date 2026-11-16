// Affiliate network server-to-server postback.
//
// Network postback URL (set in the network dashboard):
//   https://<your-domain>/api/postback?click_id={sub8}&payout=24&token=<POSTBACK_TOKEN>
//
// Env vars (Vercel -> Settings -> Environment Variables):
//   POSTBACK_TOKEN    optional but recommended; requests without a matching ?token= are rejected
//   SUPABASE_URL, SUPABASE_SERVICE_KEY  store paid click ids so /api/status can unlock the buyer's page
//   META_PIXEL_ID     optional; with META_ACCESS_TOKEN, forwards the conversion to Meta Conversions API
//   META_ACCESS_TOKEN optional
//   META_TEST_CODE    optional; Meta "Test Events" code while testing

const crypto = require('crypto');

const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function timingSafeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function sendToMeta({ clickId, payout }) {
  const pixel = process.env.META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixel || !token) return { skipped: true };

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: clickId, // dedupes against a browser-side pixel event with the same id
      action_source: 'website',
      user_data: { external_id: [sha256(clickId)] },
      custom_data: { currency: 'USD', value: payout },
    }],
  };
  if (process.env.META_TEST_CODE) body.test_event_code = process.env.META_TEST_CODE;

  const r = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  );
  return { status: r.status, ok: r.ok };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method Not Allowed');
  }

  const q = req.query || {};
  const expected = process.env.POSTBACK_TOKEN;
  if (expected && !timingSafeEqual(q.token || '', expected)) {
    return res.status(401).send('Unauthorized');
  }

  const clickId = String(q.click_id || '');
  const rawPayout = Number.parseFloat(q.payout);
  const payout = Number.isFinite(rawPayout) && rawPayout > 0 ? rawPayout : 24;
  if (!CLICK_ID_RE.test(clickId)) return res.status(400).send('Bad click_id');
  if (!Number.isFinite(payout) || payout < 0 || payout > 100000) return res.status(400).send('Bad payout');

  let meta = { skipped: true };
  try {
    meta = await sendToMeta({ clickId, payout });
  } catch (e) {
    meta = { error: String(e && e.message) };
  }

  let stored = { skipped: true };
  const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_KEY;
  if (sbUrl && sbKey) {
    try {
      const r = await fetch(sbUrl.replace(/\/$/, '') + '/rest/v1/paid_clicks', {
        method: 'POST',
        headers: { apikey: sbKey, Authorization: 'Bearer ' + sbKey, 'content-type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ click_id: clickId, payout }),
      });
      stored = { status: r.status, ok: r.ok };
    } catch (e) { stored = { error: String(e && e.message) }; }
  }

  // Structured log: visible in Vercel -> project -> Logs (filter "postback").
  console.log(JSON.stringify({ evt: 'postback', click_id: clickId, payout, meta, stored, ts: new Date().toISOString() }));

  return res.status(200).send('OK');
};
