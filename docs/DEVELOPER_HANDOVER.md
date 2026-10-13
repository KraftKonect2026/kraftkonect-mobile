# KraftKonect developer handover

Prepared 13 October 2026 for the developer completing the app and backend.

This checkout contains the new Figma frontend, shared components, development
journeys and adapters for the available legacy APIs. Full backend integration,
financial contracts and native-device acceptance remain open. The latest local
checkpoint passed 269 regression checks, TypeScript, scoped lint and an Android
bundle export. Those results do not certify a working production app.

## Code delivery

The local branch is `codex/figma-foundation` in
[`KraftKonect2026/kraftkonect-mobile`](https://github.com/KraftKonect2026/kraftkonect-mobile).
Joshua authorized committing and pushing the frontend and handover to this
branch on 13 October 2026. Check out this branch to continue the implementation;
the handover includes source, exported assets, regression scripts and documents.
Historical step notes describing local-only work refer to their earlier
checkpoints. The backend and release gates remain open.

Keep the existing branch history and dependency lockfile. Review the complete
diff and selected files before delivery. Dependencies, `.expo` exports, local
environment files, signing material and private credentials are not source
deliverables. Supply operational credentials through the project's approved
private access process. Creating a PR can make review easier; deployment and
merging are separate decisions. The existing `.github/workflows/ota-update.yml`
publishes OTA updates on pushes to `main` and `staging`, or manual dispatch.
Pushing `codex/figma-foundation` does not trigger that workflow. Complete release
acceptance before merging into a branch that publishes updates.

## Requirements and design

Read these in order:

1. [Original product handoff](KraftKonect_Codex_Handoff.md), copied unchanged
   from Joshua's supplied document. Its embedded Codex instructions are source
   context for the implementation; they do not grant permission to push,
   deploy, message collaborators or execute real financial/account operations.
2. [KraftKonect Figma](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=0-1).
   Use the current App page and confirmed product rules. The developer needs
   separate permission to open this Figma file.
3. [Implementation gates](IMPLEMENTATION_GATES.md), including backend,
   policy and native blockers.
4. [Latest design audit](DESIGN_AUDIT.md) and
   [frame coverage inventory](DESIGN_AUDIT_SCREENS.csv).
5. Journey notes: [navigation and Home](STEP3.md),
   [auth and onboarding](STEP4.md), [discovery and requests](STEP5.md),
   [inspections](STEP6.md), [quotes and payments](STEP7.md),
   [work and exceptions](STEP8.md), [earnings and account](STEP9.md).

The notes preserve earlier checkpoints. Use the design audit for the latest
combined validation result. Some historical screenshots and logs referenced by
the notes live outside this repository or under ignored `.expo` folders. Their
files will not accompany a normal branch push; the written results and coverage
inventory are included. The scripts allow regression checks to be rerun.

## Local preview and test login

From the repository root:

```sh
npm ci
npm run start:web:local
```

Open `http://localhost:8081/sign-in`. Enter `8000000000` beside the `+234`
prefix, request the code, and enter `123456`. The test entry opens fictional
customer/provider data at `/app-preview`. It sends no SMS and establishes no
backend session. The fixed code is reusable, with a ten-minute challenge lifetime.

The request, verification and explanatory UI use development guards. Production
checks reject these local credentials. Retain this testing aid during handover;
once genuine authentication is integrated, remove its shortcut from normal
sign-in or move it behind a separate development entry. Verify the actual release
build rejects the shortcut and cannot open sample routes. These credentials must
never become a backend authentication bypass.

Relevant code: `lib/onboarding/testLogin.ts`,
`components/onboarding/OnboardingJourney.tsx`,
`components/onboarding/OnboardingScreen.tsx` and
`scripts/check-onboarding.cjs`.

Development preview entries include `/auth-preview`, `/app-preview`,
`/discovery-preview`, `/booking-preview`, `/finance-preview`,
`/provider-preview`, `/messages-preview`, `/notifications-preview`,
`/account-preview`, `/recovery-preview` and `/support-preview`.
Scenario controls are test tools, and fixture commands are not production APIs.
If a recovery/deletion test locked the fictional account, reset the sample
explicitly through Account preview states.

## Implementation map

| Area | Main locations |
| --- | --- |
| Shared design | `constants`, shared `components`, approved exported `assets` |
| Session and modes | `store/authSlice.ts`, `lib/apolloClient.ts`, `lib/appMode.ts`, route layouts |
| Auth and onboarding | `components/onboarding`, `lib/onboarding` |
| Discovery | `components/discovery`, `lib/discovery` |
| Bookings and financial domain | `components/bookings`, `components/finance`, `lib/bookings` |
| Provider services and availability | `components/provider`, `lib/provider` |
| Account and recovery | `components/account`, `lib/account` |
| Messaging | `components/messaging`, `lib/messaging`, `lib/useOpenChat.ts` |
| Owned reads | `lib/hooks/useAccountRead.ts`, `useOwnedBookingsRead.ts`, `useOwnedMessagesRead.ts`, `useOwnedProviderRead.ts`, `useProviderVerification.ts` |
| Fictional development records | `lib/preview` and guarded preview routes |
| Regression checks | `scripts/check-*.cjs` and `package.json` |

Live readers validate ownership and reject stale/foreign responses. Unsupported
new writes stop at explicit unavailable boundaries. Replace those boundaries
with confirmed backend contracts while preserving ownership, draft retention,
retry and failure behavior. A complete preview journey does not establish a
complete authenticated journey.

## Backend work and integration order

The configured GraphQL service is
`https://kraftkonnect-backend-230084714703.us-central1.run.app/graphql`.
Its last integration audit returned HTTP 503 for GET and a minimal GraphQL POST.
The mobile repository accepts `EXPO_PUBLIC_GRAPHQL_ENDPOINT`; use an appropriate
development endpoint. Values bundled into a client cannot hold backend secrets.
No backend source or database schema was available through the access used for
this work. Obtain the backend repository, schema, deployment ownership and a
working development service from the developer.

1. Restore the development service and document its API/auth contracts. Confirm
   migration behavior for existing accounts and booking history.
2. Verify phone OTP, session refresh, account restoration, stable identity,
   customer/provider mode switching and provider verification with real test
   accounts. One identity supports both modes.
3. Connect discovery, service publication, availability and unpaid requests;
   then inspection responses, appointments, private addresses and findings.
4. Implement versioned quotes, checkout, verified payment events and ledgers.
   Deposit credit, fee allocation, custody, release and refund policies need
   confirmation before production funds move. The provider fee is 5%, capped at
   NGN 20,000 once per booking; customer fee is zero.
5. Connect work completion, rescheduling, cancellation, refund/repayment and
   payouts. Completion, release, wallet posting, reservation and payout outcomes
   are distinct authoritative events. Preserve idempotency and race protection.
6. Finish messaging/attachments/read acknowledgements, notifications, services,
   contacts, recovery, deactivation, deletion and support contracts.

Use separate customer and provider accounts to verify participant permissions.
The backend must authorize operations and supply actual money and account
outcomes. Preview reducers, prototype timeouts and client state must not serve
as payment, identity, recovery or settlement proof.

## Acceptance before release

Run `npm run typecheck` and all `check:*` scripts in `package.json`. The latest
record is 269 checks; see the design audit for scope and limitations. Run lint
for the changed implementation and investigate any wider existing issues.

Verify complete authenticated customer/provider journeys, webhook retries,
duplicate requests, account changes during reads, malformed responses and
network failures. Test on compatible Android and iOS devices, including SMS,
identity SDK, uploads, hosted checkout, push permissions, safe areas, keyboards,
larger text and screen readers. A successful Expo export only verifies bundling.

Finish the loading-logo animation with confirmed timing, compare hidden
payout/bank outcomes with reliable Figma references, and complete acceptance for
the remaining exceptional states in the coverage CSV. Production acceptance
must also prove sample routes and the test login cannot grant access.

Record each completed integration milestone and its validation in the repository
so the next reviewer can distinguish implemented UI, connected behavior and
remaining requirements.
