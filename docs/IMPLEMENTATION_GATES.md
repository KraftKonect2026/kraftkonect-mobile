# Remaining KraftKonect migration

Work is on `codex/figma-foundation`. Joshua authorized committing and pushing
the frontend and developer handover to this branch on 13 October 2026. The
historical local-only checkpoints below remain validation records. Deployment,
EAS builds and OTA publication are outside this handover action.

The accepted nine-step plan is preserved: local setup → shared design foundation → navigation/Home → authentication/onboarding → discovery/requests → paid inspections → quotes/protected payment → work/completion/exceptions → earnings/account/release checks.

## Gate definition

Each step needs its shared native screens, labelled development samples while the backend is unavailable, appropriate domain/regression checks, TypeScript, scoped lint, local bundle/asset checks, and browser journeys across both participants before proceeding to the next frontend step. Live server authorization, ownership, payment/ledger verification and native device checks are separate gates. A local simulator passing is not live integration or a release approval.

## Step 6 — paid inspections

Local frontend gate passed on 12 October 2026: 57 domain/regression checks, TypeScript, scoped lint, diff checks, local Android export, and the customer/provider phone-width journeys. See `STEP6.md` for the check record. Live/backend and native-device gates are still open.

Provider requests, rough estimate, provider-set deposit and appointment, response review/send; customer Pending request, response, scheduling/address, hosted-checkout boundary, pending/failed/verified payment; confirmed visit, provider findings and explicit inspection completion; customer waiting for final quote. Both preview participants use the same persisted sample record. Paid inspections and waiting for quotes are Active. Exact addresses stay private before confirmation. Remote appointments need no residential address.

Live gate remains pending: new unpaid-request/response APIs, versioned inspection terms, exact-address policy, idempotent checkout and verified payment proof, findings/completion persistence, participant permissions and events. The currently configured backend returned HTTP 503 again on 12 October 2026. Existing booking APIs are legacy reads and do not prove these new states.

## Step 7 — quotes and protected payment

Local frontend gate passed on 12 October 2026: 74 regression checks, TypeScript, scoped lint, diff checks, local Android export, and customer/provider browser journeys at phone widths. See `STEP7.md`. Live/backend and native-device gates remain open. Versioned final scope, materials/labour, total, full gross deposit credit once, remaining payment, work appointment/duration, provider review/net breakdown; customer review and checkout, booking confirmation; verified materials release versus pending labour. Customer KK fee is zero. Provider fee is 5%, capped at ₦20,000 once across the whole booking, including deposit and balance; never reassessed at release/payout.

Unresolved live policy: actual custody/release integration, net deposit allocation to materials/labour, fee-cap allocation and refund consequences. Server ledgers must supply production amounts. The client cannot resolve those policies by inventing allocations.

## Step 8 — work, completion and exceptions

Local frontend gate passed on 12 October 2026: 95 regression checks, TypeScript, scoped lint, diff checks, Android export and the customer/provider browser journeys at phone widths. See `STEP8.md`. Live/backend and native-device gates remain open. Work timeline, date proposal/acceptance, provider ready-for-review and separate customer completion confirmation; reviews; reasoned cancellation/explicit confirmation; refund review and provider repayment; support cases/conversations. Job, payment, refund, debt, payout and support states stay separate. No automatic customer confirmation or false refund/release promise.

## Step 9 — earnings, account and full checks

In progress after Step 8's local gate passed. Earnings/payouts/reports; services and availability; persisted notifications/destinations; participant messaging and attachments; contacts and verification; account recovery; provider deactivation; account deletion notice and settlement requirements; settings. Verify all linked customer/provider journeys, account switching, failure recovery, protected data, accessibility and native device behavior before any release. No release or production money movement is enabled by preview fixtures.

13 October checkpoint: 265 checks pass with TypeScript, scoped lint, diff checks
and a local Android export. The customer/provider Account tabs and old
settings/profile/card routes now share protected, owned read adapters and explicit
boundaries for unsupported new operations. HTTP refresh preserves account scope
and terminates queued failures. Both live inboxes/chat also use owned read adapters,
ignoring recipient details in URLs and rejecting delayed/foreign history.
The old provider service/calendar/earnings/payout links also share protected
catalog/financial readers. The existing request-status boolean keeps its verified
API path; new weekdays, publication/archive, ledger and payout writes remain
contract gates. The final route audit replaces the direct-ID review write, shared
account caches, old provider settings and timer-only password recovery. Public
profile photos now use the correct web/native multipart format, with ownership
checks across awaits. Verification inquiry starts also require fresh matching
account/provider reads. No real photo upload, identity inquiry or review was sent.
The added review browser checks pass at 393px and 320px; the local Android export
has 3,495 modules, 162 assets and a 7.22 MB bundle. Live contracts, authenticated
server journeys and native-device QA remain open. Android tools are installed but
no device/emulator is attached. GET and a basic GraphQL POST read both return 503.

## External completion requirements

13 October design review: see [Design audit](DESIGN_AUDIT.md) and its frame
coverage CSV. This separate frontend audit corrects Home, role artwork,
messaging, bank search, input focus, notification presentation and a preview
route. The 269-check record includes the new development test-login checks.
It does not close the missing loading-motion, hidden-outcome visual, backend
or native-device gates, or claim every frame was individually rendered.

Obtain backend source/contracts and restore the service; settle the financial allocation/custody policies; test on native devices; verify both authenticated participants, server-side permissions, idempotency/webhooks and ledger balances. These are outstanding requirements of the full goal. The full goal must stay unfinished until required checks actually pass.

## Integration blocker audit — 13 October 2026

The final read-only recheck returned HTTP 503 for both GET and a minimal GraphQL
POST. Current GitHub search exposes `kraftkonect-mobile`,
`kraftkonect-admin-dashboard` and `kraftkonect-coming-soon`; it does not expose a
backend repository. This does not prove a private backend does not exist. No
backend package, Dockerfile or database schema is present in this checkout.
Android ADB reports no connected device; no emulator is installed at the local
SDK path. Native-device checks and authenticated server journeys remain unproven.

The same backend/contract blocker is recorded in the three consecutive goal
turns covering the Account/message readers, provider/financial readers and final
integration audit. The independent local screen and route work is now ready to
review. No production contract, authorization, fund allocation or recovery rule
will be invented to turn a preview result into live integration.

Resuming the full goal requires the backend repository/access and working
development endpoint/schema, confirmation of the custody/allocation and event
contracts, and a native test device/runtime. Keep the current local changes and
preview fixtures. The handover branch push is authorized; deployment and EAS/OTA
publication remain outside this action. See [Developer handover](DEVELOPER_HANDOVER.md).
