# Tracking and postback (in-house test setup)

Nothing here is live until this branch is merged to `main` and deployed.

## Flow
1. `tracking.js` creates a `click_id` per visitor (localStorage).
2. The results gate button ("Show my results") redirects to the active offer's tracking link
   with `sub1=<click_id>` (and `sub15=<meta pixel id>` once `PIXEL_ID` is set).
   Redirect is ON (`ENABLE_REDIRECT: true`). Set it to false to go back to the mock paywall.
3. When the offer converts, the network calls our postback:

       https://<domain>/api/postback?click_id={sub1}&payout=24&token=<POSTBACK_TOKEN>

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

## Paid-unlock flow
1. Checkout modal opens the provider in a pop-out; our click id travels as `sub4` (the tracker overwrites sub1; sub2 feeds the checkout's email field).
2. Network postback (set `click_id={sub4}` once the network confirms the macro): `https://brightfold-nine.vercel.app/api/postback?click_id={sub4}&payout=24&token=<POSTBACK_TOKEN>` -> upserts into Supabase `paid_clicks` (`supabase/paid_clicks.sql`).
3. `flow.js` polls `/api/status?click_id=` every 3s and unlocks on `{paid:true}` (cosmetic unlock; server holds the truth).
Vercel env: SUPABASE_URL, SUPABASE_SERVICE_KEY, POSTBACK_TOKEN, optional STATUS_ORIGIN.

## Open items
- Confirm with the network that `{sub4}` is a valid postback macro (or use their click-id macro).
- Meta pixel ID: sub3 vs sub15 still unconfirmed.
- Offer wording ($1 trial / "not charged" on the checkout vs $0.99 + $4.99/week in our modal) must match.
- Run supabase/paid_clicks.sql, set env vars, then deploy main to Vercel.

## Supabase Edge Function receiver (works with GitHub Pages hosting)
Functions: `supabase/functions/postback`, `supabase/functions/status` (JWT verification off via `supabase/config.toml`).

Postback URL for the network (every conversion = $24):
`https://llyanlleeynuznywttjg.supabase.co/functions/v1/postback?click_id={sub4}&payout=24&token=<POSTBACK_TOKEN>`

Setup (once):
1. Run `supabase/paid_clicks.sql` in the Supabase SQL editor.
2. `supabase login` then `supabase link --project-ref llyanlleeynuznywttjg`
3. `supabase secrets set POSTBACK_TOKEN=<token>` (optional `STATUS_ORIGIN`)
4. `supabase functions deploy postback --no-verify-jwt` and `supabase functions deploy status --no-verify-jwt`
5. Test: open the postback URL with a real-looking click_id, then `.../functions/v1/status?click_id=<same>` should return `{"paid":true}`.
