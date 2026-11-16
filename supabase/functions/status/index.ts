// Supabase Edge Function: GET /functions/v1/status?click_id=...  ->  {paid:boolean}
// Polled by the checkout page (flow.js) while the buyer pays in the pop-out.
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const ORIGIN = Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io";
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "content-type" } });
  if (req.method !== "GET") return json({ error: "method" }, 405);
  const id = new URL(req.url).searchParams.get("click_id") ?? "";
  if (!CLICK_ID_RE.test(id)) return json({ error: "bad click_id" }, 400);
  const url = Deno.env.get("SUPABASE_URL")!, key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const r = await fetch(url.replace(/\/$/, "") + "/rest/v1/paid_clicks?select=click_id&limit=1&click_id=eq." + encodeURIComponent(id),
      { headers: { apikey: key, Authorization: "Bearer " + key } });
    if (!r.ok) return json({ paid: false });
    const rows = await r.json();
    return json({ paid: Array.isArray(rows) && rows.length > 0 });
  } catch { return json({ paid: false }); }
});
