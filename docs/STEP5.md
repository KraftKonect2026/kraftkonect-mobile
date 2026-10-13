# Step 5: customer discovery and targeted requests

All work is in the local checkout. No commit, push, deployment, EAS build or OTA publication was performed.

## Try the journey

Run `npm run start:web:local` and open [the discovery preview](http://localhost:8081/discovery-preview).
Choose Plumbing → Next → choose/enter an area → Next → choose a date → Search providers.
Open a profile, work photos or reviews. Choose a service/Get quote, fill the job description, review and send the sample request.

The ribbon labels sample data. **States** selects Empty, Loading, Error, Send failure and Unavailable service. Try Send failure on the review screen, then Sample and retry: the draft stays in place. Success follows a stored **local sample** record, never a timer. Pending request and Message provider explain their upcoming backend connection; no messages are sent. Saved providers and Book again also open through States or Customer Home. The Home search field/categories and provider cards now lead into this shared journey.

The preview redirects in production. It never authenticates, changes a real favourite, calls the backend, requests device location, sends a real request, or charges money. Its storage owner is distinct from every signed-in account.

## Shared screens and real routes

- Search: full-screen What, Where, When; retained selections; Clear all; current/manual area; local calendar with disabled past dates, month navigation and date shortcuts.
- Results: provider cards, service/date sheets, numeric price ordering and area controls. The fixed header retains search controls while cards scroll.
- Profile: active service cards and starting prices, work-photo viewer with thumbnails, filtered/sorted reviews and expandable text, real saved-provider actions.
- Request: selected service, preferred date, area and description → review → submission boundary → confirmation. This journey is separate from the old paid checkout.
- Book again: completed jobs retain their original provider/listing IDs, ordered by the existing API's job date; a refreshed provider profile checks approval and current services. Expired services require a new choice.
- Saved: favourites are hydrated through detailed provider queries before showing publicly approved providers. Failed favourite writes leave the displayed saved state unchanged.

`components/discovery` owns the shared native layouts and journey. `LiveRoute.tsx` adapts existing GraphQL contracts; `lib/discovery/model.ts` handles dates, provider/service gates, prices and receipt validation. Existing Inter, semantic colours/layout tokens, buttons, inputs, chips, callouts and loading artwork are reused. Local Figma asset sources are listed in `assets/discovery/README.md`.

Real customer routes `/search`, `/provider/[id]`, `/book-again` and the existing Saved tab use these components behind the existing session/mode guards. Home now carries the original listing into Book again. Legacy checkout routes remain available for later migration; the new Get quote action never enters them.

## Data and persistence

Confirmed existing read contracts: `nearbyArtisans`, `parseJobDescription`, `provider`, `favorites`, `bookingsForUser`. Detailed provider records validate `status === approved`, `verified`, active service IDs, known unavailable status and blocked dates. The nearby list alone does not prove approval or expose service prices. Detail requests use bounded concurrency, and failed/late responses cannot replace a newer search/profile.

Search preferences and one working request draft are versioned, bounded and scoped to the stable account ID. Native uses the existing SecureStore wrapper; web uses AsyncStorage. Drafts exclude receipt/success flags, tokens and exact-address fields. Changing a manually entered area clears old coordinates. Restoring a draft does not restore a sent screen. Storage failures are visible.

Prices are starting prices in integer minor units, not binding quotes. Missing prices stay unknown and sort last. The current `provider.available`/`blockedDates` fields do not define a complete dated availability calendar. Real results therefore describe a **preferred date**, and do not invent available-from badges, appointment slots or exact distance ordering. Location controls change the matching area; `neighbourhood`/explicitly permitted coordinates go to the existing nearby query.

## Backend connection still needed

Real **Send request** keeps the draft and reports unavailable. No suitable free targeted-request mutation has been confirmed. The existing `createBooking` opens a payment/checkout transaction and must not substitute for it.

The developer needs to provide/confirm:

1. Unpaid targeted-request creation: provider/listing IDs, job description, area, preferred local date, server-side approval/service validation and an idempotency key.
2. A stored pending-request ID/status and optional conversation ID returned by that operation, plus APIs for Pending bookings, request details and provider response.
3. Dated availability, location matching and service pricing/currency contracts. Add completed-at/pagination support to history if it must order by completion time rather than the current job-date field.
4. Messaging after a request record exists; provider confirm/decline/propose/inspection responses. Paid inspection, confirmed booking, payment and service completion remain later steps.

`confirmedRequest` rejects a missing/mismatched record. No real success is currently reachable, and no payment mutation is called by these new screens. The old checkout's customer-fee behavior is outside Step 5 and is not used by the new flow.

## Validation

`npm run check:discovery` covers impossible/past dates, local day arithmetic across DST, scoped/whitelisted drafts, provider/service gates, numeric price sorting, original Book again service IDs and stored-request proof. Also run typecheck, existing navigation/onboarding checks and ESLint on touched screens. Phone-width browser checks cover search, overlays, profile/photos/reviews, save/unsave, draft recovery, sample success and unavailable states. A local Android export checks bundle/asset compatibility; it does not replace native device checks for keyboards, GPS permissions, safe areas, accessibility and SecureStore.

Verified locally: 40 regression checks (15 navigation, 14 onboarding, 11 discovery), TypeScript, scoped ESLint with zero errors/warnings, and `git diff --check`. The Android export succeeded at `.expo/step5-android-check`. Browser checks at 393×852 and 320×740 covered clear/reset, retained search/request drafts, price sorting, work photos/review filters, persisted favourites, original Book again service selection/See more, loading/empty/error/retry and failed-send recovery. The narrow calendar/profile had no horizontal document overflow. Authenticated backend behavior and native device behavior still need testing with the developer's service and a device.
