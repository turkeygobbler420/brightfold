// Email unsubscribe.
//   POST {email, subscribe?:boolean}   from the site's Settings (subscribe:true removes the opt-out)
//   GET  ?email=...&t=<hmac>           one-click link for emails: t = hex HMAC-SHA256(lowercase email, UNSUB_SECRET)
// Table: unsubscribes (see supabase/paid_clicks.sql). Secrets: UNSUB_SECRET (needed for GET links), optional STATUS_ORIGIN.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED = (Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io,https://mindmetric.info,https://www.mindmetric.info").split(",").map((s) => s.trim());
const ORIGIN = ALLOWED[0];
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const rest = (path: string, init: RequestInit) => fetch(url + "/rest/v1/" + path, { ...init, headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", ...(init.headers ?? {}) } });

async function sign(email: string) {
  const secret = Deno.env.get("UNSUB_SECRET");
  if (!secret) return null;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(email)));
  return [...s].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function set(email: string, subscribe: boolean) {
  const r = subscribe
    ? await rest("unsubscribes?email=eq." + encodeURIComponent(email), { method: "DELETE" })
    : await rest("unsubscribes", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ email }) });
  return r.ok;
}

Deno.serve(async (req) => {
  { const o = req.headers.get("origin") ?? ""; H["Access-Control-Allow-Origin"] = ALLOWED.includes(o) ? o : ORIGIN; }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type" } });
  try {
    if (req.method === "GET") {
      const q = new URL(req.url).searchParams, email = (q.get("email") ?? "").trim().toLowerCase(), t = q.get("t") ?? "";
      const good = EMAIL_RE.test(email) && (await sign(email)) === t && t !== "";
      const page = (m: string, s: number) => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>Unsubscribe</title><body style="font:16px system-ui;max-width:420px;margin:15vh auto;padding:0 16px"><p>${m}</p>`, { status: s, headers: { "content-type": "text/html; charset=utf-8" } });
      if (!good) return page("This unsubscribe link is not valid.", 400);
      return (await set(email, false)) ? page("You have been unsubscribed. We will not email you again.", 200) : page("Something went wrong. Please try again.", 500);
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => ({}));
    const email = String(b.email ?? "").trim().toLowerCase();
    if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "bad email" }, 400);
    return (await set(email, b.subscribe === true)) ? json({ ok: true, subscribed: b.subscribe === true }) : json({ error: "store" }, 500);
  } catch { return json({ error: "store" }, 500); }
});
