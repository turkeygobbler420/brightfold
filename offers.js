/* Offer redirect + click ID (bf_click_id) + optional Meta pixel. Loaded before flow.js. Separate from track.js, which captures inbound network IDs. */
(function () {
  var CONFIG = {
    PIXEL_ID: '',          // Meta pixel ID, e.g. '123456789012345'. Empty = pixel disabled and no sub15 sent.
    ACTIVE_OFFER: '26199', // key into OFFERS
    // In-house testing: the results button only redirects to the offer when this is true,
    // or when a tester opens the site with ?checkout=1 (remembered for the browser session).
    ENABLE_REDIRECT: true,
    // Network tracking links. sub4 = our click_id (returned in the postback as {sub4}), sub15 = Meta pixel ID.
    OFFERS: {
      '25388': { name: 'US DailyOffer Shop Pay Only Shipping Prefill (CC), 24 USD CPA', base: 'https://vadvpl.com/clickout/25388/361471/' },
      '26114': { name: 'US Green Checkout VOD (CC), 24 USD CPA',                        base: 'https://avdiupt.com/clickout/26114/361472/' },
      '26199': { name: 'GLO WW Green Checkout VOD (CC), 80% PPS',                       base: 'https://opniivsac.com/clickout/26199/361473/' },
      '26200': { name: 'GLO WW Digital Checkout (CC), 80% PPS',                         base: 'https://apritrun.com/clickout/26200/361474/' }
    },
    // Embedded (iframe) checkout SDK config. DEMO=true shows a demo notice + Pay that completes the handshake;
    // with DEMO:true only tester sessions (?checkout=1) see the embed — other visitors keep the CPA offer path.
    // DEMO=false requires PROVIDER_URL (provider-hosted payment page); Pay then sends sub4/sub15 and unlocks
    // only after /api/status confirms the postback (never on the iframe message alone).
    EMBED: { ENABLED: true, DEMO: true, PROVIDER_URL: '', AMOUNT: '1.00', TRIAL_DAYS: 7, INTERVAL: '29.99$' }
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

  window.BF_EMBED_CONFIG = CONFIG.EMBED;
  window.bfTrack = {
    clickId: clickId,
    pixelId: CONFIG.PIXEL_ID,
    event: function (name, data) { if (window.fbq) fbq('trackCustom', name, data || {}); },
    // Builds <OFFER_BASE>?sub4=<click_id>&sub15=<pixel_id> (the tracker overwrites sub1; sub2 feeds the checkout's email field). Only the click ID and pixel ID are sent, no personal data.
    offerUrl: function (offerKey) {
      var enabled = CONFIG.ENABLE_REDIRECT;
      try { if (new URLSearchParams(location.search).get('checkout') === '1') sessionStorage.setItem('bf_checkout', '1'); } catch (e) {}
      try { if (sessionStorage.getItem('bf_checkout') === '1') enabled = true; } catch (e) {}
      if (!enabled && !offerKey) return null;
      var offer = CONFIG.OFFERS[offerKey || CONFIG.ACTIVE_OFFER];
      if (!offer) return null;
      var u = new URL(offer.base);
      u.searchParams.set('sub4', clickId);
      if (CONFIG.PIXEL_ID) u.searchParams.set('sub15', CONFIG.PIXEL_ID);
      return u.toString();
    }
  };
})();
