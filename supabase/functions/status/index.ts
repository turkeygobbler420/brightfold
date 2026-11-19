// Supabase Edge Function: payment status.
//   GET ?click_id=...                       -> {paid}           (checkout page polling after the pop-out)
//   GET with Authorization: Bearer <user>   -> {paid, cancelled, email} (signed-in account: any click linked to that email that was paid)
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const ALLOWED = (Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io,https://mindmetric.info,https://www.mindmetric.info").split(",").map((s) => s.trim());
const ORIGIN = ALLOWED[0];
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = (path: string) => fetch(url + "/rest/v1/" + path, { headers: { apikey: key, Authorization: "Bearer " + key } });

async function anyPaid(ids: string[]) {
  const ok = ids.filter((i) => CLICK_ID_RE.test(i));
  if (!ok.length) return false;
  const r = await sb("paid_clicks?select=click_id&limit=1&click_id=in.(" + ok.join(",") + ")");
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}

Deno.serve(async (req) => {
  { const o = req.headers.get("origin") ?? ""; H["Access-Control-Allow-Origin"] = ALLOWED.includes(o) ? o : ORIGIN; }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "content-type, authorization" } });
  if (req.method !== "GET") return json({ error: "method" }, 405);
  const q = new URL(req.url).searchParams, id = q.get("click_id") ?? "";
  try {
    const auth = req.headers.get("authorization") ?? "";
    if (!id && /^Bearer\s+\S+/i.test(auth)) {
      const u = await fetch(url + "/auth/v1/user", { headers: { apikey: key, Authorization: auth } });
      if (!u.ok) return json({ paid: false, error: "auth" }, 401);
      const email = String((await u.json()).email ?? "").toLowerCase();
      if (!email) return json({ paid: false });
      const l = await sb("click_links?select=click_id&limit=200&email=eq." + encodeURIComponent(email));
      const rows = l.ok ? await l.json() : [];
      const c = await sb("cancel_requests?select=click_id&limit=1&email=eq." + encodeURIComponent(email));
      const cancelled = c.ok && ((await c.json()) as unknown[]).length > 0;
      return json({ paid: await anyPaid(rows.map((x: { click_id: string }) => x.click_id)), cancelled, email });
    }
    if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
    const pr = await sb("paid_clicks?select=amount,currency&limit=1&click_id=eq." + id);
    const row = pr.ok ? (await pr.json())[0] : null;
    return json(row ? { paid: true, amount: row.amount ?? null, currency: row.currency ?? null } : { paid: false });
  } catch { return json({ paid: false }); }
});
