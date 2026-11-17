/* Offer redirect + click ID (bf_click_id) + optional Meta pixel. Loaded before flow.js. */
(function () {
  var CONFIG = {
    // PostHog project API key (starts with phc_). Empty = analytics disabled. Use host https://eu.i.posthog.com for EU Cloud.
    POSTHOG_KEY: 'phc_nH8eGAJ9eLULrNyGSKs3zKB2q6ctsKQbtg7WTqZNiMPZ',
    POSTHOG_HOST: 'https://us.i.posthog.com',
    PIXEL_ID: '',          // Meta pixel ID, e.g. '123456789012345'. Empty = pixel disabled and no sub15 sent.
    ACTIVE_OFFER: '26199', // key into OFFERS
    // In-house testing: the results button only redirects to the offer when this is true,
    // or when a tester opens the site with ?checkout=1 (remembered for the browser session).
    ENABLE_REDIRECT: true,
    // Billing provider's cancel / manage-subscription page (ask the network). When set, Cancel membership opens it.
    CANCEL_URL: '',
    // Network tracking links. sub8 = our click_id (returned in the postback as {sub8}), sub15 = Meta pixel ID.
    // Never use sub1 (tracker overwrites it) or sub2-sub7 (email/first/last name/street/ZIP/city prefill fields).
    OFFERS: {
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
    ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (p.get(k)) safeSet('bf_' + k, p.get(k));
    });
  } catch (e) {}

  // Meta pixel base code
  if (CONFIG.PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CONFIG.PIXEL_ID);
    fbq('track', 'PageView');
  }

  // PostHog analytics. Visitor id = our click id, so the server-side purchase event (postback) joins the same person.
  if (CONFIG.POSTHOG_KEY) {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags on onFeatureFlags onSessionId identify setPersonProperties reset get_distinct_id get_session_id set_config startSessionRecording stopSessionRecording opt_in_capturing opt_out_capturing has_opted_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(CONFIG.POSTHOG_KEY, { api_host: CONFIG.POSTHOG_HOST, person_profiles: 'identified_only', capture_pageview: 'history_change', bootstrap: { distinctID: clickId }, loaded: function (ph) { ph.identify(clickId); } });
  }
  // Funnel event helper: BF_EV('name', {props}). Safe to call when analytics is off.
  window.BF_EV = function (name, props) { try { if (window.posthog) posthog.capture(name, props || {}); } catch (e) {} };

  // Show the current stage in the address bar (no reload, no extra history entries).
  window.BF_URL = function (p) { try { if (/^https?:$/.test(location.protocol)) history.replaceState(null, '', p); } catch (e) {} };

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
      var u = new URL(offer.base);
      u.searchParams.set('sub8', clickId);
      if (CONFIG.PIXEL_ID) u.searchParams.set('sub15', CONFIG.PIXEL_ID);
      return u.toString();
    }
  };
})();
