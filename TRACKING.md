# Tracking and postback (in-house test setup)

Nothing here is live until this branch is merged to `main` and deployed.

## Flow
1. `tracking.js` creates a `click_id` per visitor (localStorage).
2. The results gate button ("Show my results") redirects to the active offer's tracking link
   with `sub1=<click_id>` (and `sub15=<meta pixel id>` once `PIXEL_ID` is set).
   Redirect is ON (`ENABLE_REDIRECT: true`). Set it to false to go back to the mock paywall.
3. When the offer converts, the network calls our postback:

       https://<domain>/api/postback?click_id={sub1}&payout={payout_amount}&token=<POSTBACK_TOKEN>

   `api/postback.js` validates it and logs it (Vercel Logs, search "postback").
   With `META_PIXEL_ID` + `META_ACCESS_TOKEN` set it also sends a Meta Conversions API `Purchase`.

## Offers (tracking.js `OFFERS`, switch with `ACTIVE_OFFER`)
| ID | Offer | Payout |
|---|---|---|
| 25388 | US DailyOffer Shop Pay Only Shipping Prefill (CC) | 24 USD CPA (email allowed) |
| 26114 | US Green Checkout VOD (CC) | 24 USD CPA (no email) |
| 26199 | GLO WW Green Checkout VOD (CC) | 80% PPS (no email/SMS/push/VPN) |
| 26200 | GLO WW Digital Checkout (CC) | 80% PPS (no email/SMS/push/VPN) |

## Hosting
- GitHub Pages (`turkeygobbler420.github.io/brightfold`) serves the static site and `tracking.js` only.
  It cannot run `api/postback.js`, so the network's postback URL must point at the Vercel deployment.
- `.github/workflows/vercel-deploy.yml` deploys `main` to Vercel once the `VERCEL_TOKEN` repo secret is added.
  (Vercel Hobby allows 100 deployments/day; a deploy that hits the limit can be re-run via Actions -> Run workflow.)

## Open items
- Meta pixel ID: network said "sub3", but every offer lists sub3 = first_name and sub15 = FB_PIXEL. Using sub15; confirm with the network.
- Set `POSTBACK_TOKEN` (and optional Meta env vars) in Vercel, and add `&token=` to the postback URL.
- Vercel project `brightfold` is not Git-connected (deploys are via CLI).
- No unlock verification yet: results are not gated on the postback.
