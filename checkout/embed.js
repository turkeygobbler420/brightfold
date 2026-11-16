/* Iframe side of the embedded checkout protocol.
   PCI model: this page never renders card-number/CVC inputs. In DEMO mode (default)
   Pay runs the handshake to 'complete' without network. In REAL mode Pay navigates
   THIS iframe to the provider-hosted payment page URL (provider collects card data
   in its own hosted form); on return with payment+status params we complete. */
(function () {
  'use strict';
  /* Trust boundary: our message peer is always our own origin. The #host fragment
     (Whop-style) is deliberately NOT trusted — the allowlist is exactly
     [location.origin], so a forged /checkout/embed.html#host=https://evil.com
     cannot retarget our postMessage or receive protocol messages. '*' rejected. */
  var parentOrigin = location.origin;

  var props = null;
  var inited = false;
  var root = document;

  function post(msg) {
    try { window.parent.postMessage(msg, parentOrigin); } catch (e) {}
  }
  function reportResize() {
    var h = document.body ? Math.ceil(document.body.getBoundingClientRect().height) : 0;
    post({ bf: 'resize', height: h });
  }

  // boot
  post({ bf: 'boot' });

  function render(p) {
    props = p || {};
    var amount = document.getElementById('amount');
    var interval = document.getElementById('interval');
    var trial = document.getElementById('trial');
    if (amount) amount.textContent = (props.currency === 'USD' ? '$' : '') + (props.amount != null ? props.amount : '1.00');
    if (interval) interval.textContent = props.interval != null ? props.interval : '29.99$';
    if (trial) trial.textContent = (props.trialDays != null ? props.trialDays : 7) + '-day trial';
    var notice = document.getElementById('demoNotice');
    if (notice) notice.style.display = (props.demo !== false) ? 'block' : 'none';
    var pb = document.getElementById('pay');
    if (pb) pb.disabled = false;
    reportResize();
  }

  function complete(paymentId) {
    post({ bf: 'event', name: 'complete', paymentId: paymentId || ('pay_' + Date.now()) });
  }

  window.addEventListener('message', function (ev) {
    if (ev.origin !== parentOrigin) return;
    if (ev.source !== window.parent) return;
    var d = ev.data;
    if (!d || typeof d !== 'object' || typeof d.bf !== 'string') return;
    if (d.bf === 'init') {
      if (inited) return; /* latch: one init per document (repeat init can't re-arm complete) */
      inited = true;
      render(d.props || {});
      post({ bf: 'ready' });
      reportResize();
    } else if (d.bf === 'rpc-req') {
      // respond to parent rpc (e.g. getOrderSummary); unknown actions fail explicitly
      var res = null;
      var ok = true;
      if (d.action === 'getOrderSummary') {
        res = { amount: (props && props.amount != null) ? props.amount : '1.00', interval: (props && props.interval != null) ? props.interval : '' };
      } else { ok = false; res = 'unknown action'; }
      post({ bf: 'rpc-res', id: d.id, ok: ok, result: res });
    } else if (d.bf === 'action-req') {
      post({ bf: 'action-res', id: d.id, ok: false, result: 'unsupported' });
    }
  });

  /* REAL mode: handle provider return redirect. The provider redirects back to THIS
     document (return_url = our own origin+path), a fresh boot→init cycle runs, and
     the return params land here. NOTE: query params are NOT a payment receipt —
     the parent verifies paid state via /api/status (postback truth) before
     fulfilling anything. This only relays the provider's redirect result. */
  try {
    var qs = new URLSearchParams(location.search);
    var pid = qs.get('payment');
    var status = qs.get('status');
    if (pid && (status === 'succeeded' || status === 'success' || status === 'paid')) {
      complete(pid);
    }
  } catch (e) {}

  // resize reporting on load
  window.addEventListener('load', function () { reportResize(); });
  // observe
  try {
    var ro = new ResizeObserver(function () { reportResize(); });
    ro.observe(document.body);
  } catch (e) {}

  var payBtn = document.getElementById('pay');
  if (payBtn) {
    payBtn.addEventListener('click', function () {
      if (!props) return; /* not initialized yet — button is disabled anyway */
      var msg = document.getElementById('msg');
      var demo = props.demo !== false;
      var providerUrl = props.providerUrl || '';
      if (demo) {
        // demo: run handshake through to complete
        if (msg) msg.textContent = 'Processing demo payment…';
        payBtn.disabled = true;
        setTimeout(function () { complete('pay_demo_' + Date.now()); }, 600);
      } else if (!providerUrl) {
        // configured as real but no provider URL — fail explicitly, never fake-complete
        if (msg) msg.textContent = 'Checkout is not configured. Please contact support.';
        post({ bf: 'event', name: 'error', message: 'PROVIDER_URL not configured' });
      } else {
        // REAL: navigate inside iframe to provider-hosted payment page.
        // Same attribution contract as offers.js offerUrl(): sub4 = click_id,
        // sub15 = Meta pixel ID when present. Provider redirects back to
        // return_url (this document) with payment+status params.
        if (msg) msg.textContent = 'Redirecting to secure payment…';
        var url = providerUrl;
        try {
          var u = new URL(url, location.href);
          /* Return lands back on THIS iframe document (not the parent page) so the
             boot→init cycle reruns and the return params are seen here. */
          u.searchParams.set('return_url', location.origin + location.pathname + '?checkout=return');
          if (props.metadata && props.metadata.click_id) u.searchParams.set('sub4', props.metadata.click_id);
          if (props.metadata && props.metadata.pixel) u.searchParams.set('sub15', props.metadata.pixel);
          url = u.toString();
        } catch (e) {}
        location.href = url;
      }
    });
  }
})();
