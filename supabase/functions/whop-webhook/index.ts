// Supabase Edge Function: Whop webhook receiver (payment.succeeded / membership.activated).
// Whop dashboard > Developer > Create webhook:
//   https://llyanlleeynuznywttjg.supabase.co/functions/v1/whop-webhook   events: payment.succeeded
// Secrets: WHOP_WEBHOOK_SECRET (the ws_... signing secret), optional WHOP_PLAN_ID, POSTHOG_KEY.
// Deploy with --no-verify-jwt (see config.toml). Finds the buyer's click (checkout metadata.click_id first,
// then the buyer's email via click_links) and marks it paid so the quiz unlocks (`status` reads paid_clicks).
// Only payment.succeeded reports to TikTok (it carries the amount Whop collected); membership.activated just unlocks.
import { purchaseToTikTok } from "../_shared/tiktok.ts";
import { purchaseToMeta } from "../_shared/meta.ts";
const PLAN_ID = Deno.env.get("WHOP_PLAN_ID") ?? "plan_gZemshu7CN47f"; // our checkout plan
const PAYOUT = 0; // $0 today (then recurring billing handled by Whop)
const TT_VALUE = Number(Deno.env.get("TIKTOK_PURCHASE_VALUE") ?? "24"); // fallback only, used when the payment payload has no amount
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const enc = new TextEncoder();

const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function sign(keyBytes: Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)))));
}
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// Standard Webhooks: HMAC-SHA256 over "{id}.{ts}.{body}". Whop's ws_ secret format is not fully
// documented, so accept the key as raw text or as base64 (prefix stripped).
async function verify(req: Request, body: string, secret: string) {
  const id = req.headers.get("webhook-id") ?? "", ts = req.headers.get("webhook-timestamp") ?? "", sig = req.headers.get("webhook-signature") ?? "";
  if (!id || !ts || !sig || !(Math.abs(Date.now() / 1000 - Number(ts)) <= 300)) return false; // also rejects a non-numeric ts
  const keys: Uint8Array[] = [enc.encode(secret)];
  try { keys.push(b64(secret.replace(/^(whsec_|ws_)/, ""))); } catch (_) { /* not base64 */ }
  const given = sig.split(" ").map((s) => s.replace(/^v1,/, ""));
  for (const k of keys) {
    const exp = await sign(k, `${id}.${ts}.${body}`);
    if (given.some((g) => safeEq(g, exp))) return true;
  }
  return false;
}
// Payload paths for the buyer email are not documented, so look for the first plausible email.
function findEmail(o: unknown, depth = 0): string {
  if (!o || typeof o !== "object" || depth > 6) return "";
  const rec = o as Record<string, unknown>;
  for (const [k, v] of Object.entries(rec)) if (/email/i.test(k) && typeof v === "string" && /^[^@\s]+@[^@\s]+$/.test(v)) return v.toLowerCase();
  for (const v of Object.values(rec)) { const e = findEmail(v, depth + 1); if (e) return e; }
  return "";
}
// The checkout passes metadata:{click_id} to the Whop embed (flow.js); it comes back on the payment/membership.
function findClickId(o: unknown, depth = 0): string {
  if (!o || typeof o !== "object" || depth > 6) return "";
  const rec = o as Record<string, unknown>;
  const m = rec.metadata;
  if (m && typeof m === "object") { const c = (m as Record<string, unknown>).click_id; if (typeof c === "string" && CLICK_ID_RE.test(c)) return c; }
  for (const v of Object.values(rec)) { const c = findClickId(v, depth + 1); if (c) return c; }
  return "";
}

// Amount Whop actually collected (dollars), from the payment payload. Field names vary by API version, so try the usual ones.
function findAmount(o: unknown): { amount: number; currency: string } | null {
  const d = o && typeof o === "object" ? o as Record<string, unknown> : {};
  const cur = String(d.currency ?? "usd").toUpperCase();
  for (const k of ["usd_total", "final_amount", "total", "amount_paid", "amount", "subtotal"]) {
    const v = d[k];
    // Whop v1 sends money as {currency, amount:"1.00", ...}; older payloads send a plain number or string.
    const m = v && typeof v === "object" ? v as Record<string, unknown> : null;
    const raw = m ? m.amount : v, n = typeof raw === "number" ? raw : typeof raw === "string" ? parseFloat(raw) : NaN;
    if (Number.isFinite(n) && n >= 0 && n < 100000) return { amount: Math.round(n * 100) / 100, currency: k === "usd_total" ? "USD" : String(m?.currency ?? cur).toUpperCase() };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 500 });
  const body = await req.text();
  if (!(await verify(req, body, secret))) return new Response("Unauthorized", { status: 401 });

  let ev: { type?: string; data?: unknown };
  try { ev = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
  const isPayment = ev.type === "payment.succeeded";
  if (!isPayment && ev.type !== "membership.activated") return new Response("Ignored", { status: 200 });
  if (!body.includes(PLAN_ID)) return new Response("Other plan", { status: 200 });

  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const h = { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json" };

  // Which clicks did this buyer make? The metadata click_id is exact; the email also unlocks their other linked clicks.
  const metaId = findClickId(ev.data), email = findEmail(ev.data);
  const ids: string[] = metaId ? [metaId] : [];
  if (email) {
    const l = await fetch(url + "/rest/v1/click_links?select=click_id&order=created_at.desc&limit=200&email=eq." + encodeURIComponent(email), { headers: h });
    if (!l.ok) { console.log(JSON.stringify({ evt: "whop", err: "lookup failed", status: l.status })); return new Response("Lookup failed", { status: 500 }); } // non-2xx makes Whop retry
    for (const x of await l.json() as { click_id: string }[]) if (!ids.includes(x.click_id)) ids.push(x.click_id);
  }
  if (!ids.length) { console.log(JSON.stringify({ evt: "whop", err: email || metaId ? "no linked click" : "no click_id or email", type: ev.type })); return new Response("No linked click", { status: 200 }); }

  const paidAmt = findAmount(ev.data);
  // First payment creates the row; renewals and the second event for the same click leave it untouched.
  const r = await fetch(url + "/rest/v1/paid_clicks", {
    method: "POST", headers: { ...h, Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(ids.map((click_id) => ({ click_id, payout: PAYOUT, ...(paidAmt ? { amount: paidAmt.amount, currency: paidAmt.currency } : {}) }))),
  });
  if (!r.ok) { console.log(JSON.stringify({ evt: "whop", err: "store failed", status: r.status })); return new Response("Store failed", { status: 500 }); }
  const created = ((await r.json().catch(() => [])) as { click_id: string }[]).map((x) => x.click_id);
  // A row made by membership.activated has no amount; fill it in when the payment arrives.
  if (isPayment && paidAmt) {
    await fetch(url + "/rest/v1/paid_clicks?amount=is.null&click_id=in.(" + ids.map(encodeURIComponent).join(",") + ")", {
      method: "PATCH", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify({ amount: paidAmt.amount, currency: paidAmt.currency }),
    }).catch(() => {});
  }

  // PostHog: once per click, when it is first marked paid.
  const phKey = Deno.env.get("POSTHOG_KEY");
  if (phKey && created.length) {
    await Promise.allSettled(created.map((id) => fetch((Deno.env.get("POSTHOG_HOST") ?? "https://us.i.posthog.com").replace(/\/$/, "") + "/capture/", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: phKey, event: "purchase_completed", distinct_id: id, properties: { source: "whop", $process_person_profile: true } }),
    })));
  }
  // TikTok: one purchase per click, from payment.succeeded only, on the click the buyer paid with (its event_id matches the browser's).
  // A $0 payment (free trial) is not a purchase. tt_sent_at in paid_clicks keeps renewals from re-sending.
  const ttTest = new URL(req.url).searchParams.get("tt_test") ?? "";
  const value = paidAmt?.amount ?? TT_VALUE;
  const tt = isPayment && value > 0 ? await purchaseToTikTok(ids[0], value, ttTest, paidAmt?.currency ?? "USD") : { skipped: isPayment ? "zero amount" : "membership event" };
  // Meta Conversions API: same rules (payment.succeeded only, amount Whop collected, once per click), for every buyer Meta may receive.
  const fbTest = new URL(req.url).searchParams.get("fb_test") ?? "";
  const fb = isPayment && value > 0 && paidAmt ? await purchaseToMeta(ids[0], value, fbTest, paidAmt.currency) : { skipped: isPayment ? "no amount" : "membership event" };
  console.log(JSON.stringify({ evt: "whop", type: ev.type, clicks: ids.length, via: metaId ? "metadata" : "email", amount: paidAmt?.amount ?? null, new: created.length, tiktok: tt, meta: fb }));
  // Signed test calls (?tt_test=CODE) echo the TikTok result so delivery can be checked end to end.
  return new Response(ttTest || fbTest ? "OK " + JSON.stringify({ tt, meta: fb }) : "OK", { status: 200 });
});
