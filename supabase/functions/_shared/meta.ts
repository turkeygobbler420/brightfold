// Meta Conversions API. The only event the site sends to Meta with an event_id is Purchase, on confirmed payment:
//   Purchase  event_id "<click_id>"  (whop-webhook, payment.succeeded, amount Whop collected)
// The browser pixel (offers.js) sends the same Purchase with eventID = click_id, so Meta counts it once.
// Secrets: META_CAPI_TOKEN (required to send), META_PIXEL_ID (defaults to the site pixel),
// META_TEST_CODE (optional; only while testing in Events Manager > Test events).
import { sha256 } from "./tiktok.ts";
const PIXEL = Deno.env.get("META_PIXEL_ID") ?? "1164876852547471";

export type Link = { email?: string | null; fbclid?: string | null; fbp?: string | null; fbc?: string | null; ua?: string | null; ip?: string | null; page_url?: string | null };

// Visitors Meta may receive: arrived from a Meta ad (fbclid/_fbc), or the pixel ran for them (_fbp exists only after consent).
export const metaAllowed = (l: Link | null) => !!(l?.fbclid || l?.fbc || l?.fbp);

export async function sendMetaEvent(eventName: string, eventId: string, clickId: string, link: Link | null, customData: Record<string, unknown>, testCode = "") {
  const token = Deno.env.get("META_CAPI_TOKEN");
  if (!token) return { skipped: "no token" };
  testCode = (testCode || Deno.env.get("META_TEST_CODE") || "").trim();
  const user: Record<string, unknown> = { external_id: [await sha256(clickId)] }; // same external_id the pixel sends (offers.js)
  if (link?.email) user.em = [await sha256(link.email.trim().toLowerCase())];
  const fbc = link?.fbc || (link?.fbclid ? "fb.1." + Date.now() + "." + link.fbclid : "");
  if (fbc) user.fbc = fbc;
  if (link?.fbp) user.fbp = link.fbp;
  if (link?.ua) user.client_user_agent = link.ua;
  if (link?.ip) user.client_ip_address = link.ip;
  const body: Record<string, unknown> = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: link?.page_url || "https://mindmetric.info/",
      user_data: user,
      custom_data: customData,
    }],
  };
  if (testCode) body.test_event_code = testCode;
  const r = await fetch("https://graph.facebook.com/v21.0/" + PIXEL + "/events?access_token=" + encodeURIComponent(token), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({})) as { events_received?: number; error?: { message?: string } };
  return { event: eventName, event_id: eventId, http: r.status, received: j.events_received, error: j.error?.message };
}

// Purchase, once per click. Claims paid_clicks.fb_sent_at atomically, releases it if Meta rejects. Never throws.
export async function purchaseToMeta(clickId: string, value: number, testCode = "", currency = "USD") {
  const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/rest/v1/", key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hdr = { apikey: key, Authorization: "Bearer " + key };
  const id = encodeURIComponent(clickId);
  const patch = (filter: string, fb_sent_at: string | null) => fetch(base + "paid_clicks?click_id=eq." + id + filter, {
    method: "PATCH", headers: { ...hdr, "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ fb_sent_at }),
  });
  let claimed = false;
  try {
    if (!Deno.env.get("META_CAPI_TOKEN")) return { skipped: "no token" };
    const lk = await fetch(base + "click_links?select=email,fbclid,fbp,fbc,ua,ip,page_url&click_id=eq." + id, { headers: hdr }).then((x) => x.json()).catch(() => []);
    const link: Link | null = Array.isArray(lk) ? lk[0] ?? null : null;
    if (!metaAllowed(link)) return { skipped: "no meta consent" };
    if (!(testCode || Deno.env.get("META_TEST_CODE"))) {
      const c = await patch("&fb_sent_at=is.null", new Date().toISOString());
      const rows = c.ok ? await c.json().catch(() => []) : null;
      if (rows === null) return { error: "claim failed " + c.status };
      if (!Array.isArray(rows) || !rows.length) return { skipped: "already sent" };
      claimed = true;
    }
    const custom = { currency, value, content_type: "product", content_ids: ["iq-report"], content_name: "IQ Report", num_items: 1 };
    const m = await sendMetaEvent("Purchase", clickId, clickId, link, custom, testCode);
    if (claimed && !(m as { received?: number }).received) { await patch("", null).catch(() => {}); claimed = false; }
    return m;
  } catch (e) {
    if (claimed) await patch("", null).catch(() => {});
    return { error: String(e) };
  }
}
