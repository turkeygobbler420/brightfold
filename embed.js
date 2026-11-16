/* Brightfold embedded checkout SDK (parent side).
   Modeled on Whop Elements embed protocol: iframe mount with fragment params,
   boot -> init handshake, resize -> height, rpc-req/rpc-res + action-req/action-res
   id correlation, event{name:'complete'} completion. PCI boundary: card data is
   never collected by our code; in REAL mode the iframe navigates to a
   provider-hosted payment page (provider collects card data in its own form).
   The sandbox is load-bearing in REAL mode: the provider document is cross-origin,
   so allow-same-origin does not apply to it and it cannot navigate our tab. */
(function () {
  'use strict';
  var ORIGIN = location.origin;
  var RPC_TIMEOUT = 30000;
  var MOUNT_TIMEOUT = 8000;
  var rpcSeq = 0;
  /* Resolve the SDK's own URL so the iframe path works under any base path
     (GitHub Pages serves the repo at /brightfold/). document.currentScript is
     set synchronously at parse time; this file is loaded with defer. */
  var BASE = null;
  try { BASE = new URL('.', (document.currentScript && document.currentScript.src) || location.href); } catch (e) { BASE = new URL('.', location.href); }

  function BFEmbed() {
    return {
      checkout: {
        create: function (opts) {
          opts = opts || {};
          var handle = {
            _opts: opts,
            _iframe: null,
            _container: null,
            _listeners: [],
            _pending: Object.create(null),
            _destroyed: false,
            _revealed: false,
            _done: false,
            create: function () { return handle; },
            mount: function (target) {
              var el = (typeof target === 'string') ? document.querySelector(target) : target;
              if (!el) throw new Error('BFEmbed: mount target not found (' + String(target) + ')');
              if (handle._iframe) return handle;

              var cfg = window.BF_EMBED_CONFIG || {};
              var container = document.createElement('div');
              container.style.cssText = 'position:relative;width:100%';
              var iframe = document.createElement('iframe');
              var params = new URLSearchParams();
              params.set('host', ORIGIN);
              params.set('theme', (opts.theme || 'light'));
              params.set('rel', 'bf-1');
              params.set('v', '20261285');
              iframe.src = new URL('checkout/embed.html', BASE).toString() + '?' + params.toString();
              /* No allow-top-navigation / allow-popups-to-escape-sandbox / clipboard-write:
                 in REAL mode the provider document runs in this frame and must not
                 navigate our tab or open unsandboxed popups. */
              iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
              iframe.setAttribute('allow', 'payment; publickey-credentials-get');
              iframe.referrerPolicy = 'no-referrer';
              iframe.style.cssText = 'opacity:0;transition:opacity 150ms ease;border:0;width:100%;height:0;display:block;color-scheme:light;background:transparent;';
              iframe.setAttribute('scrolling', 'no');

              /* If the iframe 404s, is blocked, or the handshake stalls, the modal
                 would sit at height 0 forever. Fail loudly into onMountFailed so the
                 caller can fall back. */
              var bootTimer = null;
              /* Register the message listener BEFORE the iframe exists in the DOM so
                 no early message can be missed (postMessage dispatch is async, but
                 keep the invariant structural). */
              var onMsg = function (ev) {
                if (ev.origin !== ORIGIN) return;
                if (ev.source !== iframe.contentWindow) return;
                var msg = ev.data;
                if (!msg || typeof msg !== 'object' || typeof msg.bf !== 'string') return;
                switch (msg.bf) {
                  case 'boot':
                    /* Re-send init on EVERY boot: a REAL-mode return navigation creates
                       a fresh document that must be initialized again. The iframe
                       latches per document, so repeat init within one document is
                       ignored there. */
                    iframe.contentWindow.postMessage({
                      bf: 'init',
                      props: {
                        amount: (opts.amount != null ? opts.amount : cfg.AMOUNT),
                        currency: (opts.currency || 'USD'),
                        trialDays: (opts.trialDays != null ? opts.trialDays : cfg.TRIAL_DAYS),
                        interval: (opts.interval || cfg.INTERVAL),
                        metadata: (opts.metadata || {}),
                        returnUrl: (opts.returnUrl || (location.origin + location.pathname)),
                        theme: (opts.theme || 'light'),
                        demo: (cfg.DEMO !== false),
                        providerUrl: (cfg.PROVIDER_URL || ''),
                        enabled: (cfg.ENABLED !== false)
                      }
                    }, ORIGIN);
                    break;
                  case 'resize':
                    if (typeof msg.height === 'number' && isFinite(msg.height) && msg.height > 0 && msg.height < 4000) {
                      iframe.style.height = msg.height + 'px';
                      if (!handle._revealed) { handle._revealed = true; iframe.style.opacity = '1'; clearTimeout(bootTimer); }
                    }
                    break;
                  case 'event': {
                    if (handle._done) break;
                    handle._done = true;
                    var cb = (typeof opts.onComplete === 'function') ? opts.onComplete : null;
                    try { clearTimeout(bootTimer); } catch (e) {}
                    try {
                      if (msg.name === 'complete') { if (cb) cb({ result: 'payment', paymentId: msg.paymentId || null }); }
                      else if (msg.name === 'cancel') { if (cb) cb({ result: 'cancel' }); }
                      else if (msg.name === 'error') { if (cb) cb({ result: 'error', message: msg.message }); }
                    } finally { handle.destroy(); }
                    break;
                  }
                  case 'rpc-res':
                  case 'action-res': {
                    var p = Object.prototype.hasOwnProperty.call(handle._pending, msg.id) ? handle._pending[msg.id] : null;
                    if (p) { clearTimeout(p.t); delete handle._pending[msg.id]; if (msg.ok) p.resolve(msg.result); else p.reject(new Error(msg.error || 'rpc failed')); }
                    break;
                  }
                }
              };
              window.addEventListener('message', onMsg);
              handle._listeners.push(onMsg);

              container.appendChild(iframe);
              el.appendChild(container);
              handle._iframe = iframe;
              handle._container = container;

              bootTimer = setTimeout(function () {
                if (!handle._revealed && !handle._done) {
                  var fail = (typeof opts.onMountFailed === 'function') ? opts.onMountFailed : null;
                  handle.destroy();
                  if (fail) fail();
                }
              }, MOUNT_TIMEOUT);

              /* rpc/action helpers. Reject early once destroyed; no dangling timers. */
              handle.rpc = function (action, input) {
                if (handle._destroyed) return Promise.reject(new Error('destroyed'));
                return new Promise(function (resolve, reject) {
                  var id = 'h' + (++rpcSeq);
                  var t = setTimeout(function () { delete handle._pending[id]; reject(new Error('rpc timeout')); }, RPC_TIMEOUT);
                  handle._pending[id] = { resolve: resolve, reject: reject, t: t };
                  iframe.contentWindow.postMessage({ bf: 'rpc-req', id: id, action: action, input: input }, ORIGIN);
                });
              };
              handle.action = function (name, input) {
                if (handle._destroyed) return Promise.reject(new Error('destroyed'));
                return new Promise(function (resolve, reject) {
                  var id = 'a' + (++rpcSeq);
                  var t = setTimeout(function () { delete handle._pending[id]; reject(new Error('action timeout')); }, RPC_TIMEOUT);
                  handle._pending[id] = { resolve: resolve, reject: reject, t: t };
                  iframe.contentWindow.postMessage({ bf: 'action-req', id: id, name: name, input: input }, ORIGIN);
                });
              };

              return handle;
            },
            destroy: function () {
              if (handle._destroyed) return;
              handle._destroyed = true;
              handle._listeners.forEach(function (fn) { window.removeEventListener('message', fn); });
              handle._listeners = [];
              Object.keys(handle._pending).forEach(function (k) {
                var p = handle._pending[k];
                clearTimeout(p.t); p.reject(new Error('destroyed')); delete handle._pending[k];
              });
              if (handle._container && handle._container.parentNode) handle._container.parentNode.removeChild(handle._container);
              handle._iframe = null;
              handle._container = null;
            }
          };
          return handle;
        }
      }
    };
  }

  window.BFEmbed = BFEmbed;
})();
