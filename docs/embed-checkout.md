# Brightfold embedded checkout

## Files
- `embed.js` — parent SDK (`window.BFEmbed()`).
- `checkout/embed.html` + `checkout/embed.js` — iframe checkout page (same origin).
- Config: `window.BF_EMBED_CONFIG` from `offers.js`.

## Protocol
Messages are objects with `bf: <string>` discriminator. Parent validates origin === our origin, source === iframe.contentWindow, and `bf` string. Iframe treats its message peer as `location.origin` ONLY — the `#host=` fragment/query is deliberately not trusted (allowlist is exactly `[location.origin]`, `*` rejected), so a forged `/checkout/embed.html#host=https://evil.com` cannot retarget postMessage or receive protocol messages.

Parent→iframe:
- `init` `{bf:'init', props}` — re-sent on EVERY `boot` (REAL-mode return navigation creates a fresh document); the iframe latches one init per document.

Iframe→parent:
- `boot`, `ready`, `resize {height}`, `event {name, paymentId|message}`.
- `rpc-res {id, ok, result}` (reply to `rpc-req`), `action-res {id, ok, result}` (reply to `action-req`).

Parent→iframe requests:
- `rpc-req {id, action, input}` → `rpc-res`; unknown actions reply `ok:false`.
- `action-req {id, name, input}` → `action-res` (currently `ok:false` — unsupported).

Completion: iframe emits `event name:'complete'` with `paymentId`; parent calls `onComplete({result:'payment', paymentId})`. `error`/`cancel` map to `onComplete({result:'error'|'cancel'})`.

Handshake safety: parent re-sends `init` on every boot; iframe latches; reveal happens only on the first valid `resize` (heights bounded to (0, 4000)); if no resize arrives within 8s the parent calls `onMountFailed` (→ CPA pop-out fallback) and destroys.

Security: sandbox `allow-scripts allow-same-origin allow-forms allow-popups` (no top-navigation / popups-escape / clipboard-write — in REAL mode the provider document is cross-origin and sandboxed, so it cannot navigate our tab); allow `payment; publickey-credentials-get`. iframe `referrerpolicy=no-referrer`. `embed.html` carries a restrictive CSP meta; `vercel.json` overrides `X-Frame-Options: SAMEORIGIN` + `Content-Security-Policy: frame-ancestors 'self'` for `/checkout/embed.html` (global DENY elsewhere is kept).

## Config (offers.js CONFIG.EMBED)
ENABLED, DEMO, PROVIDER_URL, AMOUNT, TRIAL_DAYS, INTERVAL (bold "Then" amount; the "every 28 days" note is part of the iframe template).

## Gating (who sees the embed)
- `DEMO:false` + `PROVIDER_URL` set → the embed is the primary checkout for everyone.
- `DEMO:true` (current default) → only tester sessions (opened with `?checkout=1`, remembered as `sessionStorage.bf_checkout`) see the embed demo; all other visitors take the existing CPA pop-out path. This keeps the revenue path live while the embed is tested.

## Demo vs real
DEMO=true: iframe shows demo notice; Pay completes the handshake locally and unlocks (explicitly labelled demo, no payment taken, no card inputs anywhere).
REAL: set DEMO=false + PROVIDER_URL (provider-hosted checkout URL). Pay navigates inside the iframe to the provider (provider collects card data in its own hosted form) with the same attribution contract as `offerUrl()`: `sub4=<click_id>` (+ `sub15=<pixel_id>` when configured). The provider returns to `checkout/embed.html?checkout=return&payment=...&status=...` (this iframe document, not the parent page); a fresh boot→init cycle runs and the iframe relays `complete`. Provider-hosted form = Whop/Stripe PCI model.

## Invariants & go-live requirements
- **Same-origin invariant:** `checkout/embed.html` must stay same-origin with the parent page. With `allow-same-origin`, the iframe script can read parent DOM, localStorage (`bf_click_id`, Supabase session) and cookies — acceptable only because the content is first-party. If the embed ever moves to another host/subdomain, drop `allow-same-origin`, re-review the sandbox, and treat `init` as a cross-origin channel.
- **Query params are not a receipt.** `?payment=&status=` on the return URL is unauthenticated. In REAL mode the parent never unlocks on the iframe message: it verifies paid state via `/api/status` (postback truth, `watchPayment`). The iframe's `complete` relay is only a UX signal.
- **Base path:** the SDK resolves the iframe URL from its own script URL (`document.currentScript`), so it works at `/brightfold/` (GitHub Pages) and at any Vercel domain.
- `click_id` travels in `init` props and provider query (`sub4`) only; `returnUrl` passed to the provider is origin+path (no ad-params).

## Fallback chain
`BFEmbed` missing / config disabled / demo gate closed → CPA pop-out (`offerUrl()`). Mount throws or no handshake within 8s (`onMountFailed`) → overlay closed + CPA pop-out. If no offer configured → legacy demo unlock.

## Going live
1. Set `PROVIDER_URL` + `DEMO:false` (config in `offers.js`).
2. Ensure the provider appends `payment` + `status` to `return_url` and accepts `sub4`/`sub15`.
3. Verify paid state via `/api/status` or provider webhook before fulfillment — never trust the iframe `complete` message or query params alone (REAL mode already does this via `watchPayment`).
4. Do not render card inputs in our code.
5. Keep the `vercel.json` `/checkout/embed.html` header override (SAMEORIGIN + frame-ancestors) so the frame mounts while the rest of the site stays DENY.
6. Bump `?v=` on `embed.js` (index.html), `checkout/embed.html` (iframe src param in `embed.js`), and `checkout/embed.js` (script tag in embed.html) together when changing any of the three.
