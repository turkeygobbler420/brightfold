// Supabase Edge Function: first-party event collector for the analytics dashboard.
// Browser POSTs {vid, sid, name, path, props, source, country, device} (or an array of them).
const ORIGINS = /^https:\/\/(www\.)?mindmetric\.info$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const cors = (o: string) => ({
  "Access-Control-Allow-Origin": ORIGINS.test(o) ? o : "https://mindmetric.info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
});
const str = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : null);

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin") ?? "");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: h });
  let body: unknown;
  try { body = JSON.parse(await req.text()); } catch { return new Response("Bad JSON", { status: 400, headers: h }); }
  const list = (Array.isArray(body) ? body : [body]).slice(0, 50);
  const rows = list.map((e) => {
    const o = (e ?? {}) as Record<string, unknown>;
    const c = str(o.country, 2)?.toUpperCase();
    return {
      vid: str(o.vid, 64), sid: str(o.sid, 64), name: str(o.name, 64), path: str(o.path, 200),
      props: o.props && typeof o.props === "object" ? o.props : null,
      source: str(o.source, 100), country: c && /^[A-Z]{2}$/.test(c) ? c : null, device: str(o.device, 20),
    };
  }).filter((r) => r.vid && r.name);
  if (!rows.length) return new Response("Nothing", { status: 400, headers: h });
  const url = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, ""), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const r = await fetch(url + "/rest/v1/events", {
    method: "POST",
    headers: { apikey: key, Authorization: "Bearer " + key, "content-type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  return new Response(r.ok ? "OK" : "Store failed", { status: r.ok ? 200 : 500, headers: h });
});
