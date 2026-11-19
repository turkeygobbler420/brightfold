// TikTok Events API: server-side CompletePayment, shared by postback and whop-webhook.
// Secrets: TIKTOK_ACCESS_TOKEN (required to send), TIKTOK_PIXEL_ID (defaults to the site pixel),
// TIKTOK_TEST_CODE (optional; only while testing in Events Manager > Test events).
const TT_PIXEL = Deno.env.get("TIKTOK_PIXEL_ID") ?? "DBUD593C77U4UD9J425G";

export async function sha256(v: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type Link = { email?: string | null; ttclid?: string | null; ttp?: string | null; ua?: string | null; ip?: string | null; page_url?: string | null };

export async function sendTikTok(clickId: string, value: number, link: Link | null, testCode: string, currency = "USD") {
  const token = Deno.env.get("TIKTOK_ACCESS_TOKEN");
  if (!token) return { skipped: "no token" };
  const user: Record<string, string> = { external_id: await sha256(clickId) };
  if (link?.email) user.email = await sha256(link.email.trim().toLowerCase());
  if (link?.ttclid) user.ttclid = link.ttclid;
  if (link?.ttp) user.ttp = link.ttp;
  if (link?.ua) user.user_agent = link.ua;
  if (link?.ip) user.ip = link.ip;
  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: TT_PIXEL,
    data: [{
      event: "CompletePayment", // same name + event_id as the browser pixel (offers.js), so TikTok dedupes them
      event_time: Math.floor(Date.now() / 1000),
      event_id: "purchase_" + clickId,
      user,
      page: { url: link?.page_url || "https://mindmetric.info/payment" },
      properties: { currency, value, content_type: "product", contents: [{ content_id: "iq-report", content_name: "IQ Report", quantity: 1, price: value }] },
    }],
  };
  if (testCode) body.test_event_code = testCode;
  const r = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST", headers: { "Access-Token": token, "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { http: r.status, code: (j as { code?: number }).code, message: (j as { message?: string }).message };
}

// Sends once per click: atomically claims paid_clicks.tt_sent_at (only one caller can flip it from null),
// sends, and releases the claim if TikTok rejects so a retry can try again. Never throws.
export async function purchaseToTikTok(clickId: string, value: number, testCode = "", currency = "USD") {
  const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/rest/v1/", key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hdr = { apikey: key, Authorization: "Bearer " + key };
  const id = encodeURIComponent(clickId);
  const patch = (filter: string, tt_sent_at: string | null) => fetch(base + "paid_clicks?click_id=eq." + id + filter, {
    method: "PATCH", headers: { ...hdr, "content-type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ tt_sent_at }),
  });
  let claimed = false;
  try {
    testCode = (testCode || Deno.env.get("TIKTOK_TEST_CODE") || "").trim();
    if (!testCode) {
      const c = await patch("&tt_sent_at=is.null", new Date().toISOString());
      const rows = c.ok ? await c.json().catch(() => []) : null;
      if (rows === null) return { error: "claim failed " + c.status };
      if (!Array.isArray(rows) || !rows.length) return { skipped: "already sent" };
      claimed = true;
    }
    const lk = await fetch(base + "click_links?select=email,ttclid,ttp,ua,ip,page_url&click_id=eq." + id, { headers: hdr }).then((x) => x.json()).catch(() => []);
    const tt = await sendTikTok(clickId, value, Array.isArray(lk) ? lk[0] ?? null : null, testCode, currency);
    if (claimed && (tt as { code?: number }).code !== 0) { await patch("", null).catch(() => {}); claimed = false; }
    return tt;
  } catch (e) {
    if (claimed) await patch("", null).catch(() => {});
    return { error: String(e) };
  }
}
