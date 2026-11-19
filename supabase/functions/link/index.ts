// Supabase Edge Function: POST /functions/v1/link  {click_id, email?, ttclid?, ttp?, url?}  ->  {ok:true}
// Also stores TikTok match data (ttclid, _ttp cookie, user agent, IP) so the postback can send a server-side purchase.
// Called by the checkout page before the payment window opens, so the network's postback (click_id only)
// can be matched to an email / account. Table: click_links (see supabase/paid_clicks.sql).
// An existing click's email is never replaced: otherwise anyone who knows a click_id could re-point it at another address.
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED = (Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io,https://mindmetric.info,https://www.mindmetric.info").split(",").map((s) => s.trim());

Deno.serve(async (req) => {
  const o = req.headers.get("origin") ?? "";
  const H = { "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0], "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: H });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b: { click_id?: string; email?: string; ttclid?: string; ttp?: string; fbclid?: string; fbp?: string; fbc?: string; url?: string };
  try { b = (await req.json()) ?? {}; } catch { return json({ error: "bad json" }, 400); }
  if (typeof b !== "object") return json({ error: "bad json" }, 400);
  const id = String(b.click_id ?? ""), email = String(b.email ?? "").trim().toLowerCase();
  if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) return json({ error: "bad email" }, 400);
  const cut = (v: unknown, n: number) => { const x = String(v ?? "").trim(); return x ? x.slice(0, n) : ""; };
  const row: Record<string, string> = { click_id: id };
  const ttclid = cut(b.ttclid, 512), ttp = cut(b.ttp, 256), page = cut(b.url, 1000);
  if (ttclid) row.ttclid = ttclid;
  if (ttp) row.ttp = ttp;
  for (const [k, n] of [["fbclid", 512], ["fbp", 128], ["fbc", 600]] as const) { const v = cut((b as Record<string, unknown>)[k], n); if (v) row[k] = v; }
  if (page) row.page_url = page;
  const ua = cut(req.headers.get("user-agent"), 512);
  const fwd = (req.headers.get("x-client-ip") ?? "").trim(); // set by the mmedge proxy (the visitor's real IP)
  const ip = cut(/^[0-9a-fA-F:.]{3,45}$/.test(fwd) ? fwd : (req.headers.get("x-forwarded-for") ?? "").split(",")[0] || req.headers.get("cf-connecting-ip"), 64);
  if (ua) row.ua = ua;
  if (ip) row.ip = ip;
  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/rest/v1/click_links", key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hdr = { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json" };
  try {
    // 1) create the row if new (email included), never touching an existing one
    const ins = await fetch(url, { method: "POST", headers: { ...hdr, Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(row) });
    if (!ins.ok) { console.log(JSON.stringify({ evt: "link_fail", status: ins.status })); return json({ error: "store" }, 500); }
    const created = ((await ins.json().catch(() => [])) as unknown[]).length > 0;
    if (!created) {
      // 2) existing click: refresh match data, and set the email only if it is still empty
      const { click_id: _c, email: _e, ...rest } = row;
      const base = url + "?click_id=eq." + encodeURIComponent(id);
      if (Object.keys(rest).length) await fetch(base, { method: "PATCH", headers: { ...hdr, Prefer: "return=minimal" }, body: JSON.stringify(rest) });
      if (email) await fetch(base + "&email=is.null", { method: "PATCH", headers: { ...hdr, Prefer: "return=minimal" }, body: JSON.stringify({ email }) });
    }
    return json({ ok: true });
  } catch { return json({ error: "store" }, 500); }
});
