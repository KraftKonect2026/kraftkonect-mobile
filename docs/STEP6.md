# Step 6: paid inspection journey

All edits are local. No commit, push, deployment, EAS build or OTA publication was performed.

Open [the inspection preview](http://localhost:8081/booking-preview). **States** switches customer/provider views of the same fictional record, offers Empty/Loading/Error/Save failure, and resets to stages of the sample journey. The sample checkout has explicit pending, unsuccessful and verified results. It never charges money, authenticates, writes to the backend, opens a real map or sends a real message.

## Journey and shared structure

- Provider: request → minimum/maximum rough estimate → deposit/date/time → review → stored response. Failed save retains the draft. Appointment suggestions remain unconfirmed until customer acceptance and verified deposit payment.
- Customer: request/response in Pending → schedule and exact per-visit address → deposit review → checkout boundary → pending/failed/verified result. Pending/failed payments do not book a visit or reveal the address. Verified payment moves the inspection into Active.
- Provider: confirmed visit/address → findings → explicit completion confirmation → final-quote next step. Customer sees saved findings, the completed-inspection timeline and Awaiting final quote in Active. No repair completion or labour release is implied.
- A remote-appointment sample omits the residential-address field. Unpaid cancellation/decline needs a reason and explicit confirmation; it requires no refund. Paid cancellation/refund is the Step 8 exception flow, currently explained without changing the record or promising a refund.
- Participant text messages are stored in the local sample booking and remain visible across role changes/reload. Attachment upload, real conversations, live directions and notifications remain later integration checks. Preparing the final quote is the next Step 7 screen.

`components/bookings` owns shared native layouts/list/detail screens. `lib/bookings/model.ts` contains integer money parsing, response validation, payment/term proof, address visibility, state classification and legacy read mapping. Simulator commands, sample arithmetic, storage and drafts stay in `lib/preview`; development routes are guarded by `__DEV__`. State changes are serialized, revision checked, idempotent for repeated command keys and published to both preview views only after storage succeeds. No timer creates success.

Preview drafts are role scoped and versioned, with bounded amount/date/address/findings fields; they contain no card credentials, tokens or claimed payment success. Native storage uses the existing SecureStore wrapper. The sample address is fictional. File sources and icon geometry are recorded in `assets/bookings/README.md`.

Customer Bookings and provider Jobs now share the Figma list and four stages through their existing authenticated routes. Existing `bookingsForUser`/`bookingsForProvider` reads are labelled **Legacy booking**: their `pending` status cannot establish a new unpaid request or inspection payment. Notes/descriptions are never mapped to exact addresses by this new list. The real list requires a fresh account-specific network query and has error/retry states. Legacy detail routes remain to be migrated in Steps 7–8.

The discovery preview’s Pending request and Message actions lead into this inspection journey after a matching local sample record is stored. Home Bookings/Jobs and provider request actions also open it.

## Backend contracts still needed

New request/response listing and detail; approved participant ownership; response versions and appointment availability/time zone; exact address shared only with the confirmed provider; idempotent hosted checkout tied to purpose, amount, currency, reference, booking and current terms; server/webhook payment verification; failed/unknown payment recovery; inspection findings and explicit completion mutation; persisted participant events/messages. The legacy `createBooking`/`verifyPayment` responses do not provide sufficient inspection proof and are not reused for deposits.

Provider sample fee is 5%, capped at ₦20,000. Customer deposit credit is its full gross amount. No net deposit becomes a live wallet balance here. The server must determine real fees/allocations and the combined booking cap in Step 7. Custody, refunds and allocations are unresolved production dependencies.

## Verification record

17 inspection domain checks passed: valid integer amounts, range/date/time validation, participant actions, privacy on pending/failed payments, matched purpose/amount/currency/reference/version/booking proof, Active classification, duplicate/stale writes, remote appointments, locked terms, failure recovery, findings/completion, unpaid cancellation, local messaging and legacy mapping. Existing 40 navigation/onboarding/discovery checks passed. TypeScript, scoped ESLint and diff checks passed.

Browser verification at 393×852 and 320×740 covered provider estimate validation, date selection, failed response save and retry, customer response/scheduling/address, unsuccessful deposit and retry, provider address privacy/date lock while pending, verified payment, findings and explicit completion, role switching, persisted records, remote address omission, empty/error/retry, confirmation dismissal, stored unpaid cancellation in Cancelled, local messages and discovery Send request → View pending request. The narrow completion layout had no document or action overflow. All visible inspected images loaded; the completed-inspection icons retained their approved 24px/20.8px geometry. No full-screen design render is an implementation asset.

The local Android export succeeded at `.expo/step6-android-check` (7.1 MB bundle, 129 assets). Native layout extensions and all inspection assets bundled successfully. Final caption/title refinements preserve that same component/native structure; TypeScript and scoped lint were rerun. Local frontend gate passed; proceed to Step 7. This does not close either live/backend or native-device gates.

Live/backend gate and native-device gate remain pending. Backend HTTP 503 was rechecked on 12 October 2026. Browser and local Android export do not validate native keyboards, safe areas, accessibility, SecureStore, real Paystack/webhooks or server-side entitlements/permissions.
