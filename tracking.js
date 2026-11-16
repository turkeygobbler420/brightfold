/* Click-ID capture + Meta pixel. Load before the other scripts.
   Fill in PIXEL_ID (and OFFER_BASE when you decide where visitors go). */
(function () {
  var CONFIG = {
    PIXEL_ID: '',        // Meta pixel ID, e.g. '123456789012345'. Empty = pixel disabled.
    OFFER_BASE: ''       // e.g. 'https://opniivsac.com/clickout/26199/361473/'. Empty = no offer link built.
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

  window.bfTrack = {
    clickId: clickId,
    pixelId: CONFIG.PIXEL_ID,
    event: function (name, data) { if (window.fbq) fbq('trackCustom', name, data || {}); },
    // Builds <OFFER_BASE>?sub1=<click_id>&sub15=<pixel_id>. Only the click ID and pixel ID are sent, no personal data.
    offerUrl: function (base) {
      base = base || CONFIG.OFFER_BASE;
      if (!base) return null;
      var u = new URL(base, location.href);
      u.searchParams.set('sub1', clickId);
      if (CONFIG.PIXEL_ID) u.searchParams.set('sub15', CONFIG.PIXEL_ID);
      return u.toString();
    }
  };
})();
