# Step 3: navigation and Home screens

Local checkout: `C:\Users\Joshua\Documents\KK App\kraftkonect-mobile`.
No commits, pushes, deployment, or OTA publication were performed.

Run `npm run start:web:local` and open
[the Step 3 preview](http://localhost:8081/app-preview). It works without signing
in. The ribbon labels all fixtures as sample data; **States** selects sample,
verification, incomplete setup, changes required, empty, loading, or failed
loading. Mode preference in this preview has its own storage key and does not
touch real authentication. Production builds redirect the preview to app entry.

## Navigation

| Mode | Four primary destinations | Secondary destinations |
| --- | --- | --- |
| Customer | Home, Bookings, Messages, Account | Saved providers, existing search/profile/booking routes |
| Provider | Home, Jobs, Messages, Account | Services, availability/calendar, earnings, identity verification |

The old provider Calendar tab edits unavailable dates; it is not a jobs feed.
A separate Jobs route now reads the existing provider bookings and groups
Requests, Active, Completed and Cancelled records. Detailed inspection,
quote/payment and job states will be implemented in their later milestones.

The selected `activeMode` is a persisted presentation preference scoped to a
user ID. It never changes `user.role`, access tokens or provider permissions.
Existing persisted sessions fall back to their previous role-based landing
route. Sign-in restores the saved preference for that account. Another account
does not inherit it. Server role refresh on Customer Account no longer forces
a switch. Focused mode routes also handle browser/native back navigation and
deep links. Root protected routes and mode layout guards require a signed-in
session. Apollo clears account data when the signed-in identity changes, while
retaining it when the same account switches modes.

Home and Account both expose the shared mode switch. Account pages otherwise
retain their existing design for their later migration.

## Home and data

Sources:
[Customer Home 428:5](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=428-5),
[Provider Home 469:3](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-3),
[Verification pending 469:78](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-78),
[Bottom navigation 906:1418](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=906-1418),
[Jobs 469:139](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=469-139).

Shared presentational Home components are used by both authenticated routes
and the isolated preview. Native safe areas reserve the OS status bar and
bottom inset; the web preview does not draw an artificial phone status bar.
The approved category artwork and navigation icons are downloaded locally
under `assets/design`, preserving SVG root dimensions. Provider/customer
photos in the actual app come from API data. Figma photos and amounts appear
only in `lib/preview/homeFixtures.ts` and the development preview.

Customer Home uses existing provider, completed booking and favourites
queries. Book-again cards are matched against the fetched approved/verified
providers (currently capped at 50). Recommendations browse approved providers;
personalized ranking needs a backend contract. AI search retains the existing
description parser and results route. Failed smart search explicitly offers
general browsing. Home save buttons use the existing favourites mutations,
with GraphQL failures treated as errors.

Provider Home reads the existing provider profile, listings and bookings.
Both provider approval and approved identity status are required for the
verified dashboard presentation. Missing data is not treated as approval.
Incomplete setup, identity review and rejected verification have appropriate
status views; profile/listing failures show retry instead of a fabricated
setup result. Verified providers retain Home if their last service is deleted.
The existing Persona/secure-browser inquiry integration is preserved in
`useProviderVerification`; success is announced only after server approval.
Native device testing is still required for that SDK.

## Backend dependencies

The configured Cloud Run GraphQL endpoint returned **HTTP 503** during this
milestone. Live authentication and API writes could not be verified. No backend
repository or replacement backend was created.

The current client queries do not supply:

- Authoritative net earnings after fees, holds and repayments. Actual Home
  shows unavailable totals, rather than labelling gross booking values as net.
- Weekly working-day preferences. Availability can save the existing
  available/unavailable flag and link to the existing blocked-date calendar.
  The Figma weekly day controls remain pending backend support.
- Appointment addresses and work photos in the provider-bookings query.
  Actual cards omit those fields when absent; they do not copy sample addresses.
- A persisted notifications feed. The bell explains that this is a later
  implementation step.
- The new inspection/request lifecycle and category taxonomy confirmation for
  Beauty, Moving and Gardening. Current routes pass the selected service key
  to the existing search flow; discovery and lifecycle changes remain later steps.

The existing secondary payment/earnings and settings screens still use their
old behavior and designs. Migrating their policies and UI is outside Step 3.

## Validation

`npm run check:navigation` checks mode persistence, same-account restoration,
account isolation, role refresh behavior, provider verification gating, job
grouping, and absent appointment data. TypeScript and scoped ESLint are also
run. Browser checks cover the shared Home layouts, tab switching, Account mode
switch, Jobs filters, search/save actions, availability, recovery states and
responsive layout. Android export verifies bundling locally, not installation
or live backend integration. Existing lint warnings in legacy auth/services
files are tracked separately from the new Step 3 components.
