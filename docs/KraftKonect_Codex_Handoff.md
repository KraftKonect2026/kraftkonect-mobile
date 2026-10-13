# KraftKonect app structure and implementation handoff

Version 1.0 · 12 October 2026

KraftKonect is one service marketplace app with customer and provider modes on the same account. Customers find verified providers, request an inspection, pay the inspection deposit, receive a final quote, and pay the remaining balance through protected in-app payment. Providers manage services, requests, inspections, quotes, jobs, earnings, repayments, and payouts.

Use this document to update the existing app, alongside the current Figma design. Preserve the existing framework, backend, authentication, and integrations unless a specific requirement needs a change. Inspect the repository before choosing implementation details. The logical modules, data contracts, and internal state names below describe required behavior; they are not instructions to replace working architecture.

## Sources and authority

- Main design: [KraftKonect Figma](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=0-1). File key: `r9tDEePO6S96nPWlE2fw2c`. Main app page: `0:1`.
- Product rules confirmed by Joshua on 12 October 2026 are authoritative when older screens or discussions conflict.
- Use current Figma for layout, components, icons, typography, spacing, visible copy, and interactions. Use this document for the confirmed business rules and cross-screen behavior.
- Archived customer bookings and the page named `Not needed stuff` are not current implementation sources. The coming-soon website, main website, social media, and promotional pages are outside this app update.
- Figma screen prefixes are reused. For example, `A01` identifies different screens in different sections. Resolve a screen by section, full name, and node ID.
- Figma examples use named people, fixed amounts, old dates, and sample balances. Render real data. Do not hard-code those examples or the displayed `9:41` status bar.
- Figma prototype variables, conditions, timeouts, and navigation simulate an experience. Production payment, account, and booking outcomes must come from the backend.

### Confirmed rules that override older versions

| Topic | Current rule |
| --- | --- |
| Accounts | One identity supports customer and provider modes. |
| Sign-in | Phone number and OTP. No password, Apple sign-in, or Google sign-in in the designed flow. |
| Role switching | Offer the mode switch on Home and Account. Changing mode does not create another account. |
| Provider discovery | Required identity verification must be approved before a provider is publicly listed or bookable. |
| Inspection | The supported MVP journey includes a paid inspection before the final quote. The mistaken no-inspection sentence has been removed from `C01 · Final quote ready`. Do not implement an inspection bypass from older copy. |
| Inspection deposit | Provider sets the amount. It is credited in full against the final quote if that provider is hired and becomes non-refundable after the inspection has occurred. ₦5,000 is an example, not a fixed fee. |
| Customer payment | Protected in-app payment only. Card and bank transfer are payment methods within that flow, not direct payment to a provider. |
| Materials funds | Released immediately after the accepted quote's remaining payment is verified. Make the net materials entitlement available to the provider; it can subsequently be withdrawn through payouts. |
| Labour funds | Remain pending until the customer confirms completion. Provider marking work complete is not sufficient. |
| KK fee | 5% of job payments, capped at ₦20,000 for the whole booking. Deposit and balance share one cap. The provider bears the deduction. |
| Processing and payouts | Included in the KK fee. No additional customer protection fee or extra provider withdrawal processing fee. |
| Cancellation recovery | Recover materials funds still in the provider's app wallet. If already withdrawn, the provider must repay the amount received. Track any unpaid portion. |
| Problem reports | Reporting a problem creates a support case and does not itself cancel the job. |
| Feedback | Nonblocking banners appear at the top of the screen. |
| Loading | Use the current animated KK logo for loading states, replacing the previous loaders. |

## Instructions for Codex

1. Read repository instructions and map the current routes, auth model, backend entities, payments, and shared components before editing.
2. Read the relevant Figma section, its overlays, and its design-system components before implementing a journey. Follow node links in the appendix instead of relying on screen prefixes alone.
3. Compare the existing implementation against the requirements below. Reuse functioning services and components. Keep migrations and changes compatible with existing accounts, requests, payments, and booking history.
4. Model a booking's business state separately from payment, payout, refund, repayment, and support-case states. A cancelled booking can still have an unpaid repayment or pending refund.
5. Treat all financial amounts, entitlements, role permissions, and ownership checks as backend responsibilities. The client displays the results and requests permitted actions.
6. Use real pending, success, failure, empty, and retry states. A prototype animation finishing must never imply payment success.
7. Resolve the financial policy details listed under Implementation decisions before enabling their production money movements. Continue implementing independent UI and confirmed flows while those are resolved.
8. Verify complete customer and provider journeys, not only individual screens. Report the implemented behavior, validation performed, and remaining blockers.

## App modules and navigation

These are logical boundaries. Match them to the repository's existing structure rather than inventing a new directory tree.

| Module | Responsibility |
| --- | --- |
| App shell | Session restoration, active mode, route access, shared feedback, loading, permissions, links into records. |
| Identity and onboarding | Role choice, phone OTP, names, location, provider setup, verification, recovery, account changes. |
| Discovery | Categories, service/problem search, area/date selection, provider results, profiles, reviews, work gallery, saved providers. |
| Requests and inspections | Targeted service requests, provider responses, rough estimates, deposit checkout, appointments, findings. |
| Quotes and jobs | Final quote, acceptance, protected balance payment, confirmed work, timeline, completion, cancellations, rescheduling. |
| Payments and ledger | Verified transactions, fees, materials and labour allocations, wallet balances, refunds, repayments, bank payouts. |
| Messaging | Request/job conversations, supported attachments, support conversations, unread state. |
| Notifications | Customer and provider event feeds and push preferences. |
| Services and availability | Provider listings, pricing, photos, descriptions, selected working days, availability toggle. |
| Reviews | Completed-job reviews, edits, deletion, provider aggregates. |
| Account and lifecycle | Shared access details, privacy, legal, provider deactivation, account deletion. |
| Administration and support | Verification review, provider moderation, categories, recovery review, cases, refunds and repayment exceptions. |

Customer bottom navigation: **Home · Bookings · Messages · Account**. Saved providers, notification feed, payment history, and reviews are secondary destinations; they are not extra bottom tabs.

Provider bottom navigation: **Home · Jobs · Messages · Account**. Services, availability, earnings, verification, and payouts are secondary destinations accessible from the designed dashboard/account routes.

Switching modes preserves shared identity and existing data. If provider setup is incomplete, enter the setup-needed experience. An unverified provider can prepare services and access their setup status but cannot receive public discovery/bookings. Provider deactivation hides listings while preserving access to existing jobs, messages, and payouts.

## Onboarding and authentication

### Shared entry

1. Show the splash and current introduction treatment.
2. Let the user choose `I need a service` or `I provide services`. This chooses the initial mode.
3. Collect a phone number, including country code, and send an OTP.
4. Verify the code using the current OTP component. Handle invalid, expired, resend, network, and verification states.
5. Collect first and last name. Store the user against a stable account identifier, not against a replaceable phone number.
6. Continue the selected role's setup. Preserve incomplete setup so the user can resume.

Existing users sign in with phone OTP. If the number does not identify an account, use `A03 Account not found` and the designed registration path. Store sign-in state securely through the existing auth system. A session-expired state routes to sign-in without misreporting pending financial operations as failed.

### Customer setup

Ask for a default service area using device location or manual entry. Device location is optional because manual entry exists. The default area supports matching; it is not a saved residential address. Collect the precise appointment address per job later.

### Provider setup

Collect the main work type, selected working days, primary service area or remote-work choice, provider/business profile, short introduction, profile/work photos, and first service. A service contains a name, photo, short description, and starting price.

Provider identity verification requires a government-issued ID and selfie. Users may defer submission and continue preparing their profile/service, but approval remains mandatory for listing. The setup-complete and verification-pending screens must not imply the provider is already publicly available.

Use explicit verification states such as not submitted, under review, approved, and changes required/rejected, mapped to the existing backend. ID and selfie files remain private. Customers see the verified status and approved public identity/profile details, not verification documents.

Provider account-name changes require an ID review. Keep the existing approved name until the replacement is approved. A business display name and the verified individual's bank-account name are separate fields.

## Customer discovery and requesting a service

### Home and search

Home includes a problem/service search field, category shortcuts, small Book again cards, and recommended providers. Match the current card imagery, favourite icon, ratings, and verified treatment to Figma. Historical and recommendation sections use real account data; do not fabricate bookings to fill them.

The search experience is a full-screen stepper with **What → Where → When**, a close control, and Clear all. Preserve previously entered values when moving between steps. Search lets a customer describe a problem or select a known service, choose an area, and choose a date.

Available providers show the relevant service, area, availability, starting price, rating, and verification status. Support the designed service, date, location, and price controls/overlays. Prices shown as `From` are starting prices, not binding final quotes. Do not promise exact geographic distance sorting from the location overlay unless the backend provides that capability.

A provider profile contains public identity/business information, services, starting prices, work photos, rating/reviews, and a Get quote action. Saved providers use a real favourite state. The photo viewer and reviews overlay are separate presentations of the same provider data.

### Targeted request

1. Choose a provider and service.
2. Enter the job description, area, and preferred date.
3. Review the request and send it to that provider.
4. Show success only after the request is stored. Failed sends preserve the draft and offer retry.
5. Display the request in Bookings and allow its conversation to open.

The request is targeted to one provider. `H06 Review direct provider request` means a request sent directly to that provider; it does not mean direct payment. No money is charged merely for sending a request. Messaging begins once the request exists; do not require an inspection payment before the customer can discuss it.

Before confirmation/payment, expose the area rather than the precise appointment address to the provider. Collect and share the exact address in the inspection confirmation journey. Remote work must not unnecessarily require a residential visit address; preserve the current repository's remote-service handling and resolve any missing design variant.

Book again opens a fresh request using the previous provider/service as a starting point. Recheck current listing, verification, price, and availability.

## Requests and paid inspections

### Provider response

The provider reviews the request, messages the customer if needed, declines, or responds with a rough minimum/maximum estimate, inspection deposit, and proposed appointment. Validate a coherent price range and non-negative financial inputs using server rules.

The response review shows the customer's proposed terms and the provider-only fee/net breakdown. Sending it changes the request to awaiting customer action and notifies the customer. A rough estimate is not the final job price.

### Customer inspection confirmation

The standard sequence is:

`A03 · Tobi’s response` → `B01 · Schedule inspection` → `B02 · Pay for inspection` → secure payment checkout/verification → `B03 · Inspection confirmed` → `B04 · Your inspection`.

The customer agrees on the inspection date, supplies the appointment address, reviews the deposit, and pays using supported card/bank-transfer checkout. Keep pending payment separate from confirmed inspection. Show the agreed appointment and amount from current data, even where Figma sample dates differ between screens.

Paying the inspection deposit confirms the visit. It does not book the repair or authorize repair work. The deposit is credited in full if the customer hires the same provider. It becomes non-refundable after the inspection occurs. Cancellations before inspection follow the applicable refund outcome; do not label all deposits non-refundable from initial request creation.

### Inspection completion

The provider opens the inspection visit, views the confirmed address/directions, and marks the inspection complete through confirmation. Save the findings and notify the customer. The provider prepares a final quote next. The customer sees Waiting for final quote.

The customer Bookings screen has **Pending · Active · Completed · Cancelled**. In the current design, paid inspections and inspections awaiting a final quote are in **Active**, with the relevant label. Consequently, the Active tab includes the inspection stage as well as confirmed repair work; a single boolean `isRepairBooked` must not drive every tab.

## Final quote and protected payment

The final quote includes the agreed scope, materials cost, labour cost, full job price, inspection-deposit credit, remaining amount due, proposed work appointment, and estimated duration. Persist the accepted terms/version so later listing edits cannot rewrite an existing booking.

The supported sequence is:

`PI04 · Prepare final quote` → `PI05 · Review final quote` → `PI06 · Final quote sent` → customer `C01 · Final quote ready` → `C02 · Payment details` → `C03 · Review protected payment` → secure checkout/verification → `C04 · Booking confirmed`.

The remaining payment is the final quote less the gross deposit already paid. Customer payment screens show the service amount without an extra KK protection fee. Fee/net information belongs in the provider's earnings and quote views.

Protected payment is the only customer payment route. Card and bank transfer are methods offered by the payment integration. Remove obsolete direct-to-provider payment selections. Use the established Paystack integration and its supported secure checkout; do not collect PINs, OTPs, or raw card credentials in ordinary app forms or chat. Saved-card UI must use the existing payment provider's token/authorization handling.

Current Figma does not fully specify the payment provider's card authorization/bank-transfer internals. Implement those through the existing secure checkout rather than inventing account details or treating the design's Confirm button as payment success. The app's protected-payment promise must be backed by the configured custody/release integration; this document does not assert that a particular gateway configuration provides escrow automatically.

Once the balance payment is verified, confirm the repair booking and immediately release the provider's net materials entitlement into available funds. Keep the unreleased labour entitlement pending until customer completion confirmation. A subsequent withdrawal is a payout operation, separate from the release of materials into the wallet.

## Fees and financial accounting

All money must be stored as integer minor units, with an explicit currency. The current design uses NGN. The cap is ₦20,000, or 2,000,000 kobo. Keep a transaction ledger so charged, credited, released, recovered, refunded, and paid-out funds remain traceable to their booking and payment.

### Booking fee calculation

For settled, non-refunded customer payments on one booking:

```text
booking_fee_target = min(round_currency(booking_gross_paid * 0.05), 20000 NGN)
fee_for_new_payment = booking_fee_target - fee_already_assessed_for_booking
provider_net_for_payment = payment_gross - fee_for_new_payment
```

Use one consistent rounding policy in minor units. The example formula describes successful charges before any refund/fee reversal; refund adjustment policy is a separate decision. Never reset the cap for the remaining payment or for each release.

| Example | Customer payment | Fee | Provider net |
| --- | ---: | ---: | ---: |
| Inspection on a ₦90,000 job | ₦5,000 | ₦250 | ₦4,750 |
| Remaining payment on that job | ₦85,000 | ₦4,250 | ₦80,750 |
| Whole booking | ₦90,000 | ₦4,500 | ₦85,500 |
| Whole ₦500,000 booking | ₦500,000 | ₦20,000 | ₦480,000 |

The customer receives the full ₦5,000 deposit credit, even though the provider's net deposit is ₦4,750. Deduct the deposit once. Likewise, assess the fee once; splitting money into materials/labour or moving it to a bank must not charge it again.

Do not independently pay the full net inspection deposit, full net materials, and full net labour if their sum exceeds the booking's provider entitlement. Decide how the inspection credit and booking-level fee are allocated across materials/labour, then reconcile all releases to the ledger. That allocation is not fully specified by the screens; see Implementation decisions.

### Wallet and payouts

Keep available funds, pending labour/release funds, repayment debt, and reserved/processing payouts distinct. A headline balance must not count the same money as both available and awaiting release.

The earnings area shows available funds after fees, awaiting release, materials repayments, payment activity, and reports. Reports support Week, Month, Year, and All time, distinguishing gross materials, gross workmanship, assessed KK fees, and net released amounts.

Payout accounts must be verified through the banking/payment integration. The account holder must match the provider's approved identity name. Bank selection supports search, result, empty, failed lookup, and name-mismatch states. Adding a bank account does not authorize debiting that bank account.

For a payout, enter an amount within the spendable balance, review the verified destination, confirm through the established authorization path, reserve the funds, submit, and reflect pending/succeeded/failed results. No extra processing or withdrawal fee is added. A pending bank transfer must not immediately show Payout completed. Failed transfers release or reconcile the reservation according to the actual integration outcome.

## Work and completion

The confirmed job shows customer, service, appointment, exact address/directions, job price, messaging, timeline, cancellation, and problem reporting.

Provider flow: `PX01 · Your confirmed job` → `PX02 · Work in progress` → confirmation to mark work complete → `PX03 · Waiting for confirmation` → `PX04 · Job completed` after customer confirmation and the relevant backend update.

Customer flow: `E02 · Your booking` → `E03 · Job timeline` → `F01 · Is the work complete?` → explicit completion confirmation → `F03 · Job completed` → optional review.

The provider records that work is finished. The customer checks the agreed work and either confirms completion or reports a problem. Completion confirmation authorizes the remaining protected labour release. A provider cannot confirm on the customer's behalf, and a timeout/animation cannot substitute for confirmation.

The current customer success screen says payment release was requested, while the provider completed view says funds are available. Reflect the real release status: work can be completed while release is processing. Show available funds only after the ledger credits them. No automatic release deadline for a silent customer is finalized in this design; leave that to explicit support/policy handling.

Completed bookings preserve the accepted quote, timeline, receipt/payment history, and review entry. Completion does not erase support or payment records.

## Scheduling and availability

Providers choose selected working days and can switch Available/Unavailable. Pausing new requests does not cancel or reschedule existing commitments. The current availability screens emphasize working-day selection; do not infer a detailed capacity model or time-slot engine solely from the sample calendar.

The provider can propose a changed appointment through the designed date flow. The customer can accept the new date or retain the current appointment and discuss another. A proposal is distinct from a confirmed schedule change. Update both roles and the timeline only after acceptance, and notify the other participant. Apply the same ownership checks to inspection/work appointment changes.

## Cancellation and materials repayment

### Customer cancellation

From the request/inspection/booking context, open the relevant cancellation flow. Require a listed reason or a free-text reason, show the confirmation and financial consequences, and preserve the booking if the customer backs out.

After cancellation, move the record to Cancelled and show the refund status. `MC04 · Refund review` explicitly supports In review and Refund amount not confirmed. Do not promise that the full remaining payment has already been returned when support or gateway processing is still pending. An inspection that already occurred remains non-refundable under the confirmed rule.

### Provider cancellation

Entry: `PX01 · Your confirmed job` → `PC01 · Cancel job` → `PC02 · Confirm job cancellation` → `PX05 · Job cancelled`.

Provider reasons include the agreed time no longer working, inability to complete the job, a safety concern, inaccurate job details, or a free-text alternative. Require a reason and explicit confirmation. Explain the customer's refundable payment and any materials recovery before confirmation. Notify the customer and move the job to Cancelled.

### Recovery of materials funds

The provider must return net materials funds already received for the cancelled job. The fee already deducted from that material release is excluded from the provider's repayment amount; use the actual ledger allocation, not a fresh 5% calculation that could ignore a reached booking cap.

- Materials still in the app wallet: recover the applicable amount internally when cancellation is processed, as Joshua confirmed. Keep that amount from being withdrawn concurrently.
- Materials already withdrawn: create a repayment obligation and let the provider pay through Paystack card/bank transfer or repay from an available app balance.
- Partly available/partly withdrawn: recover only the available recoverable amount and track the unpaid remainder. Never debit the same amount twice.
- Existing design for an unpaid obligation: show a 24-hour repayment notice and perform the displayed automatic deduction from available app balance if still unpaid. This notice concerns an outstanding obligation, not a reason to delay recovering materials already present at cancellation.
- If the balance cannot cover the obligation, show the Paystack route and preserve the outstanding debt. Do not treat an added payout bank account as permission to pull funds from that bank.
- Manual repayment, automatic recovery, and webhook confirmation all settle the same obligation. Stop future deductions after settlement.
- `Question this repayment` opens support with the job and financial details attached. The support case does not silently mark the obligation paid.

Keep customer refund processing and provider debt recovery as separate linked operations. A cancelled booking is not proof that either is settled. Refund amount, treatment of partially completed labour, and platform fee reversal must follow the applicable policy/support decision.

## Problem reporting and support

Customers can report from a booking or from the incomplete-work path. Collect what happened, timing, desired help, and an optional supporting photo. Create a case with a reference, attached booking, description/evidence, and review status. The case shows received, under review, and outcome updates, with a Message support action.

Provider flow: `PX01` → `PR01 · Report a job problem` → `PR02 · Describe job problem` → `PR03 · Provider support case` → `PR04 · Message support about job`.

Provider issue categories are customer unavailable, changed job details, payment/materials problem, safety/inappropriate behaviour, and something else. The provider case retains the job reference and explicitly states that the job remains active. Cancelling requires the separate cancellation action.

Support conversations are associated with the case where applicable. Include only authorized booking/payment details. Display warnings about sharing PINs or full card details as designed. Do not display one participant's private verification files or unrelated messages to the other.

Reporting and cancelling are separate actions. Whether a specific unresolved report blocks a release is a server/support policy decision, not an automatic consequence of any Report tap.

## Messaging and notifications

Request and active-job conversations use the shared messaging components, job/service context, timestamps, unread/read status supported by the backend, composer, and supported photo attachments. Both parties can reach the associated request/booking. Conversation search, empty messages, and failures are part of the flow.

Only authorized participants and support roles can access a conversation. Switching app mode changes presentation, not message ownership. Keep support and customer-provider conversation contexts distinguishable. Any prototype `Changes saved` toast hidden inside chat screens is not a message that should always appear on entering them.

### Notification events and destinations

| Event | Recipient | Destination |
| --- | --- | --- |
| New targeted request | Provider | Request details and response actions |
| Request response/rough estimate | Customer | Provider response and inspection steps |
| New message | Other participant | Relevant conversation |
| Inspection deposit confirmed | Provider and customer | Inspection details and appointment |
| Inspection complete | Customer | Inspection status; waiting for final quote |
| Final quote needed | Provider | Prepare final quote |
| Final quote sent | Customer | Final quote review |
| Quote accepted and balance confirmed | Provider and customer | Confirmed job |
| Date proposed/accepted | Other participant | Appointment proposal or updated job |
| Provider marked work complete | Customer | Work review and completion confirmation |
| Labour payment released | Provider | Payment activity/earnings |
| Job cancelled | Other participant | Cancelled booking/refund/repayment status |
| Materials repayment due/settled | Provider | Specific repayment record |
| Payout completed/failed | Provider | Payment activity |
| Verification decision | Provider | Verification status/setup |
| Support case update | Authorized case participant | Support case |

The provider feed is `Notifications provider · UPDATED 11 OCT`. Reuse customer feed patterns but present provider actions and destinations. Support date grouping, unread presentation, and empty states. Generate notifications from persisted events so retries cannot send duplicates or point at nonexistent records.

Push preferences include request responses, messages, booking updates, payments, reviews/reminders, and optional product news for customers, plus the provider settings shown in Figma. Push preference changes must not prevent required in-app status/financial records from being accessible.

## Services and reviews

Providers can create, view, edit, publish, and delete services through My services. Service fields are name, service photo, short description, and starting price. Verification and provider lifecycle status govern public visibility. Listing changes do not rewrite accepted booking terms. Confirm destructive service deletion and preserve booking/payment history that refers to the service.

Known categories support discovery. Free-form service names/descriptions must remain usable without falsely claiming that every entered name already exists in the taxonomy. Category moderation and assignment for previously unknown services must use the existing backend/admin approach; the current screen set does not fully define that workflow.

Only the customer for a completed booking can submit its review. Reviews include a star rating and optional/required text according to the existing form validation. Users can skip the immediate review prompt and reach Your reviews later. Editing saves updated rating/text; deletion requires confirmation and updates the provider's aggregate rating. Cancelling edits can use the discard-confirmation overlay. Keep one review per eligible booking under the existing data model.

## Account changes and recovery

### Account settings

Customer settings include profile, default area/location privacy, notification preferences, payments/saved cards, payment history/receipts, help/support, legal pages, sign-out, and provider setup/mode switching. There is no saved home-address collection; appointment addresses belong to jobs.

Provider settings add business/provider profile, identity verification/documents, provider notification preferences, availability, and provider deactivation. Personal sign-in/recovery details are shared across both roles.

Change phone through current-number verification, a new number, and new-number OTP. Adding/changing a recovery email requires verification. Reject a new phone already attached to another account. Preserve the stable account ID and all associated records when contacts change. Use the account-recovery route when the user cannot verify their old phone.

### Lost phone access

1. Choose recovery email if an already verified recovery email is linked to the account. Verify its code.
2. Otherwise, find the previous account using old phone and full name.
3. Where previous identity verification exists, compare an appropriate new ID capture or selfie against that account's prior verification. Where manual review is required, keep access locked and show Recovery review pending.
4. If that route is unavailable/does not work, use four recent-activity multiple-choice questions. At least three of four correct is required. More than one incorrect answer stops automatic recovery and routes to support.
5. Following successful ownership verification, enter a new phone not owned by another account and verify its OTP.
6. Recover the same account with jobs, messages, reviews, and provider data intact; return to its relevant mode/home.

Questions and scoring are generated/checked by the server, never using Figma's sample answers as real challenges. Enforce attempt controls through the existing security policy and do not reveal correct answers on failure. If the account lacks sufficient history, do not fabricate activity questions; use support review.

## Provider deactivation and account deletion

Provider deactivation hides the profile/services and stops new requests while keeping the customer account active. Existing commitments, messages, repayments, and pending payouts remain accessible. It does not cancel accepted jobs. Reactivation is available from account controls, subject to the normal verification/moderation gate.

Account deletion affects both roles. Show the implications, perform ownership verification, and require final confirmation. Once requested, start a 30-day notice, hide the profile, and sign the user out. Final deletion takes place after the notice and settlement of open jobs, refunds, repayments, and other obligations. Retain records the existing retention policy requires; delete personal data no longer needed.

The deletion flow specifically describes refunding customers for active provider jobs and recovering materials money from the provider. Process these through the same cancellation/refund/repayment services, not a separate balance-reset routine. Because the user is signed out, support must retain an authorized path for settlement and deletion updates.

The current design does not define a self-service reversal of a deletion request during the notice period. Do not silently add or promise it.

## Booking states and permissions

The following internal names are an implementation model. Map equivalent existing enum names to them rather than renaming a working backend without need. UI tab placement follows the current design and may show several internal states in one tab.

| Logical state | Trigger | Customer view | Provider view/action |
| --- | --- | --- | --- |
| Request sent | Stored targeted request | Pending, awaiting response | Requests, review/message/respond |
| Inspection response ready | Provider sends rough estimate/visit terms | Pending, review response | Awaiting customer |
| Inspection payment pending | Checkout initiated, not verified | Awaiting payment result | Do not treat inspection as paid |
| Inspection scheduled | Deposit verified and terms stored | Active, inspection scheduled | Inspection visit and confirmed address |
| Inspection complete | Provider confirms inspection/findings | Active, waiting for final quote | Prepare final quote |
| Final quote ready | Provider sends quote | Active, review/accept/pay | Awaiting acceptance/payment |
| Balance payment pending | Accepted quote enters checkout | Active, confirming payment | Repair still not authorized to start |
| Job confirmed | Remaining payment verified | Active, confirmed work | Confirmed job; net materials available |
| Work in progress | Persisted work update under existing model | Active, timeline | Work timeline/mark complete |
| Awaiting completion confirmation | Provider marks work finished | Active, confirm or report | Waiting for customer; labour pending |
| Completed | Customer confirms agreed work | Completed, receipt/review | Completed; release processing or available according to ledger |
| Cancelled | Authorized cancellation recorded | Cancelled, refund status | Cancelled, recovery/repayment status |
| Declined request | Provider declines pre-booking request | Closed request/status under existing mapping | Removed from actionable request list |

Support-case, refund, payout, repayment, and release statuses run alongside booking state. Do not turn `support_case = under_review` into `booking = cancelled`, or `booking = completed` into `payout = succeeded`.

Key permissions: only the selected provider responds/quotes/marks its work complete; only the booking customer accepts/pays/confirms their work; each role can cancel/report where the current state permits; only verified eligible providers are bookable; only the owning provider can withdraw their available funds; only authorized support/admin roles can review identity, recovery, financial exceptions, and cases.

## Required backend records and events

These are logical data contracts, not a mandated schema or database choice.

| Record | Minimum useful information |
| --- | --- |
| Account | Stable ID, phone verification, optional verified recovery email, names, active mode, default area, lifecycle status |
| Provider profile | Account ID, business/public profile, work type, service area/remote status, gallery, availability, verification and moderation status |
| Verification request | Private document references, review state, approved identity name, audit metadata |
| Service | Provider, category association where known, name, description, photos, starting price, listing state |
| Request/booking | Customer, provider, service snapshot, description, area, private address after confirmation, preferred/agreed dates, lifecycle state |
| Inspection | Proposed/confirmed appointment, gross deposit, payment reference, findings, completion timestamp |
| Quote | Version, scope, gross materials/labour/total, deposit credit, remaining due, duration, date, sent/accepted timestamps |
| Payment | Purpose, booking, amount/currency, external reference, authoritative state, fee assessed, verification metadata |
| Ledger allocation | Gross/net entitlements by booking/component, fee attribution, release/recovery entries, reservations, audit trail |
| Repayment/refund | Booking, reason, amount approved/due, recovered/paid/outstanding amounts, status, deadline where applicable, external references |
| Payout | Provider, verified bank reference, amount, reservation, processing/result states |
| Conversation/message | Participants, booking or support context, text/attachment references, delivery/read/unread metadata |
| Notification | Recipient, event reference, role/context, destination record, read state, created time |
| Support case | Reporter, booking, category, description/evidence, status, case conversation, outcome |
| Review/favourite | Owner, eligible booking/provider, rating/text or saved state, timestamps |
| Lifecycle request | Account, deactivation/deletion state, requested/finalization dates, settlement dependencies |

Persist state changes and emit their notifications consistently. External payment callbacks, retries, wallet recovery jobs, and user actions need idempotency: the same operation must not create duplicate fees, payouts, releases, refunds, repayments, or notifications.

Keep accepted quote versions immutable, authorize server-side access to every record, and reconcile asynchronous payment outcomes. If a client loses connection after an actual successful payment, retrieve the authoritative result rather than creating another charge or permanently marking the booking failed.

## Design system and system feedback

Use the current KK design-system pages for foundations, branding, icons, icon controls, buttons, fields, OTP, selection, navigation, provider/service cards, ratings/reviews, feedback, bottom sheets, price actions, layouts, utilities, categories, calendar, choice cards, uploads, search rows, booking cards, timeline/detail rows, avatars, toggles, messaging, notifications, empty states, request cards, and dashboard metrics. Primary brand colors are `#225EE1` and `#FFFFFF`; obtain the full token values from Figma.

Reuse a small set of shared components for buttons, inputs, OTP, cards, sheets, confirmation dialogs, chat, notification rows, feedback, and loading. A different screenshot/sample state should normally be the same component/route with different data, not a duplicate implementation. Preserve proper vector icons rather than replacing them with text or emoji.

Top banners cover offline, save/upload/validation failures, invalid/expired/resend codes, payment failures, payout results, bank verification/mismatch, repayment failures, request failures, listing publication, cancellation, declined responses, date proposals/acceptance/decline, saved changes, and unavailable legal pages. Place them under the device safe area and above content as designed. Use relevant dynamic copy, and do not show hidden prototype success text by default on every screen.

Use the KK logo loading animation for payment verification, payout submission, repayment confirmation, request submission, and other loading contexts that previously used an old loader. The five prototype phases illustrate the animation; they are not a five-step business process or a forced wait before success. Continue only when the real operation reaches its appropriate state. Respect the app's accessibility and reduced-motion handling.

Full-screen/overlay session-expired and notification-permission prompts are distinct from nonblocking toast feedback. Preserve form values on recoverable failures, disable duplicate submissions while an action is pending, and allow meaningful retry after failure.

## Implementation decisions and inconsistencies

These details need a concrete policy or a verified existing implementation before their affected production actions are enabled. They do not change the confirmed rules or prevent independent UI work.

| Detail | Required treatment |
| --- | --- |
| Inspection credit across materials/labour | Choose and document how the already paid/released inspection deposit reduces subsequent materials/labour entitlements. Ensure total releases cannot exceed provider net booking payment. The deposit is credited in full to the customer. |
| Fee allocation across releases and cancellations | Preserve the shared cap and actual assessed fee. Define refund/fee-reversal allocation and how a customer's approved gross refund is funded when provider recovery excludes fees. Do not solve the gap by silently adding a customer fee. |
| Partial work and cancellations | Use support/refund review for unsettled work and amounts. Establish the final refund rules for completed inspection, spent materials, partial labour, and provider-caused cancellation. Wallet recovery itself follows the confirmed rule. |
| Repayment debt and payout eligibility | Prevent concurrent withdrawal of funds being recovered. Define treatment of later wallet credits, insufficient balances, overdue debt, and reservations using the existing backend policy. |
| Nonresponsive customer or disputed completion | No automatic labour-release timer is confirmed. Support/policy must define exceptional release; do not invent one from prototype timeouts. |
| Unknown services and remote jobs | Confirm taxonomy assignment/moderation and the remote appointment/address variant against the existing code. Preserve supported manual text and remote setup. |
| Verification updates or suspension | Confirm listing/payment behavior during replacement-document review or moderation. Pending initial verification is definitely not publicly bookable. |
| Customer checkout UI | Use real secure payment checkout. A previously discussed `PX09` checkout screen was not found in the current main App-page inventory; do not depend on that obsolete identifier. |
| Inconsistent sample money | `PX05 · Job cancelled` currently shows ₦45,000 materials, a ₦5,000 deducted fee, and ₦40,000 repayment; this does not establish a valid 5% calculation. Compute from the ledger. |
| Quote fee labels | `PI04` shows the whole-job fee/net while `PI05` shows remaining-payment fee/net. Both can be valid if explicitly labelled; do not mix their scopes. |
| Old terminology/layer names | Some repayment overlays say processing fee where the current rule is an inclusive KK service fee; some layers retain old amounts such as `Pay ₦93,000 & book`. Implement current visible intent and confirmed formulas, not stale layer labels. |
| Availability and tabs | Earlier discussions mentioned date blocking and Accepted jobs. The current screenshots use selected working days and provider Requests/Active/Completed/Cancelled states. Do not infer additional workflows without an applicable current screen/backend requirement. |

## Verification and acceptance criteria

Use the repository's existing testing tools. Favor integration checks for state, permission, and financial invariants, plus a small number of full journey tests. The scenarios below are expected behavior, not instructions to write tests that merely mirror every UI element.

| Scenario | Required result |
| --- | --- |
| One account switches modes | Identity, history, contacts, and messages remain linked to the same account. |
| Unverified provider creates a service | Service/setup is saved; provider is absent from customer results and not bookable. |
| Customer denies location permission | Manual area entry remains usable. |
| Customer sends a request | No immediate charge; request and conversation exist; provider can respond. |
| Customer only pays inspection deposit | Visit is scheduled under Active; repair remains unbooked. |
| Inspection is completed | Findings persist; customer waits for final quote; deposit is non-refundable under the rule. |
| Quote is accepted but checkout fails | Repair is not payment-confirmed; no materials are released; safe retry remains available. |
| Balance checkout succeeds | One booking confirmation and materials release; labour remains pending. |
| ₦90,000 booking with ₦5,000 deposit | Customer total is ₦90,000; total fee is ₦4,500; provider net total is ₦85,500. |
| Booking exceeds fee-cap threshold | Sum of assessed fees across deposit/balance is at most ₦20,000. |
| Material/labour allocation | Already released deposit plus subsequent releases reconcile to provider net entitlement. |
| Duplicate successful callback | No duplicate wallet credit, charge, fee, booking, or notification. |
| Provider marks work complete | Customer receives review prompt; labour stays pending. |
| Customer confirms completion | Completion persists; remaining release is requested/credited according to actual outcome. |
| Customer reports incomplete work | Case is linked; job is not automatically cancelled or falsely completed. |
| Either role backs out of cancellation | Booking and financial state remain unchanged. |
| Provider cancels with materials in wallet | Recover available applicable materials funds atomically; customer is notified. |
| Provider cancels after withdrawal | Create the actual unpaid repayment obligation and display repayment routes/status. |
| Repayment happens before the 24-hour job | Mark debt settled; the scheduled job makes no duplicate deduction. |
| Cancellation races with payout | Reserved/recoverable money cannot be spent or recovered twice. |
| Payout bank name does not match | Reject/require correction; do not make it a verified payout destination. |
| Payout fails or is pending | Funds/result reconcile correctly; no false completed payout or extra withdrawal fee. |
| Date change is only proposed | Current appointment remains authoritative until acceptance. |
| Provider pauses availability | New request eligibility changes; existing bookings remain accessible. |
| Provider reports a problem | Correct case and support chat open; job remains active. |
| Recovery scores two of four | Automatic recovery stops; support route appears. |
| Recovery scores three of four | Ownership step can proceed under the security policy; new phone still requires OTP. |
| Recovery phone belongs to another account | Reject replacement and preserve both accounts. |
| Review edited/deleted | Booking eligibility and ownership enforced; provider aggregate updates correctly. |
| Provider deactivates | Listings hidden; customer mode and existing provider commitments remain usable. |
| Account deletion requested | Both-role profile hidden, sign-out and 30-day notice; settlement gates final deletion. |
| Top feedback and KK animation | Matches current Figma; feedback does not appear by default; loading outcome follows real server state. |
| Network drops after successful payment | Reconciliation finds the successful transaction without charging again. |

## Suggested implementation sequence

1. Audit existing routes, models, integrations, components, and migration needs. Record gaps against this handoff.
2. Align shared identity, role switching, onboarding, provider verification gates, design tokens, banners, and KK loading.
3. Implement discovery, provider profiles, saved providers, targeted requests, and request conversations.
4. Complete provider responses, inspection checkout, appointments, findings, and final quote versioning.
5. Resolve allocation policy and implement protected balance payment, shared fee cap, materials release, and held labour.
6. Complete job timelines, completion confirmation, review eligibility, date proposals, and both-role notification feeds.
7. Implement cancellations, wallet recovery, outstanding repayments, support cases, bank verification, and payouts with concurrency checks.
8. Complete account changes, recovery, deactivation, deletion, empty/error states, and end-to-end regression checks.

## Figma section map

| Section | Purpose | Link |
| --- | --- | --- |
| Onboarding | Role, identity, location, provider setup | [333:9063](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=333-9063) |
| Authentication and Account Recovery | Sign-in and lost-phone recovery | [425:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=425-2) |
| Customer Home and Service Request | Search, profiles, targeted requests | [428:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-2) |
| Customer Messages and Account | Chat, settings, favourites, reviews, contact changes | [459:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-2) |
| Customer Bookings Completion and Support | Inspection, quote/payment, work, cancellation, support | [1003:2656](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1003-2656) |
| Provider Home Requests and Responses | Dashboard, requests, inspections, quotes, work, cancellation/support | [469:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-2) |
| Provider Services | Listing create/edit/delete | [485:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-2) |
| Provider Earnings and Payouts | Ledger UI, repayment, bank accounts, payout | [487:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=487-2) |
| Provider Account and Settings | Identity, documents, contacts, availability | [488:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-2) |
| Account Deletion and Provider Deactivation | Both-role deletion and provider-only deactivation | [1386:8025](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8025) |
| System states payments and recovery | Loading, session expiration, permissions | [1539:7673](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7673) |
| Toast feedback | Current top banners | [1587:9092](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9092) |
| KK logo loading animation | Current animation phases | [1625:8689](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8689) |
| Design system start | Component library entry point | [846:2](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=846-2) |

## Screen reference appendix

The following index lists current screen/state nodes and overlays from the main app sections. Duplicate-looking nodes can represent sample states or duplicated canvas screens; deduplicate routes/components based on behavior. Names are copied from Figma, including existing spelling and labels. Connector frames and update-label decorations are omitted.


### Onboarding Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| Splash screen | `332:8980` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=332-8980) |
| Intro inforgraphics | `360:9131` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=360-9131) |
| 01 Choose role | `340:27` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=340-27) |
| 02 Phone number · UPDATED 07 OCT | `340:53` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=340-53) |
| 03 Verify phone | `340:75` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=340-75) |
| 04 Your name · UPDATED 07 OCT | `340:104` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=340-104) |
| 05 Customer location | `340:122` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=340-122) |
| 06 manual location · UPDATED 07 OCT | `380:9344` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=380-9344) |
| 07 Provider work type · UPDATED 07 OCT | `342:2` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-2) |
| 08 Provider service area · UPDATED 07 OCT | `342:36` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-36) |
| 09 Provider profile · UPDATED 07 OCT | `342:63` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-63) |
| 13 Verification intro | `342:83` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-83) |
| 14 Verification documents | `342:111` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-111) |
| 15 Verification pending | `342:131` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-131) |
| 10 First service basics · UPDATED 07 OCT | `342:158` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-158) |
| 09A · Profile gallery · UPDATED 07 OCT | `342:206` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-206) |
| 12 Provider setup complete | `342:241` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=342-241) |


### Authentication & Account Recovery Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| A01 Sign in · UPDATED 07 OCT | `425:5` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=425-5) |
| A02 Sign-in code | `425:38` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=425-38) |
| A03 Account not found | `425:76` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=425-76) |
| R06A Recovery review pending | `501:71` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=501-71) |
| R01 Choose recovery method | `524:37` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=524-37) |
| R02 Recovery email · UPDATED 07 OCT | `528:2` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-2) |
| R03 Verify recovery email | `528:35` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-35) |
| R04 Find account by identity · UPDATED 07 OCT | `528:72` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-72) |
| R05 Identity verification options | `528:105` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-105) |
| R06 Verify previous identity | `528:134` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-134) |
| R07 Recent account activity | `528:166` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-166) |
| R08 Activity check failed | `528:207` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-207) |
| R09 New phone number · UPDATED 07 OCT | `528:235` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-235) |
| R10 Verify new phone | `528:264` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-264) |
| R11 Account recovered | `528:301` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=528-301) |
| R06B · Contact recovery support | `1605:8510` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1605-8510) |


### Customer Home & Service Request Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| C03 Search service · What · UPDATED 07 OCT | `428:176` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-176) |
| C04 Search service · Where · UPDATED 07 OCT | `428:219` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-219) |
| C05 Search service · When | `428:255` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-255) |
| C06 Available providers | `428:333` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-333) |
| C06A Available providers · Change service · UPDATED 07 OCT | `734:2` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=734-2) |
| C06B Available providers · Change date | `734:124` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=734-124) |
| C06C Available providers · Sort by price | `747:2` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=747-2) |
| Available providers · Sort by location | `1620:9277` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1620-9277) |
| H03 Provider profile · Tobi Plumbing | `753:379` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=753-379) |
| H05 Book provider · Tobi Plumbing 1 | `753:473` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=753-473) |
| H05 Book provider · Tobi Plumbing 2 · UPDATED 07 OCT | `827:1426` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=827-1426) |
| H06 Review direct provider request | `753:507` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=753-507) |
| H07 Request sent to provider | `753:541` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=753-541) |
| H03A Provider reviews overlay | `793:2` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=793-2) |
| Work photo viewer | `809:4` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=809-4) |
| C10 Book again | `826:65` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=826-65) |
| C01 Customer home · UPDATED 07 OCT | `428:5` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-5) |


### Customer Messages & Account Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| M01 Messages · UPDATED 07 OCT | `459:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-3) |
| M02 Active job chat | `459:85` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-85) |
| M03 Request conversation | `459:123` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-123) |
| M04 Empty messages | `459:159` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-159) |
| A01 Account | `459:231` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-231) |
| A02 Edit profile | `459:321` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-321) |
| A03 Location & privacy | `459:354` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-354) |
| A04 Notifications | `459:395` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-395) |
| A05 Payments | `459:451` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-451) |
| A06 Help & support | `459:492` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-492) |
| Legal | `459:550` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-550) |
| A09 Provider setup needed | `459:619` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-619) |
| A10 · Sign out · Overlay | `459:665` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=459-665) |
| M07 · Search conversations | `1146:3969` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1146-3969) |
| A11 · Add payment card · UPDATED 07 OCT | `1148:4468` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4468) |
| A12 · Payment history · UPDATED 07 OCT | `1148:4478` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4478) |
| A13 · Payment receipt · Overlay · UPDATED 07 OCT | `1148:4488` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4488) |
| Message support | `1148:4498` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4498) |
| A16 · Changes saved · Overlay | `1148:4518` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4518) |
| A17 · Change default area · UPDATED 07 OCT | `1148:4528` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1148-4528) |
| D08 · Saved providers | `467:381` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=467-381) |
| D09 · Empty saved | `467:458` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=467-458) |
| D10 · Notifications | `467:505` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=467-505) |
| D10B · No notifications · UPDATED 07 OCT | `1162:5610` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1162-5610) |
| D17 · Your reviews | `467:798` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=467-798) |
| D17A · No reviews yet | `1162:5620` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1162-5620) |
| D17B · Edit review | `1178:4912` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1178-4912) |
| D17C · Delete review · Overlay | `1178:4922` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1178-4922) |
| D17D · Discard review changes · Overlay | `1178:4923` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1178-4923) |
| CA01 · Your account | `1384:7219` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7219) |
| CA02 · Confirm current phone · UPDATED 07 OCT | `1384:7252` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7252) |
| CA03 · Change phone number | `1384:7285` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7285) |
| CA04 · Verify new phone · UPDATED 07 OCT | `1384:7316` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7316) |
| CA05 · Add recovery email | `1384:7349` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7349) |
| CA06 · Change recovery email | `1384:7379` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7379) |
| CA07 · Verify recovery email · UPDATED 07 OCT | `1384:7410` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7410) |
| CA08 · Account updated · Overlay | `1384:7443` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7443) |
| CA09 · Recover access · Overlay | `1384:7450` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1384-7450) |


### Customer Bookings, Completion & Support Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| A01 · Bookings | `1005:2653` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2653) |
| A02 · Request details | `1005:2745` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2745) |
| A05 · Bookings | `1005:2769` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2769) |
| A03 · Tobi’s response | `1005:2839` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2839) |
| Cancel this request | `1539:9078` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9078) |
| B01 · Schedule inspection · UPDATED 07 OCT | `1005:2904` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2904) |
| B02 · Pay for inspection | `1005:2928` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2928) |
| B03 · Inspection confirmed | `1005:2952` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2952) |
| B04 · Your inspection | `1005:2976` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-2976) |
| C01 · Final quote ready | `1005:3000` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3000) |
| C02 · Payment details · UPDATED 07 OCT | `1005:3024` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3024) |
| C03 · Review protected payment · UPDATED 07 OCT | `1005:3048` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3048) |
| C04 · Booking confirmed | `1005:3072` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3072) |
| E01 · Bookings | `1005:3216` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3216) |
| E02 · Your booking | `1005:3286` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3286) |
| E03 · Job timeline | `1005:3310` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3310) |
| F01 · Is the work complete? | `1005:3504` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3504) |
| F03 · Job completed | `1005:3552` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3552) |
| F04 · How did Tobi do? | `1005:3576` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3576) |
| F05 · Review submitted | `1005:3600` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3600) |
| G01 · Bookings | `1005:3624` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3624) |
| G02 · Completed booking | `1005:3694` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1005-3694) |
| A07 · Bookings | `1006:4215` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1006-4215) |
| A08 · Bookings | `1006:4287` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1006-4287) |
| A09 · Bookings | `1006:4357` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1006-4357) |
| Cancelled booking | `1135:4732` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1135-4732) |
| MC05 · Cancelled bookings | `1097:5110` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-5110) |
| MR02A · Report details entered | `1097:5244` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-5244) |
| MR04 · Report submitted | `1097:5350` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-5350) |
| MR05 · Support case | `1097:5403` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-5403) |
| MC01 · Cancel booking · UPDATED 07 OCT | `1097:4898` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-4898) |
| MC04 · Refund review | `1097:5057` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1097-5057) |
| Confirm the work is complete | `1539:9122` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9122) |
| MC01A · Confirm cancellation · Overlay | `1132:4674` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1132-4674) |
| PX07 · Tobi suggested a new date · PROTOTYPED | `1639:10430` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1639-10430) |


### Provider Home, Requests & Responses Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| P02 · Provider home · Verification pending | `469:78` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-78) |
| P03 · Jobs · Requests | `469:139` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-139) |
| P05 · Request details | `469:279` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-279) |
| P08 · Set a rough estimate | `469:399` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-399) |
| P09 · Inspection details · UPDATED 07 OCT | `469:437` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-437) |
| P10 · Review response · Rough estimate · UPDATED 07 OCT | `469:483` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-483) |
| P11 · Response sent | `469:522` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-522) |
| P18 · No requests | `469:785` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-785) |
| P20 · Awaiting customer | `1188:4977` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1188-4977) |
| Decline confirmation | `1339:6419` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1339-6419) |
| Availability sheet | `1307:6377` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1307-6377) |
| P23 · Provider messages · UPDATED 07 OCT | `1188:4998` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1188-4998) |
| P24 · No completed jobs | `1188:5008` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1188-5008) |
| P24 · No completed jobs | `1651:11252` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1651-11252) |
| Choose appointment date · Overlay | `1240:6188` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1240-6188) |
| P01 · Provider home · UPDATED 07 OCT | `469:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-3) |
| P14 · Request conversation | `1332:6155` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1332-6155) |
| Decline confirmation | `1254:6262` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1254-6262) |
| P03 · Jobs · Active | `1332:6261` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1332-6261) |
| P03 · Jobs · Cancelled  | `1649:11103` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1649-11103) |
| P03 · Jobs · Active. prepare | `1339:6581` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1339-6581) |
| P03 · Jobs · Active. prepare | `1651:11341` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1651-11341) |
| P03 · Jobs · Requests | `1332:6470` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1332-6470) |
| PO3 · inspection · UPDATED 07 OCT | `1332:6553` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1332-6553) |
| Confirm inspection complete · Overlay | `1339:6512` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1339-6512) |
| PI03 · Inspection complete · UPDATED 07 OCT | `1334:6153` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1334-6153) |
| PI04 · Prepare final quote · UPDATED 07 OCT | `1334:6154` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1334-6154) |
| PI05 · Review final quote · UPDATED 07 OCT | `1334:6155` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1334-6155) |
| PI06 · Final quote sent | `1334:6156` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1334-6156) |
| Notifications provider · UPDATED 11 OCT | `1643:10744` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1643-10744) |
| PX01 · Your confirmed job · PROTOTYPED | `1541:8573` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1541-8573) |
| PX02 · Work in progress · PROTOTYPED | `1541:8643` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1541-8643) |
| PX03 · Waiting for confirmation · PROTOTYPED | `1541:8707` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1541-8707) |
| PX04 · Job completed · PROTOTYPED | `1541:8771` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1541-8771) |
| PX05 · Job cancelled · UPDATED 12 OCT | `1541:8835` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1541-8835) |
| Ready for the customer to review | `1539:9166` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9166) |
| PC01 · Cancel job · UPDATED 12 OCT | `1664:8855` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1664-8855) |
| PC02 · Confirm job cancellation · Overlay · UPDATED 12 OCT | `1664:8920` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1664-8920) |
| PR01 · Report a job problem · UPDATED 12 OCT | `1672:9165` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1672-9165) |
| PR02 · Describe job problem · UPDATED 12 OCT | `1672:9238` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1672-9238) |
| PR03 · Provider support case · UPDATED 12 OCT | `1672:9284` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1672-9284) |
| PR04 · Message support about job · UPDATED 12 OCT | `1672:9344` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1672-9344) |


### Provider Services Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| SV01 · My services | `485:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-3) |
| SV02 · No services | `485:71` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-71) |
| SV03 · Service details | `485:122` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-122) |
| SV09 · Service details | `485:352` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-352) |
| SV10 · Edit service | `485:393` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=485-393) |
| SV13 · Delete service · Overlay | `1344:6005` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1344-6005) |


### Provider Earnings & Payouts Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| ER01 · Earnings & payouts | `487:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=487-3) |
| ER02 · Payment activity | `487:89` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=487-89) |
| Repayments · UPDATED 07 OCT | `1480:11710` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1480-11710) |
| ER04 · Payout accounts | `487:205` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=487-205) |
| ER05 · Add payout account · UPDATED 07 OCT | `487:240` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=487-240) |
| ER08 · Choose bank · UPDATED 07 OCT | `1344:6008` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1344-6008) |
| ER15 · Earnings report · UPDATED 07 OCT | `1402:7696` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1402-7696) |
| ER18 · Materials repayment · UPDATED 07 OCT | `1402:8031` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1402-8031) |
| ER19 · Request payout | `1403:7762` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1403-7762) |
| ER21 · Review payout | `1403:7889` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1403-7889) |
| ER31 · Pay with Paystack · Overlay | `1442:11252` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1442-11252) |
| ER35 · Confirm balance repayment · Overlay · UPDATED 07 OCT | `1442:11284` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1442-11284) |
| ER36 · Repayment confirmed · Overlay | `1442:11328` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1442-11328) |
| ER34 · Not enough app balance · Overlay | `1442:11450` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1442-11450) |
| ER37 · How KK fees work · Overlay · UPDATED 07 OCT | `1464:7626` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1464-7626) |
| ER08A · Bank search results · UPDATED 07 OCT | `1520:7633` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1520-7633) |
| ER08B · No banks found · UPDATED 07 OCT | `1520:7662` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1520-7662) |


### Provider Account & Settings Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| PA01 · Provider account · UPDATED 07 OCT | `488:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-3) |
| PA02 · Provider profile | `488:101` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-101) |
| PA03 · Verification | `488:142` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-142) |
| PA04 · Update identity documents | `488:186` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-186) |
| PA05 · Provider notifications | `488:229` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-229) |
| PA06 · Provider help & support | `488:289` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-289) |
| PA08 · Sign out · Overlay | `488:391` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=488-391) |
| PA3 · Your account | `1344:6014` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1344-6014) |
| PA11 · Verification in review | `1344:6015` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1344-6015) |
| PA3.1 · Change account name | `1360:7021` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7021) |
| PA3.2 · Confirm name change | `1360:7022` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7022) |
| PA3.3 · Name change in review · Overlay | `1360:7023` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7023) |
| PA3.4 · Change primary area | `1360:7024` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7024) |
| PA3.5 · Account updated · Overlay | `1360:7025` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7025) |
| PA3.6 · Verify current phone · UPDATED 07 OCT | `1360:7026` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7026) |
| PA3.7 · New phone number | `1360:7027` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7027) |
| PA3.8 · Verify new phone · UPDATED 07 OCT | `1360:7028` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7028) |
| PA3.9 · Add recovery email | `1360:7029` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7029) |
| PA3.10 · Change recovery email | `1360:7030` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7030) |
| PA3.11 · Verify recovery email · UPDATED 07 OCT | `1360:7031` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7031) |
| PA3.13 · Recover access · Overlay | `1360:7033` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1360-7033) |
| AV01 · Availability · UPDATED 07 OCT | `486:3` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=486-3) |


### Account Deletion & provider deactivation Complete

| Figma screen or state | Node | Link |
| --- | --- | --- |
| AD01 · Delete your account | `1386:8038` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8038) |
| AD03 · Verify account ownership · UPDATED 07 OCT | `1386:8115` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8115) |
| AD04 · Confirm account deletion | `1386:8200` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8200) |
| AD05 · Deletion requested | `1386:8257` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8257) |
| AD02 · Open activity before deletion | `1386:8310` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8310) |
| PD01 · Deactivate provider profile | `1386:8387` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8387) |
| PD02 · Confirm provider deactivation | `1386:8466` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8466) |
| PD03 · Provider profile deactivated | `1386:8521` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1386-8521) |


### PROTOTYPE System states, payments & recovery

| Figma screen or state | Node | Link |
| --- | --- | --- |
| ST11 · Confirming your payment · KK LOADING · UPDATED 10 OCT | `1539:8169` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8169) |
| ST14 · Submitting your payout · KK LOADING · UPDATED 10 OCT | `1539:8314` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8314) |
| ST21 · Confirming your repayment · KK LOADING · UPDATED 10 OCT | `1539:8617` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8617) |
| ST24 · Sending your request · KK LOADING · UPDATED 10 OCT | `1539:8748` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8748) |
| ST39 · Please sign in again · PROTOTYPED | `1539:9400` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9400) |
| ST40 · Stay up to date · PROTOTYPED | `1539:9444` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9444) |


### UPDATED Toast feedback 07 OCT nonblocking messages

| Figma screen or state | Node | Link |
| --- | --- | --- |
| ST01 · You’re offline · PROTOTYPED | `1539:7687` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7687) |
| offline · Error toast | `1587:9093` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9093) |
| ST02 · Your changes weren’t saved · PROTOTYPED | `1539:7745` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7745) |
| saveError · Error toast | `1587:9096` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9096) |
| ST03 · Check the highlighted details · PROTOTYPED | `1539:7788` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7788) |
| validation · Error toast | `1587:9099` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9099) |
| ST06 · We couldn’t upload your file · PROTOTYPED | `1539:7941` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7941) |
| uploadError · Error toast | `1587:9102` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9102) |
| ST07 · That code doesn’t match · PROTOTYPED | `1539:7984` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-7984) |
| codeInvalid · Error toast | `1587:9105` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9105) |
| ST08 · Your code has expired · PROTOTYPED | `1539:8027` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8027) |
| codeExpired · Error toast | `1587:9108` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9108) |
| ST09 · A new code is on its way · PROTOTYPED | `1539:8070` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8070) |
| codeSent · Info toast | `1587:9111` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9111) |
| ST12 · Payment wasn’t completed · PROTOTYPED | `1539:8227` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8227) |
| paymentFailed · Error toast | `1587:9114` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9114) |
| ST16 · Payout completed · PROTOTYPED | `1539:8402` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8402) |
| payoutSuccess · Success toast | `1587:9117` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9117) |
| ST17 · Payout wasn’t completed · PROTOTYPED | `1539:8445` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8445) |
| payoutFailed · Error toast | `1587:9119` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9119) |
| ST18 · Bank account verified · PROTOTYPED | `1539:8488` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8488) |
| bankMatched · Success toast | `1587:9122` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9122) |
| ST19 · The account names don’t match · PROTOTYPED | `1539:8531` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8531) |
| bankMismatch · Error toast | `1587:9124` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9124) |
| ST20 · We couldn’t verify this account · PROTOTYPED | `1539:8574` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8574) |
| bankError · Error toast | `1587:9127` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9127) |
| ST22 · Repayment wasn’t completed · PROTOTYPED | `1539:8661` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8661) |
| repayFailed · Error toast | `1587:9130` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9130) |
| ST25 · Your request wasn’t sent · PROTOTYPED | `1539:8792` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8792) |
| requestFailed · Error toast | `1587:9133` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9133) |
| ST28 · Your service is live · PROTOTYPED | `1539:8923` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-8923) |
| servicePublished · Success toast | `1587:9136` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9136) |
| ST30 · Request cancelled · PROTOTYPED | `1539:9010` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9010) |
| requestCancelled · Success toast | `1587:9138` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9138) |
| ST34 · Request declined · PROTOTYPED | `1539:9185` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9185) |
| responseDeclined · Success toast | `1587:9140` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9140) |
| ST35 · New date sent · PROTOTYPED | `1539:9228` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9228) |
| dateSent · Success toast | `1587:9142` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9142) |
| ST36 · New date confirmed · PROTOTYPED | `1539:9271` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9271) |
| dateAccepted · Success toast | `1587:9144` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9144) |
| ST37 · Date suggestion declined · PROTOTYPED | `1539:9314` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9314) |
| dateDeclined · Info toast | `1587:9146` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9146) |
| ST38 · Changes saved · PROTOTYPED | `1539:9357` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1539-9357) |
| formSaved · Success toast | `1587:9149` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9149) |
| ST41 · Terms of use unavailable · PROTOTYPED | `1559:8983` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1559-8983) |
| termsUnavailable · Error toast | `1587:9151` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9151) |
| ST42 · Privacy policy unavailable · PROTOTYPED | `1559:9034` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1559-9034) |
| privacyUnavailable · Error toast | `1587:9154` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1587-9154) |


### PROTOTYPE KK logo loading animation UPDATED 10 OCT

| Figma screen or state | Node | Link |
| --- | --- | --- |
| ST11 · KK pulse 2 of 5 · Animation phase | `1625:8718` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8718) |
| ST11 · KK pulse 3 of 5 · Animation phase | `1625:8747` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8747) |
| ST11 · KK pulse 4 of 5 · Animation phase | `1625:8776` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8776) |
| ST11 · KK pulse 5 of 5 · Continue to outcome | `1625:8805` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8805) |
| ST14 · KK pulse 2 of 5 · Animation phase | `1625:8867` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8867) |
| ST14 · KK pulse 3 of 5 · Animation phase | `1625:8896` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8896) |
| ST14 · KK pulse 4 of 5 · Animation phase | `1625:8925` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8925) |
| ST14 · KK pulse 5 of 5 · Continue to outcome | `1625:8954` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-8954) |
| ST21 · KK pulse 2 of 5 · Animation phase | `1625:9016` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9016) |
| ST21 · KK pulse 3 of 5 · Animation phase | `1625:9045` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9045) |
| ST21 · KK pulse 4 of 5 · Animation phase | `1625:9074` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9074) |
| ST21 · KK pulse 5 of 5 · Continue to outcome | `1625:9103` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9103) |
| ST24 · KK pulse 2 of 5 · Animation phase | `1625:9165` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9165) |
| ST24 · KK pulse 3 of 5 · Animation phase | `1625:9194` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9194) |
| ST24 · KK pulse 4 of 5 · Animation phase | `1625:9223` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9223) |
| ST24 · KK pulse 5 of 5 · Continue to outcome | `1625:9252` | [Open](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1625-9252) |

