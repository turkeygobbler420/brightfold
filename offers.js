/* Click ID (bf_click_id) + optional Meta pixel + embedded checkout config. Loaded before flow.js. Separate from track.js, which captures inbound network IDs. */
(function () {
  var CONFIG = {
    PIXEL_ID: '',          // Meta pixel ID, e.g. '123456789012345'. Empty = pixel disabled and no sub15 sent.
    // Embedded (iframe) checkout SDK config — the only checkout path. DEMO=true: Pay completes the handshake
    // locally (no payment taken yet; transitional until a processor is wired). DEMO=false requires PROVIDER_URL
    // (provider-hosted payment page); Pay then sends sub4/sub15 and unlocks only after /api/status confirms
    // the postback (never on the iframe message alone).
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
    event: function (name, data) { if (window.fbq) fbq('trackCustom', name, data || {}); }
  };
})();
