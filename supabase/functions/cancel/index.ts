// POST /functions/v1/cancel -> {ok:true}. Signed-in: send "Authorization: Bearer <user JWT>" (email and click ids resolved server-side from click_links).
// Guest: body {click_id, email}. Records a membership cancellation request (table cancel_requests).
// The recurring charge itself is stopped with the billing provider; this gives you a queue to action.
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED = (Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io,https://mindmetric.info,https://www.mindmetric.info").split(",").map((s) => s.trim());
const ORIGIN = ALLOWED[0];
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
Deno.serve(async (req) => {
  { const o = req.headers.get("origin") ?? ""; H["Access-Control-Allow-Origin"] = ALLOWED.includes(o) ? o : ORIGIN; }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type, authorization" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sr = { apikey: key, Authorization: "Bearer " + key };
  const auth = req.headers.get("authorization") ?? "";
  if (/^Bearer\s+\S+/i.test(auth)) {
    try {
      const u = await fetch(url + "/auth/v1/user", { headers: { apikey: key, Authorization: auth } });
      if (!u.ok) return json({ error: "auth" }, 401);
      const em = String((await u.json()).email ?? "").toLowerCase();
      if (!em) return json({ error: "no email" }, 400);
      const l = await fetch(url + "/rest/v1/click_links?select=click_id&limit=200&email=eq." + encodeURIComponent(em), { headers: sr });
      const ids: string[] = (l.ok ? await l.json() : []).map((x: { click_id: string }) => x.click_id).filter((i: string) => CLICK_ID_RE.test(i));
      if (!ids.length) return json({ error: "no membership" }, 404);
      const r = await fetch(url + "/rest/v1/cancel_requests", { method: "POST", headers: { ...sr, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(ids.map((click_id) => ({ click_id, email: em }))) });
      return r.ok ? json({ ok: true, count: ids.length }) : json({ error: "store" }, 500);
    } catch { return json({ error: "store" }, 500); }
  }
  const b = await req.json().catch(() => ({}));
  const id = String(b.click_id ?? ""), email = String(b.email ?? "").trim().toLowerCase();
  if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "bad email" }, 400);
  try {
    const r = await fetch(Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/rest/v1/cancel_requests", {
      method: "POST",
      headers: { apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, Authorization: "Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ click_id: id, email }),
    });
    return r.ok ? json({ ok: true }) : json({ error: "store" }, 500);
  } catch { return json({ error: "store" }, 500); }
});
