// Supabase Edge Function: affiliate postback receiver (replaces Vercel /api/postback).
// Network postback URL:
//   https://llyanlleeynuznywttjg.supabase.co/functions/v1/postback?click_id={sub8}&payout=24&token=<POSTBACK_TOKEN>
// Secrets: POSTBACK_TOKEN (supabase secrets set POSTBACK_TOKEN=...). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically. Deploy with --no-verify-jwt (see config.toml).
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const DEFAULT_PAYOUT = 24; // every conversion is worth $24
import { purchaseToTikTok } from "../_shared/tiktok.ts";
// TikTok: server-side CompletePayment (see _shared/tiktok.ts). Tag one postback for testing with &tt_test=TEST12345.

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
  if (!expected) return new Response("Not configured", { status: 500 }); // fail closed: never accept postbacks without a secret
  if (!safeEq(q.get("token") ?? "", expected)) return new Response("Unauthorized", { status: 401 });

  const clickId = q.get("click_id") ?? "";
  if (!CLICK_ID_RE.test(clickId)) return new Response("Bad click_id", { status: 400 });

  // Network may send an unexpanded macro or nothing; always fall back to $24.
  const raw = parseFloat(q.get("payout") ?? "");
  const payout = Number.isFinite(raw) && raw > 0 && raw <= 100000 ? raw : DEFAULT_PAYOUT;

  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/paid_clicks", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ click_id: clickId, payout }), // payout column only: never touches the amount/currency Whop's webhook stored
  });
  // Optional: send the purchase to PostHog (distinct_id = click id, same person the browser identified).
  const phKey = Deno.env.get("POSTHOG_KEY");
  if (phKey) {
    try {
      await fetch((Deno.env.get("POSTHOG_HOST") ?? "https://us.i.posthog.com").replace(/\/$/, "") + "/capture/", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ api_key: phKey, event: "purchase_completed", distinct_id: clickId, properties: { payout, $process_person_profile: true } }),
      });
    } catch (_) { /* analytics must never fail the postback */ }
  }
  // TikTok purchase value is what the customer paid (from Whop's webhook), not the affiliate payout. Use the stored
  // amount when the webhook already recorded one; the $-payout is only a fallback. Sent once per click (tt_sent_at).
  let ttValue = payout, ttCur = "USD";
  try {
    const a = await fetch(url.replace(/\/$/, "") + "/rest/v1/paid_clicks?select=amount,currency&click_id=eq." + encodeURIComponent(clickId), { headers: { apikey: key, Authorization: "Bearer " + key } }).then((x) => x.json());
    if (a?.[0]?.amount > 0) { ttValue = Number(a[0].amount); ttCur = a[0].currency || "USD"; }
  } catch (_) { /* keep the payout fallback */ }
  const tt = r.ok ? await purchaseToTikTok(clickId, ttValue, q.get("tt_test") ?? "", ttCur) : null;
  console.log(JSON.stringify({ evt: "postback", click_id: clickId, payout, stored: r.status, tiktok: tt }));
  if (!r.ok) return new Response("Store failed", { status: 500 });
  return new Response("OK", { status: 200 });
});
