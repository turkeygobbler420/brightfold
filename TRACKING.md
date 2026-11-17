# Tracking and postback (in-house test setup)

Nothing here is live until this branch is merged to `main` and deployed.

## Flow
1. `offers.js` creates a `bf_click_id` per visitor (localStorage).
2. The checkout opens the active offer's tracking link in a pop-out with `sub8=<click_id>` (and `sub15=<meta pixel id>` once `PIXEL_ID` is set). No personal data is sent.
2b. `flow.js` first POSTs `{click_id,email}` to the `link` function (table `click_links`), for the quiz email and the account email, so the click id is tied to an email/account.
3. When the offer converts, the network calls our postback (below). `flow.js` polls the status function and unlocks the buyer's page.

## Sub-parameter map (from the network offer sheet)
| Param | Meaning | Ours |
|---|---|---|
| sub1 | network click id (tracker overwrites) | not used |
| sub2-sub7 | email, first name, last name, street, ZIP, city (checkout prefill) | not used, never send a click id here |
| sub8 | unlisted | **our click id** |
| sub9, sub11-sub14 | image_url, product_name, amount, currency, CTA colour | not used |
| sub15 | FB pixel | set from `PIXEL_ID` |

## Offers (tracking.js `OFFERS`, switch with `ACTIVE_OFFER`)
| ID | Offer | Payout |
|---|---|---|
| 25388 | US DailyOffer Shop Pay Only Shipping Prefill (CC) | 24 USD CPA (email allowed) |
| 26114 | US Green Checkout VOD (CC) | 24 USD CPA (no email) |
| 26199 | GLO WW Green Checkout VOD (CC) | 80% PPS (no email/SMS/push/VPN) |
| 26200 | GLO WW Digital Checkout (CC) | 80% PPS (no email/SMS/push/VPN) |

## Hosting
GitHub Pages (`turkeygobbler420.github.io/brightfold`) serves the static site. It cannot receive postbacks, so the receiver is two Supabase Edge Functions (`supabase/functions/postback`, `supabase/functions/status`, `supabase/functions/link`; JWT verification off via `supabase/config.toml`). The legacy Vercel `api/` files are not used by this setup.

## Postback URL (every conversion = $24, matches the US payout on all four offers)
`https://llyanlleeynuznywttjg.supabase.co/functions/v1/postback?click_id={sub8}&payout=24&token=<POSTBACK_TOKEN>`

## Setup (once)
1. Run `supabase/paid_clicks.sql` (creates `paid_clicks` and `click_links`) in the Supabase SQL editor.
2. `supabase login`, then `supabase link --project-ref llyanlleeynuznywttjg`
3. `supabase secrets set POSTBACK_TOKEN=<token>` (optional `STATUS_ORIGIN`)
4. `supabase functions deploy postback --no-verify-jwt`, `supabase functions deploy status --no-verify-jwt` and `supabase functions deploy link --no-verify-jwt`
5. Test: call the postback URL with a sample click_id, then `.../functions/v1/status?click_id=<same>` must return `{"paid":true}`.

## Open items
- Ask the network to confirm `{sub8}` is a valid postback macro and to run a test conversion.
- Meta pixel goes in `sub15` (not sub3). Set `PIXEL_ID` in offers.js.
- Offer terms confirmed with Boyd: $0 today, then $4.99/week. Site copy matches.
- Offer restrictions: 26199/26200 exclude email, SMS, push, exit, proxy/VPN traffic; 26114 excludes email.
- (done) All dev/demo paths removed (skip button, demo account, demo email submit).
- Account sync: signed-in users call `status` with their Bearer token; it returns `{paid}` if any click linked to their email was paid. Paid state in the browser is stored per email (`paidEmails`).
- Cancelling renewals happens at the payment provider; the in-app Cancel only explains this (and clears demo accounts).
- Unsubscribe: Settings > Emails posts to the `unsubscribe` function (table `unsubscribes`). Deploy it with `supabase functions deploy unsubscribe --no-verify-jwt`. For email links set secret `UNSUB_SECRET` and use `.../functions/v1/unsubscribe?email=<email>&t=<hex HMAC-SHA256 of lowercase email>`. Any mailer must skip addresses in `unsubscribes`.
- Cancel membership: Settings > Cancel posts to the `cancel` function (table `cancel_requests`, your queue to action). Deploy with `supabase functions deploy cancel --no-verify-jwt`. Set `CANCEL_URL` in offers.js once Boyd gives the billing provider's cancel/manage page; until then users are told to use the link in their receipt email.
- Offer 25388 supplies a network Unsubscribe URL (offers.js `unsubscribe`). It is linked from Settings > Emails. Any email you send promoting 25388 must include it; 26114/26199/26200 do not allow email traffic.
- Signed-in cancel: `cancel` accepts `Authorization: Bearer <user JWT>`; it resolves the account email and records a cancel request for every click linked to it. `status` returns `cancelled` so other devices show it. Deployed to project llyanlleeynuznywttjg; secrets POSTBACK_TOKEN and UNSUB_SECRET are set.
