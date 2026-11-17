// Supabase Edge Function: public, read-only checkout price for the Whop plan.
// Secret: WHOP_API_KEY (read-only key). Deploy with --no-verify-jwt (see config.toml).
// Returns { today, then, period, trial, currency } in the plan's base currency; Whop localizes it inside checkout.
const PLAN_ID = Deno.env.get("WHOP_PLAN_ID") ?? "plan_gZemshu7CN47f";
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "content-type": "application/json", "cache-control": "public, max-age=300" };
let cache: { at: number; body: string } | null = null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (cache && Date.now() - cache.at < 300_000) return new Response(cache.body, { headers: CORS });
  const key = Deno.env.get("WHOP_API_KEY");
  if (!key) return new Response('{"error":"not configured"}', { status: 500, headers: CORS });
  try {
    const r = await fetch("https://api.whop.com/api/v1/plans/" + PLAN_ID, { headers: { Authorization: "Bearer " + key } });
    if (!r.ok) return new Response('{"error":"upstream"}', { status: 502, headers: CORS });
    const p = await r.json();
    const body = JSON.stringify({
      today: Number(p.initial_price ?? 0),
      then: Number(p.renewal_price ?? 0),
      period: p.billing_period ?? null,
      trial: p.trial_period_days ?? 0,
      currency: String(p.currency ?? "usd").toUpperCase(),
    });
    cache = { at: Date.now(), body };
    return new Response(body, { headers: CORS });
  } catch (_) {
    return new Response('{"error":"fetch"}', { status: 502, headers: CORS });
  }
});
