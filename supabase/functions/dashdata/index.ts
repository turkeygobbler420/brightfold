// Supabase Edge Function: live MindMetric data for the analytics dashboard (Vercel, SSO-protected).
// Called server-to-server by the dashboard's /api/data with header x-dash-token = DASH_TOKEN secret.
// Returns the dashboard's datasets: leads, days, funnel, questions, exits, dwell, pages, sources, countries.
const DAYS = 30, SESSION_GAP = 1800; // seconds; a step's time is capped at this
const STAGES = ["quiz_started", "intro_viewed", "question_viewed", "quiz_finished", "analyzing_viewed", "email_screen_viewed",
  "email_submitted", "checkout_viewed", "checkout_clicked", "purchase_completed", "results_viewed"];
const TEST = /(@example\.com|@mindgauge\.app|@brightfold\.app|@mindmetric\.info|^(tester|test|demo|kk|ee|d|d2|hhhhbb)@|niggerdemo|lukeadams484|duck\.com)/i;
const regionName = new Intl.DisplayNames(["en"], { type: "region" });

type Ev = { ts: string; vid: string; sid: string | null; name: string; path: string | null; props: Record<string, unknown> | null; source: string | null; country: string | null; device: string | null };
type Row = Record<string, unknown>;

function safeEq(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function all(base: string, hdr: HeadersInit, q: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(base + q, { headers: { ...hdr, Range: `${from}-${from + 999}` } });
    if (!r.ok) throw new Error(q.split("?")[0] + " " + r.status);
    const page = await r.json() as Row[];
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

Deno.serve(async (req) => {
  const token = Deno.env.get("DASH_TOKEN") ?? "";
  if (!token || !safeEq(req.headers.get("x-dash-token") ?? "", token)) return new Response("Unauthorized", { status: 401 });

  const base = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "") + "/rest/v1/", key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hdr = { apikey: key, Authorization: "Bearer " + key };
  const since = new Date(Date.now() - DAYS * 864e5).toISOString();
  const [evs, leads, paid, links, cancels, unsubs] = await Promise.all([
    all(base, hdr, `events?select=ts,vid,sid,name,path,props,source,country,device&ts=gte.${since}&order=ts.asc`) as Promise<Ev[]>,
    all(base, hdr, "leads?select=email,click_id,created_at,last_seen,utm_source,utm_medium,utm_campaign,referrer,device,lang,score,submits&order=created_at.desc"),
    all(base, hdr, "paid_clicks?select=click_id,payout,paid_at"),
    all(base, hdr, "click_links?select=click_id,email"),
    all(base, hdr, "cancel_requests?select=email"),
    all(base, hdr, "unsubscribes?select=email"),
  ]);
  const site = "mm";

  // ---- visitors per day, pages, sources, countries
  const dayV = new Map<string, Set<string>>(), dayE = new Map<string, number>(), pages = new Map<string, number>();
  const vSource = new Map<string, string>(), vCountry = new Map<string, string>();
  for (const e of evs) {
    const d = e.ts.slice(0, 10);
    if (!dayV.has(d)) dayV.set(d, new Set());
    dayV.get(d)!.add(e.vid);
    dayE.set(d, (dayE.get(d) ?? 0) + 1);
    if (e.name === "pageview") pages.set(e.path || "/", (pages.get(e.path || "/") ?? 0) + 1);
    if (!vSource.has(e.vid) && e.source) vSource.set(e.vid, e.source);
    if (!vCountry.has(e.vid) && e.country) vCountry.set(e.vid, e.country);
  }
  const visitors = new Set(evs.map((e) => e.vid));
  const days = [...dayV].map(([date, s]) => ({ site, date, visitors: s.size, events: dayE.get(date) ?? 0 }));
  const srcCount = new Map<string, number>();
  for (const v of visitors) { const s = vSource.get(v) ?? "direct"; srcCount.set(s, (srcCount.get(s) ?? 0) + 1); }
  const cCount = new Map<string, number>();
  for (const v of visitors) { const c = vCountry.get(v); if (c) cCount.set(c, (cCount.get(c) ?? 0) + 1); }

  // ---- funnel (distinct visitors per stage; purchases from the payment records)
  const byName = new Map<string, Set<string>>();
  for (const e of evs) { if (!byName.has(e.name)) byName.set(e.name, new Set()); byName.get(e.name)!.add(e.vid); }
  const bought = new Set(byName.get("purchase_confirmed") ?? []);
  for (const p of paid) if (p.paid_at && String(p.paid_at) >= since) bought.add(String(p.click_id));
  const funnel = STAGES.map((stage) => ({ site, stage, count: stage === "purchase_completed" ? bought.size : (byName.get(stage)?.size ?? 0) }));

  // ---- questions
  const qv = new Map<number, Set<string>>(), qa = new Map<number, Set<string>>(), qd = new Map<number, string>();
  for (const e of evs) {
    const n = Number(e.props?.question);
    if (!n || (e.name !== "question_viewed" && e.name !== "question_answered")) continue;
    const m = e.name === "question_viewed" ? qv : qa;
    if (!m.has(n)) m.set(n, new Set());
    m.get(n)!.add(e.vid);
    if (e.props?.domain && !qd.has(n)) qd.set(n, String(e.props.domain));
  }
  const questions = [...qv.keys()].sort((a, b) => a - b).map((n) => ({
    site, question: "Question " + n + (qd.get(n) ? " · " + qd.get(n) : ""), viewers: qv.get(n)!.size, answers: qa.get(n)?.size ?? 0,
  }));

  // ---- where people leave + time spent, per session
  const sess = new Map<string, Ev[]>();
  for (const e of evs) { const k = e.sid || e.vid; if (!sess.has(k)) sess.set(k, []); sess.get(k)!.push(e); }
  const now = Date.now();
  const ex = new Map<string, { kind: string; step: string; exits: number; reached: Set<string> }>();
  const dw = new Map<string, { kind: string; step: string; total: number; n: number; views: number }>();
  const stepOf = (e: Ev) => e.name === "pageview" ? { kind: "page", step: e.path || "/" }
    : e.name === "question_viewed" && e.props?.question ? { kind: "question", step: "Q" + e.props.question } : null;
  for (const [sk, list] of sess) {
    const live = now - Date.parse(list[list.length - 1].ts) < SESSION_GAP * 1000;
    const last: Record<string, string> = {};
    list.forEach((e, i) => {
      const s = stepOf(e);
      if (!s) return;
      const k = s.kind + "|" + s.step;
      if (!ex.has(k)) ex.set(k, { ...s, exits: 0, reached: new Set() });
      ex.get(k)!.reached.add(sk);
      if (!dw.has(k)) dw.set(k, { ...s, total: 0, n: 0, views: 0 });
      const d = dw.get(k)!;
      d.views++;
      // time on the step = until the next event that ends it (next page / next question / answer / leave)
      const ends = s.kind === "page" ? ["pageview", "leave"] : ["question_viewed", "question_answered", "leave", "pageview"];
      const nx = list.slice(i + 1).find((x) => ends.includes(x.name) && !(s.kind === "page" && x.name === "pageview" && x.path === e.path));
      if (nx) { const t = (Date.parse(nx.ts) - Date.parse(e.ts)) / 1000; if (t >= 0 && t <= SESSION_GAP) { d.total += t; d.n++; } }
      last[s.kind] = k;
    });
    const finished = list.some((e) => e.name === "quiz_finished");
    if (!live) for (const [kind, k] of Object.entries(last)) if (kind === "page" || !finished) ex.get(k)!.exits++;
  }
  const exits = [...ex.values()].map((x) => ({ site, kind: x.kind, step: x.step, exits: x.exits, reached: x.reached.size }));
  const dwell = [...dw.values()].map((x) => ({ site, kind: x.kind, step: x.step, avg_seconds: x.n ? Math.round(x.total / x.n) : 0, views: x.views }));

  // ---- leads (same rules as the original snapshot)
  const paidBy = new Map(paid.map((p) => [String(p.click_id), p]));
  const emailClicks = new Map<string, string[]>();
  for (const l of links) { const em = String(l.email || "").toLowerCase(); if (!em) continue; if (!emailClicks.has(em)) emailClicks.set(em, []); emailClicks.get(em)!.push(String(l.click_id)); }
  const cancelled = new Set(cancels.map((c) => String(c.email || "").toLowerCase()));
  const unsub = new Set(unsubs.map((c) => String(c.email || "").toLowerCase()));
  const leadRows = leads.map((l) => {
    const em = String(l.email || "").toLowerCase();
    const p = [String(l.click_id || ""), ...(emailClicks.get(em) ?? [])].map((c) => paidBy.get(c)).find(Boolean);
    return {
      site, email: l.email,
      status: p ? "paid" : cancelled.has(em) ? "cancelled" : unsub.has(em) ? "unsubscribed" : "lead",
      test: TEST.test(String(l.email)),
      source: l.utm_source || (l.click_id ? "ad click" : "direct"),
      device: l.device || "", score: l.score == null ? null : Number(l.score),
      click_id: l.click_id || "", submits: l.submits || 1,
      first_seen: l.created_at, last_seen: l.last_seen || l.created_at,
      utm_source: l.utm_source, utm_medium: l.utm_medium, utm_campaign: l.utm_campaign, referrer: l.referrer, lang: l.lang,
      payout: p ? p.payout : null,
    };
  });

  const body = {
    generated: new Date().toISOString(),
    leads: leadRows, days, funnel, questions, exits, dwell,
    pages: [...pages].map(([path, views]) => ({ site, path, views })),
    sources: [...srcCount].map(([source, count]) => ({ site, source, count })),
    countries: [...cCount].map(([code, visitors]) => ({ site, code, country: regionName.of(code) ?? code, visitors })),
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
});
