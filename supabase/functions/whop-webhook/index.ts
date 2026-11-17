// Supabase Edge Function: Whop webhook receiver (payment.succeeded / membership.activated).
// Whop dashboard > Developer > Create webhook:
//   https://llyanlleeynuznywttjg.supabase.co/functions/v1/whop-webhook   events: payment.succeeded
// Secrets: WHOP_WEBHOOK_SECRET (the ws_... signing secret), optional WHOP_PLAN_ID, POSTHOG_KEY.
// Deploy with --no-verify-jwt (see config.toml). Matches the buyer's email to click_links, then marks
// every linked click as paid so the quiz unlocks (the `status` function reads paid_clicks).
const PLAN_ID = Deno.env.get("WHOP_PLAN_ID") ?? "plan_gZemshu7CN47f"; // our checkout plan
const PAYOUT = 0; // $0 today (then recurring billing handled by Whop)
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
  if (!id || !ts || !sig || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const secret = Deno.env.get("WHOP_WEBHOOK_SECRET");
  if (!secret) return new Response("Not configured", { status: 500 });
  const body = await req.text();
  if (!(await verify(req, body, secret))) return new Response("Unauthorized", { status: 401 });

  let ev: { type?: string; data?: unknown };
  try { ev = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (ev.type !== "payment.succeeded" && ev.type !== "membership.activated") return new Response("Ignored", { status: 200 });
  if (!body.includes(PLAN_ID)) return new Response("Other plan", { status: 200 });

  const email = findEmail(ev.data);
  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const h = { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json" };
  if (!email) { console.log(JSON.stringify({ evt: "whop", err: "no email", type: ev.type })); return new Response("No email", { status: 200 }); }

  const l = await fetch(url + "/rest/v1/click_links?select=click_id&limit=200&email=eq." + encodeURIComponent(email), { headers: h });
  const ids: string[] = l.ok ? (await l.json()).map((x: { click_id: string }) => x.click_id) : [];
  if (!ids.length) { console.log(JSON.stringify({ evt: "whop", err: "no linked click", type: ev.type })); return new Response("No linked click", { status: 200 }); }

  const r = await fetch(url + "/rest/v1/paid_clicks", {
    method: "POST", headers: { ...h, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(ids.map((click_id) => ({ click_id, payout: PAYOUT }))),
  });
  const phKey = Deno.env.get("POSTHOG_KEY");
  if (phKey) {
    for (const id of ids) {
      try {
        await fetch((Deno.env.get("POSTHOG_HOST") ?? "https://us.i.posthog.com").replace(/\/$/, "") + "/capture/", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ api_key: phKey, event: "purchase_completed", distinct_id: id, properties: { source: "whop", $process_person_profile: true } }),
        });
      } catch (_) { /* analytics must never fail the webhook */ }
    }
  }
  console.log(JSON.stringify({ evt: "whop", type: ev.type, clicks: ids.length, stored: r.status }));
  return r.ok ? new Response("OK", { status: 200 }) : new Response("Store failed", { status: 500 });
});
