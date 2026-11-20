// Charges a Whop confirmation token. Needs Vercel env: WHOP_API_KEY (server only), WHOP_ACCOUNT_ID (biz_...), optional WHOP_PLAN_ID.
// Access is NOT granted here: the whop-webhook function unlocks on payment.succeeded.
const PLAN = process.env.WHOP_PLAN_ID || 'plan_gZemshu7CN47f';
export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const key = process.env.WHOP_API_KEY, acct = process.env.WHOP_ACCOUNT_ID;
  if (req.method === 'GET') {
    let price = null;
    if (key && acct) try { // amounts come from the Whop plan, never hardcoded
      const q = await fetch('https://api.whop.com/api/v1/plans/' + PLAN, { headers: { authorization: 'Bearer ' + key } });
      const d = q.ok ? await q.json() : null;
      if (d) price = { currency: d.currency, initial: d.initial_price, renewal: d.renewal_price, days: d.billing_period, type: d.plan_type, trial: d.trial_period_days || 0, taxIncluded: d.tax_type || null, product: (d.product && d.product.title) || null };
    } catch (e) {}
    return res.status(200).json({ ready: !!(key && acct), account: acct || null, plan: PLAN, price });
  }
  if (req.method === 'OPTIONS') return res.status(204).end(); // CORS preflight from mindmetric.info (GitHub Pages)
  if (req.method !== 'POST') return res.status(405).end();
  if (!key || !acct) return res.status(503).json({ error: 'not_configured' });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const tok = String(b.confirmationToken || ''), click = String(b.clickId || '');
  if (!/^ctok_\w+$/.test(tok)) return res.status(400).json({ error: 'bad_token' });
  try {
    const r = await fetch('https://api.whop.com/api/v1/payments', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', 'idempotency-key': 'ctok-' + tok }, // same token can never charge twice
      body: JSON.stringify({
        account_id: acct, variant_id: PLAN, confirmation_token: tok,
        return_url: (req.headers.origin === 'https://mindmetric.info' ? req.headers.origin : 'https://' + (req.headers.host || 'mindmetric.info')) + '/payment', // 3DS returns to the site the buyer is on
        metadata: /^[\w-]{1,64}$/.test(click) ? { click_id: click } : {},
      }),
    });
    const p = await r.json().catch(() => ({}));
    if (!r.ok) console.error('whop payment', r.status, (p.error && p.error.message) || p.message);
    if (!r.ok) return res.status(r.status === 401 ? 502 : 400).json({ error: (p.error && p.error.message) || p.message || 'payment_failed' });
    res.status(200).json({ id: p.id, status: p.status, client_secret: p.client_secret });
  } catch (e) { res.status(502).json({ error: 'upstream' }); }
}
