// POST /functions/v1/cancel {click_id, email} -> {ok:true}. Records a membership cancellation request (table cancel_requests).
// The recurring charge itself is stopped with the billing provider; this gives you a queue to action.
const CLICK_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORIGIN = Deno.env.get("STATUS_ORIGIN") ?? "https://turkeygobbler420.github.io";
const H = { "Access-Control-Allow-Origin": ORIGIN, "Vary": "Origin", "Cache-Control": "no-store", "content-type": "application/json" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);
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
