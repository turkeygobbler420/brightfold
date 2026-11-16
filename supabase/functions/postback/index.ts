// Supabase Edge Function: affiliate postback receiver (replaces Vercel /api/postback).
// Network postback URL:
//   https://llyanlleeynuznywttjg.supabase.co/functions/v1/postback?click_id={sub4}&payout=24&token=<POSTBACK_TOKEN>
// Secrets: POSTBACK_TOKEN (supabase secrets set POSTBACK_TOKEN=...). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically. Deploy with --no-verify-jwt (see config.toml).
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const DEFAULT_PAYOUT = 24; // every conversion is worth $24

function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const q = new URL(req.url).searchParams;

  const expected = Deno.env.get("POSTBACK_TOKEN");
  if (expected && !safeEq(q.get("token") ?? "", expected)) return new Response("Unauthorized", { status: 401 });

  const clickId = q.get("click_id") ?? "";
  if (!CLICK_ID_RE.test(clickId)) return new Response("Bad click_id", { status: 400 });

  // Network may send an unexpanded macro or nothing; always fall back to $24.
  const raw = parseFloat(q.get("payout") ?? "");
  const payout = Number.isFinite(raw) && raw > 0 && raw <= 100000 ? raw : DEFAULT_PAYOUT;

  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/paid_clicks", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ click_id: clickId, payout }),
  });
  console.log(JSON.stringify({ evt: "postback", click_id: clickId, payout, stored: r.status }));
  if (!r.ok) return new Response("Store failed", { status: 500 });
  return new Response("OK", { status: 200 });
});
