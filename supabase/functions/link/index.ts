// Supabase Edge Function: POST /functions/v1/link  {click_id, email}  ->  {ok:true}
// Called by the checkout page before the payment window opens, so the network's postback (click_id only)
// can be matched to an email / account. Table: click_links (see supabase/paid_clicks.sql).
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORIGIN = Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io";
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  let b: { click_id?: string; email?: string };
  try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const id = String(b.click_id ?? ""), email = String(b.email ?? "").trim().toLowerCase();
  if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
  if (email.length > 254 || !EMAIL_RE.test(email)) return json({ error: "bad email" }, 400);
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/click_links", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ click_id: id, email }),
    });
    if (!r.ok) { console.log(JSON.stringify({ evt: "link_fail", status: r.status })); return json({ error: "store" }, 500); }
    return json({ ok: true });
  } catch { return json({ error: "store" }, 500); }
});
