# Tracking and postback (in-house test setup)

Nothing here is live until this branch is merged to `main` and deployed.

## Flow
1. `offers.js` creates a `bf_click_id` per visitor (localStorage).
2. The checkout opens the active offer's tracking link in a pop-out with `sub8=<click_id>` (and `sub15=<meta pixel id>` once `PIXEL_ID` is set). No personal data is sent.
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
GitHub Pages (`turkeygobbler420.github.io/brightfold`) serves the static site. It cannot receive postbacks, so the receiver is two Supabase Edge Functions (`supabase/functions/postback`, `supabase/functions/status`; JWT verification off via `supabase/config.toml`). The legacy Vercel `api/` files are not used by this setup.

## Postback URL (every conversion = $24, matches the US payout on all four offers)
`https://llyanlleeynuznywttjg.supabase.co/functions/v1/postback?click_id={sub8}&payout=24&token=<POSTBACK_TOKEN>`

## Setup (once)
1. Run `supabase/paid_clicks.sql` in the Supabase SQL editor.
2. `supabase login`, then `supabase link --project-ref llyanlleeynuznywttjg`
3. `supabase secrets set POSTBACK_TOKEN=<token>` (optional `STATUS_ORIGIN`)
4. `supabase functions deploy postback --no-verify-jwt` and `supabase functions deploy status --no-verify-jwt`
5. Test: call the postback URL with a sample click_id, then `.../functions/v1/status?click_id=<same>` must return `{"paid":true}`.

## Open items
- Ask the network to confirm `{sub8}` is a valid postback macro and to run a test conversion.
- Meta pixel goes in `sub15` (not sub3). Set `PIXEL_ID` in offers.js.
- Offer wording ($1 trial / "not charged" on the checkout vs our modal) must match the real offer.
- Offer restrictions: 26199/26200 exclude email, SMS, push, exit, proxy/VPN traffic; 26114 excludes email.
- Remove the TEMP DEV skip button in flow.js before launch.
