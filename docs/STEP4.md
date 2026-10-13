# Step 4: sign-in and onboarding

Local checkout: `C:\Users\Joshua\Documents\KK App\kraftkonect-mobile`.
No commits, pushes, deployments, EAS builds or OTA publication were performed.

## Preview

Run `npm run start:web:local`, then open
[the welcome screen](http://localhost:8081/auth-preview?step=intro) or
[sign-in](http://localhost:8081/auth-preview).
Choose **Get started**, then either service mode. Use a sample Nigerian phone
number such as `0801 234 5678` and code **123456**. These numbers/codes work
only inside this development preview. No SMS, authentication, API writes,
file uploads or location permissions are triggered by preview interactions.

The **States** menu opens individual screens and selects normal, network-error,
account-not-found, expired-code and invalid-code scenarios. Reset clears this
preview's own draft. Real accounts use separate storage keys. Production builds
redirect both preview routes to the app entry point. `?preview=true` cannot
enable preview behavior on a real onboarding route.

### Development test login (13 October 2026)

The normal `/sign-in` screen now also accepts **8000000000** beside `+234`
with fixed test code **123456**, only when `__DEV__` is true. Requesting this code
never calls `requestPhoneOTP`; verifying it never calls `verifyPhoneOTP` or installs
authentication tokens. It opens `/app-preview` with the existing fictional account
and restores a signed-out sample without changing real authentication. Normal
numbers and registration keep their existing backend paths. The test request is
memory-only, phone-bound, expires after ten minutes, and is cleared on back or
success. The code is reusable across new requests. Recovery/deletion locks remain
in place; use Account preview states to reset those sample scenarios explicitly.
The screen labels the test account and makes clear that no SMS was sent.
`check:onboarding` includes production rejection, exact phone/code matching,
expiry and malformed-clock checks.

Verified locally: 18 onboarding/auth checks, 16 account checks and 15 navigation
checks passed, along with TypeScript, scoped ESLint and `git diff --check`.
Browser testing covered wrong-code rejection, successful customer Home entry,
provider switching, sample sign-out and successful test sign-in again. The sign-in
instructions fit 393px and 320px viewports without horizontal page overflow.
Screenshots: `../../review/local-test-sign-in.png` and `../../review/local-test-login-home.png`
(in the parent KK App review folder; review artifacts, not app assets).
No GitHub push, deployment, native build or remote tunnel was performed.

## Screens and structure

| Journey | Implemented screens |
| --- | --- |
| Entry | Blue splash mark, illustrated welcome, mode choice |
| Sign-in | Phone, six-digit code, resend countdown, explicit account-not-found state |
| Shared registration | Phone, code, first and last name |
| Customer | Location permission entry, manual default area, Customer Home |
| Provider | Work type, weekly days, area or remote work, profile/cover photos, business name and introduction, gallery, first service/photo/description/price |
| Verification | Required-verification explanation, private ID/selfie entry, submitted-review state, skip to Home |
| Recovery entry | Email/identity choice, recovery email/name, old phone/name |

Shared visual components live in `components/onboarding`; `OnboardingJourney`
owns state and existing API calls. `lib/onboarding/model.ts` provides draft
sanitizing, account keys and validation. `phoneAuth.ts` validates server proof
before any real session is dispatched. Figma assets are local and documented
in `assets/onboarding/README.md`. Existing Inter roles, buttons, inputs, code
entry, callouts and banners are reused. Native safe areas reserve OS controls;
the web preview does not draw an artificial phone status bar.

Routes `/sign-in`, `/sign-up` and `/get-started` use the new UI. Existing provider
onboarding links redirect into the new persistent journey. Legacy email/password
sign-in and registration remain at `/legacy-sign-in` and `/legacy-sign-up`
to retain the established integration while the phone-only contract is confirmed.
Legacy email/phone verification remain available to that fallback. The Step 9
audit replaced the old timer-only password-recovery/reset screens with the new
recovery entry and its unavailable service boundary. No email delivery or password
change is claimed without a verified server result. Legacy registration/sign-in
are available only while signed out; delayed results cannot replace another UID.

## Persistence and session behavior

Public setup details save on-device under versioned keys scoped to the server's
stable account ID. Native drafts use the existing SecureStore wrapper; web uses
the existing AsyncStorage wrapper. Storage errors are surfaced. Sign-in never
overwrites an existing account draft with the phone-entry form. Registration
for an existing identity preserves that identity's provider details. Account
changes and unmounts guard delayed responses. Used codes are removed from the
back stack. OTPs, challenge IDs, access tokens, approval flags and private ID
or selfie files never enter an onboarding draft. Photo drafts contain references
to public profile/gallery images; locally selected files may need reselection
if the device removes their temporary URI.

Restoring a draft cannot restore a code challenge, service-created proof or
verification-submitted proof. Client success screens require the controller's
fresh result; actual review status comes from the server. Anonymous deep links
to post-code setup return to phone verification. Selecting provider mode never
changes `User.role`. Existing named accounts skip registration name updates,
including previously verified provider names.

Customer area is a matching preference, not a saved home address. Manual areas
or explicitly requested coordinates are saved locally per account and supplied
to the existing nearby search variables. Customer matching area and provider
service area have separate draft fields. Cross-device syncing still needs a
backend preference field. Appointment addresses remain a later flow.

## Backend work required

The configured Cloud Run GraphQL endpoint is unavailable (HTTP 503 during the
local migration). The backend repository has not been located. Existing client
source provides `requestPhoneOTP(phone)` and `verifyPhoneOTP(phone, pin, pinId)`;
its old flow used these after email/password registration. The new UI reuses
these exact calls and requires complete tokens, a stable user ID and a recognized
server role. Network errors never imply that an account does not exist.
Public phone-only sign-in and new-account creation are **not yet validated**.

The developer needs to confirm/provide:

1. Phone-only sign-in versus registration intent, account-not-found/invalid/expired
   error codes, SMS throttling and complete authenticated responses. A selected
   client mode must not create provider privileges.
2. Draft provider creation/updating for work category, weekly working days,
   area/remote service, business display name, introduction, cover/avatar/gallery
   and first service. The current client input does not cover all these fields.
3. Idempotent first-service saving with an unpublished/unverified state and
   server-side discovery/booking gates. The legacy create-listing call does not
   establish this contract. Local drafts must not be dropped or partially
   published to simulate successful onboarding.
4. Stable-ID recovery through a saved recovery email or previous verified
   identity, challenges, phone replacement, cooldowns and audit status.
   Recovery entry screens currently report unavailable when submitted; they
   cannot send email codes, replace a phone, or open a recovery case.
5. Customer matching-area preference syncing and confirmed category taxonomy.

Actual provider **Continue** on the first-service screen flushes the local draft
and reports the unavailable online operation. It does not upload public photos,
call incomplete legacy onboarding inputs, publish listings or show “Service
created.” Only the labelled preview simulates that result.

Actual identity actions reuse `startKycInquiry` with the existing Persona native
SDK/secure browser fallback. They do not select private files or send ID/selfie
images through the unsigned public Cloudinary uploader. A provider ID must
already exist; profile/network failures are shown without fabricating one.
Submission requires an explicit submitted/reviewing server state, or a completed
native inquiry followed by a pending server state; opening an inquiry alone
does not announce submission. Approval is read from the backend. New native splash settings
and Persona behavior require a compatible device development build for final QA.

## Validation

`npm run check:onboarding` verifies phone formats, Unicode names, exact minor-unit
prices, public-field draft whitelisting, account isolation, preserved provider
progress, anonymous route gating, complete/matching session proof and explicit
error-code handling. `npm run check:navigation` retains the Step 3 identity/mode
and Home checks. TypeScript, scoped ESLint and local Android export check the
implementation without publishing. Browser verification covers both full sample
journeys, code errors/resending, recovery entry, gallery changes, persistence and
mobile widths. Live SMS/account/provider writes remain blocked by the backend.

Local checks on October 12, 2026: TypeScript passed; new/changed onboarding files
passed scoped ESLint with no errors or warnings; 14 onboarding/auth and 15
navigation/account regression checks passed. The local Android export completed
in `.expo/step4-android-check`. Browser checks used 393×852 and 320×740, including
customer and provider journeys, explicit errors, saved first-service restoration,
anonymous deep-link protection and Home verification gating. Existing search
screen lint warnings are unrelated to this migration. No real SMS, account
creation, provider publication or identity-document upload was performed.
