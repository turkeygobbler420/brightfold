/* Offer redirect + click ID (bf_click_id) + optional Meta pixel. Loaded before flow.js. */
(function () {
  var CONFIG = {
    // PostHog project API key (starts with phc_). Empty = analytics disabled. Use host https://eu.i.posthog.com for EU Cloud.
    POSTHOG_KEY: 'phc_nH8eGAJ9eLULrNyGSKs3zKB2q6ctsKQbtg7WTqZNiMPZ',
    POSTHOG_HOST: 'https://us.i.posthog.com',
    PIXEL_ID: '',          // Meta pixel ID, e.g. '123456789012345'. Empty = pixel disabled and no sub15 sent.
    ACTIVE_OFFER: 'whop', // key into OFFERS
    // In-house testing: the results button only redirects to the offer when this is true,
    // or when a tester opens the site with ?checkout=1 (remembered for the browser session).
    ENABLE_REDIRECT: true,
    // Billing provider's cancel / manage-subscription page (ask the network). When set, Cancel membership opens it.
    CANCEL_URL: '',
    // Network tracking links. sub8 = our click_id (returned in the postback as {sub8}), sub15 = Meta pixel ID.
    // Never use sub1 (tracker overwrites it) or sub2-sub7 (email/first/last name/street/ZIP/city prefill fields).
    OFFERS: {
      // Our own Whop checkout. direct = open as-is (no affiliate sub8/sub15 params).
      'whop':  { name: 'Whop checkout (own)', base: 'https://whop.com/checkout/plan_gZemshu7CN47f', direct: true },
      '25388': { name: 'US DailyOffer Shop Pay Only Shipping Prefill (CC), 24 USD CPA', base: 'https://vadvpl.com/clickout/25388/361471/', unsubscribe: 'https://unsubscribe.mailsolvo.com/unsubscribe/34837f666bc711f18cb502042bbd4231' },
      '26114': { name: 'US Green Checkout VOD (CC), 24 USD CPA',                        base: 'https://avdiupt.com/clickout/26114/361472/' },
      '26199': { name: 'GLO WW Green Checkout VOD (CC), 80% PPS',                       base: 'https://opniivsac.com/clickout/26199/361473/' },
      '26200': { name: 'GLO WW Digital Checkout (CC), 80% PPS',                         base: 'https://apritrun.com/clickout/26200/361474/' }
    }
  };

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '');
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
  }

  var clickId = safeGet('bf_click_id');
  if (!clickId) { clickId = newId(); safeSet('bf_click_id', clickId); }

  // Remember ad-platform params from the landing URL.
  try {
    var p = new URLSearchParams(location.search);
    ['fbclid', 'ttclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (p.get(k)) safeSet('bf_' + k, p.get(k));
    });
  } catch (e) {}

  // Meta pixel: loads only once analytics consent exists (auto for non-EU, banner Accept for EU/UK). Needs CONFIG.PIXEL_ID.
  var pxLoaded = false;
  window.bfPx = function () {
    if (pxLoaded || !CONFIG.PIXEL_ID) return; pxLoaded = true;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CONFIG.PIXEL_ID);
    fbq('track', 'PageView');
  };

  // PostHog analytics. Visitor id = our click id, so the server-side purchase event (postback) joins the same person.
  if (CONFIG.POSTHOG_KEY) {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags on onFeatureFlags onSessionId identify setPersonProperties reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    function bfGeo(cb){var done=false,EU='AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB IS LI NO CH';
    bfGeo.eu=function(c){return !c||EU.indexOf(c)>-1;};
    function fin(c){if(done)return;done=true;cb(c);}
    try{var s=sessionStorage.getItem('bf_geo');if(s)return fin(s);}catch(e){}
    function save(c){c=(c||'').toUpperCase();if(!/^[A-Z]{2}$/.test(c))return '';try{sessionStorage.setItem('bf_geo',c);}catch(e){}return c;}
    function get(u,p){var ac=window.AbortController?new AbortController():null;var t=setTimeout(function(){ac&&ac.abort();},3500);return fetch(u,{cache:'no-store',signal:ac&&ac.signal}).then(function(r){return r.text();}).then(function(x){clearTimeout(t);return p(x);});}
    get('https://www.cloudflare.com/cdn-cgi/trace',function(x){var m=/^loc=([A-Za-z]{2})/m.exec(x);return save(m&&m[1]);})
      .then(function(c){if(c)return c;throw 0;})
      .catch(function(){return get('https://api.country.is/',function(x){return save(JSON.parse(x).country);});})
      .then(fin,function(){fin('');});
  }
    function bfInit(full) { if (full) bfPx(); posthog.init(CONFIG.POSTHOG_KEY, { api_host: CONFIG.POSTHOG_HOST, person_profiles: 'identified_only', capture_pageview: 'history_change', persistence: full ? 'localStorage+cookie' : 'memory', disable_session_recording: !full, ip: !!full, bootstrap: full ? { distinctID: clickId } : undefined, loaded: function (ph) { if (full) ph.identify(clickId); } }); }
    function show(){var d=document.createElement("div");d.setAttribute("role","region");d.setAttribute("aria-label","Cookie notice");d.style.cssText="position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:560px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;padding:12px 14px;background:#fff;color:#121212;border:1px solid rgba(0,0,0,.12);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);font:13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif";d.innerHTML='<span style="flex:1 1 240px">We use cookies for analytics to improve this quiz. Without them we only collect anonymous, cookie-free statistics.</span><span style="display:flex;gap:8px"><button type="button" data-c="no" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:#fff;color:#121212;font:inherit;font-weight:600;cursor:pointer">Decline</button><button type="button" data-c="yes" style="padding:8px 14px;border-radius:8px;border:0;background:#121212;color:#fff;font:inherit;font-weight:600;cursor:pointer">Accept</button></span>';d.addEventListener("click",function(ev){var c=ev.target&&ev.target.getAttribute&&ev.target.getAttribute("data-c");if(!c)return;if(c==="yes"){safeSet("bf_consent","yes");bfPx();try{window.ttq&&ttq.grantConsent()}catch(x){}try{posthog.set_config({persistence:'localStorage+cookie',ip:true});posthog.identify(clickId)}catch(x){}}else safeSet("bf_consent","no");d.remove()});document.body.appendChild(d)}
    function go() {
      if (safeGet('bf_consent') === 'yes') { bfInit(true); return; }
      bfGeo(function (c) {
        if (!bfGeo.eu(c)) { safeSet('bf_consent', 'yes'); try { window.ttq && ttq.grantConsent(); } catch (x) {} bfInit(true); }
        else { bfInit(false); if (safeGet('bf_consent') !== 'no') { if (document.body) show(); else document.addEventListener('DOMContentLoaded', show); } }
      });
    }
    go();
  }


  // TikTok Pixel. Loaded on hold: nothing is sent until the visitor accepts the consent banner.
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"], ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; }, ttq.load = function (e, n) { var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; n = document.createElement("script"); n.type = "text/javascript", n.async = !0, n.src = r + "?sdkid=" + e + "&lib=" + t; e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e); };
    ttq.holdConsent();
    if (safeGet('bf_consent') === 'yes') ttq.grantConsent();
    ttq.load('DBUD593C77U4UD9J425G');
    ttq.page();
  }(window, document, 'ttq');
  // Purchase: called once the postback confirms payment. Deduped per click id; event_id lets TikTok dedupe against a server event.
  window.BF_PURCHASE = function (amount, currency) {
    try {
      if (amount == null || !isFinite(amount) || +amount <= 0) return; // amount Whop collected is unknown: the server event (exact amount) covers it, never guess $24
      var k = 'bf_tt_purchase_' + clickId;
      if (safeGet(k)) return;
      safeSet(k, '1');
      // Facebook: only visitors who arrived from a Facebook ad (fbclid / _fbc), value = amount Whop collected. eventID = click id for CAPI dedupe.
      try { if (window.fbq && (safeGet('bf_fbclid') || /(?:^|;\s*)_fbc=/.test(document.cookie))) fbq('track', 'Purchase', { value: Math.round(+amount * 100) / 100, currency: String(currency || 'USD').toUpperCase() }, { eventID: clickId }); } catch (x) {}
      if (window.ttq) ttq.track('CompletePayment', { content_type: 'product', content_id: 'iq-report', content_name: 'IQ Report', quantity: 1, value: +amount, currency: currency || 'USD' }, { event_id: 'purchase_' + clickId });
      if (window.posthog) posthog.capture('purchase_confirmed', { click_id: clickId });
      bfT('purchase_confirmed', null, tPath);
    } catch (e) {}
  };
  // TikTok match data for the server-side purchase (stored with the click by the link function).
  window.BF_TT = function () {
    var m = /(?:^|;\s*)_ttp=([^;]+)/.exec(document.cookie);
    return { ttclid: safeGet('bf_ttclid') || undefined, ttp: m ? decodeURIComponent(m[1]) : undefined, url: location.href };
  };
  window.BF_IDENTIFY = function (email) { try { if (window.ttq) ttq.identify({ email: String(email || '').trim().toLowerCase(), external_id: clickId }); } catch (e) {} };
  // Landed from a TikTok ad: store the ttclid against this click right away (the email comes later).
  try {
    if (new URLSearchParams(location.search).get('ttclid')) {
      var tt = window.BF_TT(); tt.click_id = clickId;
      fetch('https://mmedge.vercel.app/api/link', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(tt) }).catch(function () {});
    }
  } catch (e) {}
  // Funnel steps mirrored to TikTok as standard events (shown in Events Manager > Test events).
  var TT_EV = {
    quiz_started: ['ViewContent', { content_type: 'product', content_id: 'iq-test', content_name: 'IQ Test' }],
    email_submitted: ['CompleteRegistration', {}],
    checkout_viewed: ['InitiateCheckout', { content_type: 'product', content_id: 'iq-report', content_name: 'IQ Report', quantity: 1, value: 24, currency: 'USD' }],
    checkout_clicked: ['AddPaymentInfo', { content_type: 'product', content_id: 'iq-report', content_name: 'IQ Report', quantity: 1, value: 24, currency: 'USD' }]
  };
  // First-party analytics for the team dashboard (Supabase `track`): visitor = click id, no cookies, no personal data.
  var T_URL = 'https://mmedge.vercel.app/api/sync';
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  var tSid = ss('bf_sid'); if (!tSid) { tSid = newId(); ss('bf_sid', tSid); }
  var tSrc = ss('bf_src');
  if (!tSrc) {
    var ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    var lp = new URLSearchParams(location.search);
    tSrc = lp.get('utm_source') || (lp.get('ttclid') ? 'tiktok' : lp.get('fbclid') ? 'facebook' : '') || (ref && !/mindmetric\.info$/.test(ref) ? ref : '') || safeGet('bf_utm_source') || 'direct';
    ss('bf_src', tSrc);
  }
  var tDev = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  function bfT(name, props, path) {
    try {
      var b = JSON.stringify({ vid: clickId, sid: tSid, name: name, path: path || location.pathname, props: props || null, source: tSrc, country: ss('bf_geo') || null, device: tDev });
      if (!/^https?:$/.test(location.protocol)) return;
      // Blockers drop fetch/beacon to tracker-looking URLs: fall back to an image request, which they rarely catch.
      var px = function () { try { new Image().src = T_URL + '?d=' + btoa(unescape(encodeURIComponent(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) {} };
      if (name === 'leave' && navigator.sendBeacon) { if (!navigator.sendBeacon(T_URL, new Blob([b], { type: 'text/plain' }))) px(); return; }
      fetch(T_URL, { method: 'POST', keepalive: true, headers: { 'content-type': 'text/plain' }, body: b }).then(function (r) { if (!r.ok) px(); }).catch(px);
    } catch (e) {}
  }
  var tPath = location.pathname + (/[?&]step=|[?&]question/.test(location.search) ? location.search : '');
  function tView(p) { if (p === tPath && tView.done) return; tView.done = 1; tPath = p; bfT('pageview', null, p); }
  // Wait briefly for the country lookup (cached per tab) so the first pageview carries it.
  (function () { var sent = 0; function go() { if (!sent) { sent = 1; tView(tPath); } } if (ss('bf_geo') || typeof bfGeo !== 'function') return go(); try { bfGeo(go); } catch (e) { go(); } setTimeout(go, 4000); })();
  window.addEventListener('pagehide', function () { bfT('leave', null, tPath); });

  // Funnel event helper: BF_EV('name', {props}). Safe to call when analytics is off.
  window.BF_EV = function (name, props) {
    bfT(name, props, tPath);
    try { if (window.posthog) posthog.capture(name, props || {}); } catch (e) {}
    try { var t = TT_EV[name]; if (t && window.ttq) ttq.track(t[0], t[1], { event_id: name + '_' + clickId }); } catch (e) {}
  };

  // Show the current stage in the address bar (no reload, no extra history entries).
  window.BF_URL = function (p) { try { if (/^https?:$/.test(location.protocol)) history.replaceState(null, '', p); } catch (e) {} tView(p); };

  window.bfTrack = {
    clickId: clickId,
    pixelId: CONFIG.PIXEL_ID,
    cancelUrl: CONFIG.CANCEL_URL,
    // Network-provided unsubscribe page (offer 25388 allows email traffic and requires it). Null when the offer has none.
    unsubscribeUrl: function (offerKey) { var o = CONFIG.OFFERS[offerKey || CONFIG.ACTIVE_OFFER] || CONFIG.OFFERS['25388']; return (o && o.unsubscribe) || CONFIG.OFFERS['25388'].unsubscribe || null; },
    event: function (name, data) { if (window.fbq) fbq('trackCustom', name, data || {}); },
    // Builds <OFFER_BASE>?sub8=<click_id>&sub15=<pixel_id> (sub1 is overwritten by the tracker; sub2-sub7 are checkout prefill fields). Only the click ID and pixel ID are sent, no personal data.
    offerUrl: function (offerKey) {
      var enabled = CONFIG.ENABLE_REDIRECT;
      try { if (new URLSearchParams(location.search).get('checkout') === '1') sessionStorage.setItem('bf_checkout', '1'); } catch (e) {}
      try { if (sessionStorage.getItem('bf_checkout') === '1') enabled = true; } catch (e) {}
      if (!enabled && !offerKey) return null;
      var offer = CONFIG.OFFERS[offerKey || CONFIG.ACTIVE_OFFER];
      if (!offer) return null;
      if (offer.direct) return offer.base;
      var u = new URL(offer.base);
      u.searchParams.set('sub8', clickId);
      if (CONFIG.PIXEL_ID) u.searchParams.set('sub15', CONFIG.PIXEL_ID);
      return u.toString();
    }
  };
})();
