// Supabase Edge Function: POST /functions/v1/link  {click_id, email?, ttclid?, ttp?, url?}  ->  {ok:true}
// Also stores TikTok match data (ttclid, _ttp cookie, user agent, IP) so the postback can send a server-side purchase.
// Called by the checkout page before the payment window opens, so the network's postback (click_id only)
// can be matched to an email / account. Table: click_links (see supabase/paid_clicks.sql).
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED = (Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io,https://mindmetric.info,https://www.mindmetric.info").split(",").map((s) => s.trim());
const ORIGIN = ALLOWED[0];
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });

Deno.serve(async (req) => {
  { const o = req.headers.get("origin") ?? ""; H["Access-Control-Allow-Origin"] = ALLOWED.includes(o) ? o : ORIGIN; }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b: { click_id?: string; email?: string; ttclid?: string; ttp?: string; url?: string };
  try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const id = String(b.click_id ?? ""), email = String(b.email ?? "").trim().toLowerCase();
  if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) return json({ error: "bad email" }, 400);
  const cut = (v: unknown, n: number) => { const x = String(v ?? "").trim(); return x ? x.slice(0, n) : ""; };
  // Only send the fields we have, so a later call never blanks an earlier value (upsert merges per column).
  const row: Record<string, string> = { click_id: id };
  if (email) row.email = email;
  const ttclid = cut(b.ttclid, 512), ttp = cut(b.ttp, 256), page = cut(b.url, 1000);
  if (ttclid) row.ttclid = ttclid;
  if (ttp) row.ttp = ttp;
  if (page) row.page_url = page;
  const ua = cut(req.headers.get("user-agent"), 512);
  const ip = cut((req.headers.get("x-forwarded-for") ?? "").split(",")[0] || req.headers.get("cf-connecting-ip"), 64);
  if (ua) row.ua = ua;
  if (ip) row.ip = ip;
  if (Object.keys(row).length < 2) return json({ ok: true });
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/click_links", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) { console.log(JSON.stringify({ evt: "link_fail", status: r.status })); return json({ error: "store" }, 500); }
    return json({ ok: true });
  } catch { return json({ error: "store" }, 500); }
});
