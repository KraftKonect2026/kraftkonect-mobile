# Welcome to your Rork app

## Developer handover

Start with [the developer handover](docs/DEVELOPER_HANDOVER.md) for the code map,
local test login, integration order and release requirements. The repository
also contains [Joshua's original product handoff](docs/KraftKonect_Codex_Handoff.md),
the step notes, implementation gates and design audit. Use these documents
when checking out the developer handover branch `codex/figma-foundation`.

## Local browser preview

Open PowerShell in the app folder and run:

```powershell
cd "C:\Users\Joshua\Documents\KK App\kraftkonect-mobile"
npm run start:web:local
```

Open [http://localhost:8081](http://localhost:8081) and keep the terminal running.
Saved code changes reload the preview automatically. Press `Ctrl+C` in the terminal
to stop it. This command runs Expo locally and does not push code or publish an update.

Dependencies are already installed in this checkout. On a fresh checkout, install
Node.js 22 LTS and run `npm ci` before starting. Use `npm run typecheck` to check TypeScript.

The browser preview includes the new Figma entry, sign-in and onboarding screens.
Open [the Step 4 preview](http://localhost:8081/auth-preview?step=intro) to test
both journeys with sample data and code **123456**. It cannot sign in, send SMS,
create real accounts, or upload files. The **States** menu also opens individual
screens and error scenarios. See [Step 4](docs/STEP4.md) for implementation details.

Authentication, bookings, messages, and other live data still require the configured GraphQL backend; its
last checked endpoint returned HTTP 503. Native Persona verification loads only
on native platforms, with the existing browser verification flow used on web.
Native SDK behavior must also be tested in a compatible development build.

For testing while the backend is unavailable, open [Sign in](http://localhost:8081/sign-in),
enter **8000000000** in the field beside **+234**, press **Send code**, then enter
**123456** and press **Sign in**. This development-only test login opens the existing
fictional customer/provider preview. It sends no SMS, creates no backend session,
and leaves real account credentials unchanged. The fixed test code is reusable;
each request expires after ten minutes. Other numbers keep the live backend flow.
If a previous sample recovery/deletion test locked the account, reset the sample
in Account preview states. Run `npm run check:onboarding` to check the test-login gate.

The [13 October design audit](docs/DESIGN_AUDIT.md) records corrections against
Figma, the 269-check result, phone-size browser evidence, full source-frame
inventory and the remaining motion, backend and native-device acceptance gates.

Expo's [web development guide](https://docs.expo.dev/workflow/web/) describes the
browser workflow.

## Shared KK design system

Open [the local component preview](http://localhost:8081/design-system) while Expo
is running. This development-only screen requires no login or backend. It redirects
to the app entry point in production builds.

- `constants/colors.ts`: semantic colours from Figma Foundations (847:2).
- `constants/typography.ts`: 23 Inter roles from 847:100 and 971:1708, using the
  already-bundled font files. Use `AppText` or the role styles directly.
- `constants/layout.ts`: spacing, radii, border widths and control dimensions
  from 847:152. New UI uses these tokens; `constants/theme.ts` remains the previous
  decorative theme until its individual screens are migrated.
- `Button`: Primary, Outline and Subtle; regular (52) and compact (44); native
  press feedback, disabled and loading states. Existing Secondary/Glass calls
  remain compatible and use Subtle styling.
- `Input`: labelled text, phone-prefix and multiline fields; focus, error and
  disabled states. Existing Formik props and animated container styles still work.
- `VerificationCode`: controlled six-digit entry, numeric filtering, paste,
  OS autofill and error presentation. The caller performs actual verification.
- `SelectionChip` and `RoleSwitch`: controlled selected states and accessible
  labels. Changing the preview mode does not change an account or call an API.
- `Callout`: persistent neutral/information/success/warning/error cards.
- `FeedbackBanner` and the existing `useToast` API: nonblocking text banners at
  the safe-area top. Banners queue, wrap long text, dismiss on tap, and last 5
  seconds (8 for errors). Duration 0 and native screen-reader use keep them available;
  Android's recommended accessibility timeout is respected. Web banners pause
  while hovered or focused.
- `BrandMark` and `LogoLoader`: approved blue/white artwork exported from Figma
  nodes 982:1798/982:1819, stored in `assets/brand`, preserving proportions.

Sources: [KK Foundations](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=846-3),
[buttons](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=857-178),
[fields](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=859-489),
[feedback](https://www.figma.com/design/r9tDEePO6S96nPWlE2fw2c/KraftKonect?node-id=1582-9128).

### Logo pulse follow-up

The current loader preserves the approved resting logo. Figma's motion export
for 1625:8718 returned no motion tracks. Its pulse is a prototype transition
between frames, so exact animation remains pending rather than using guessed
timing. The Figma motion skill documents this limitation:

> Prototype interactions aren't currently supported in MCP. Keyframes on the canvas are visible, but not the smart animate interactions between frames or their transition settings. Code generated from this selection will represent the start and end states, not the transition between them.

Loading never resolves a payment or other operation automatically. Callers must
use the authoritative operation state. Device testing is still needed for native
SDK behavior and platform accessibility features.

## Step 3: navigation and Home screens

Open [the local app preview](http://localhost:8081/app-preview) to review both
Home screens and switch modes without signing in. The ribbon labels sample
data; **States** shows setup, verification, empty, loading and error variants.
The preview never changes the real account and redirects in production builds.

Run `npm run check:navigation` for the account/mode regression checks.
See [docs/STEP3.md](docs/STEP3.md) for route changes, Figma references,
verification, and the remaining backend dependencies.

## Step 5: search, profiles and requests

Open [the local discovery preview](http://localhost:8081/discovery-preview) to
test What → Where → When, provider results and filters, profiles/photos/reviews,
Saved, Book again and the targeted-request form. Customer Home now links into
this journey. **States** includes a failed-send scenario that preserves the draft.
All preview submissions are labelled samples. Real free-request submission and
dated availability still need the developer's backend contract; the new journey
does not call the old paid checkout. Run `npm run check:discovery` and see
[docs/STEP5.md](docs/STEP5.md) for the API connection points and validation.

## Step 6: requests and paid inspections

Open [the local inspection preview](http://localhost:8081/booking-preview).
Use **States** to view the same booking as customer/provider, try a save failure,
or reset the sample stage. Provider response → customer deposit/address →
verified sample payment → provider findings/completion → awaiting final quote.
Pending/failed payment stays unconfirmed; no real charge or backend write occurs.
Run `npm run check:inspection`, `npm run check:quotes`, `npm run check:work`, `npm run check:finance`, `npm run check:catalog`, `npm run check:account`, `npm run check:messaging`, `npm run check:notifications`, `npm run check:recovery` and `npm run check:account-support`. Step 9 previews include `/finance-preview`, `/provider-preview`, `/account-preview`, `/messages-preview`, `/notifications-preview`, `/recovery-preview` and `/support-preview`, linked from `/app-preview` and the local sign-in preview. They use fictional records and never transfer money, upload an ID or delete a real account. The recovery preview includes verified email, previous-identity review, activity challenge, new-number verification and support fallback. Its States menu provides explicit fictional outcomes; the public `/recovery` route cannot change a contact until the ownership service is connected. See [Step 9](docs/STEP9.md), [Step 8](docs/STEP8.md), [Step 7](docs/STEP7.md), [Step 6](docs/STEP6.md) and
[remaining implementation gates](docs/IMPLEMENTATION_GATES.md).

The signed-in Account tabs now share the new Figma screens and preserve the same
identity across modes. Legacy settings/profile/card links open protected
`/account-settings` screens. Known public photo and introduction updates retain
their existing API paths; new contact, lifecycle and secure-card operations remain
unavailable until their services are verified. Missing records are not presented
as empty accounts or successful operations.

Open [the Account adapter preview](http://localhost:8081/account-adapter-preview)
to inspect the same presentation with a fictional API response. It cannot sign
in, upload a photo or change a real account. Run `npm run check:live-account` and
`npm run check:http-session` for owned-response and actual HTTP-link checks.
The latter uses mocked transport/store dependencies without contacting the backend.

The live Messages tabs and old chat route also share the new design. Chat history
opens only after the conversation is found in the signed-in account's inbox;
recipient details in a URL cannot establish ownership. Sending, read writes and
photo uploads remain unavailable until verified contracts exist.
Open [the message reader preview](http://localhost:8081/messages-adapter-preview)
for search, both modes, retained drafts and read-error retry using fictional data.
Run `npm run check:live-messages` for participant and read-coordinator checks.

Provider service/calendar/earnings links now share the new secondary screens.
Known service and financial records stay separate from new publication, weekday,
archive, bank-verification and payout permissions. Missing data stays unavailable;
an old booking total does not become a withdrawable wallet balance.
Open [the provider reader](http://localhost:8081/provider-adapter-preview) and
[the financial reader](http://localhost:8081/finance-adapter-preview) for labelled
fictional response data and failure states. These readers perform no uploads,
service writes or money movements. Run `npm run check:live-catalog` and
`npm run check:live-finance`; see Step 9 for the latest 265-check record and live gates.

The direct review route now uses the shared review fields and fresh participant
history. Prepare a draft in [the review reader](http://localhost:8081/review-adapter-preview);
it cannot submit a real review or fabricate completion proof. Home/discovery and
verification reads are tied to the current account. Old provider settings and
password-recovery links enter the new flows; password recovery no longer shows
timed success without a server response. Public profile photos use native URI
files on Android/iOS and image bytes with a proper multipart boundary on web.
Run `npm run check:live-bookings`, `npm run check:public-photo` and
`npm run check:live-verification` for the added adapter checks. These checks use
fictional data and mocked transport; no photo or identity inquiry is uploaded.

## Project info

This is a native cross-platform mobile app created with [Rork](https://rork.com)

**Platform**: Native iOS & Android app, exportable to web
**Framework**: Expo Router + React Native

## How can I edit this code?

There are several ways of editing your native mobile application.

### **Use Rork**

Simply visit [rork.com](https://rork.com) and prompt to build your app with AI.

Changes made via Rork will be committed automatically to this GitHub repo.

Whenever you make a change in your local code editor and push it to GitHub, it will be also reflected in Rork.

### **Use your preferred code editor**

If you want to work locally using your own code editor, you can clone this repo and push changes. Pushed changes will also be reflected in Rork.

If you are new to coding and unsure which editor to use, we recommend Cursor. If you're familiar with terminals, try Claude Code.

The only requirement is having Node.js & Bun installed - [install Node.js with nvm](https://github.com/nvm-sh/nvm) and [install Bun](https://bun.sh/docs/installation)

Follow these steps:

```bash
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun i

# Step 4: Start the instant web preview of your Rork app in your browser, with auto-reloading of your changes
bun run start-web

# Step 5: Start iOS preview
# Option A (recommended):
bun run start  # then press "i" in the terminal to open iOS Simulator
# Option B (if supported by your environment):
bun run start -- --ios
```

### **Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

## What technologies are used for this project?

This project is built with the most popular native mobile cross-platform technical stack:

- **React Native** - Cross-platform native mobile development framework created by Meta and used for Instagram, Airbnb, and lots of top apps in the App Store
- **Expo** - Extension of React Native + platform used by Discord, Shopify, Coinbase, Telsa, Starlink, Eightsleep, and more
- **Expo Router** - File-based routing system for React Native with support for web, server functions and SSR
- **TypeScript** - Type-safe JavaScript
- **React Query** - Server state management
- **Lucide React Native** - Beautiful icons

## How can I test my app?

### **On your phone (Recommended)**

1. **iOS**: Download the [Rork app from the App Store](https://apps.apple.com/app/rork) or [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. **Android**: Download the [Expo Go app from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
3. Run `bun run start` and scan the QR code from your development server

### **In your browser**

Run `bun start-web` to test in a web browser. Note: The browser preview is great for quick testing, but some native features may not be available.

### **iOS Simulator / Android Emulator**

You can test Rork apps in Expo Go or Rork iOS app. You don't need XCode or Android Studio for most features.

**When do you need Custom Development Builds?**

- Native authentication (Face ID, Touch ID, Apple Sign In)
- In-app purchases and subscriptions
- Push notifications
- Custom native modules

Learn more: [Expo Custom Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)

If you have XCode (iOS) or Android Studio installed:

```bash
# iOS Simulator
bun run start -- --ios

# Android Emulator
bun run start -- --android
```

## How can I deploy this project?

### **Publish to App Store (iOS)**

1. **Install EAS CLI**:

   ```bash
   bun i -g @expo/eas-cli
   ```

2. **Configure your project**:

   ```bash
   eas build:configure
   ```

3. **Build for iOS**:

   ```bash
   eas build --platform ios
   ```

4. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

For detailed instructions, visit [Expo's App Store deployment guide](https://docs.expo.dev/submit/ios/).

### **Publish to Google Play (Android)**

1. **Build for Android**:

   ```bash
   eas build --platform android
   ```

2. **Submit to Google Play**:
   ```bash
   eas submit --platform android
   ```

For detailed instructions, visit [Expo's Google Play deployment guide](https://docs.expo.dev/submit/android/).

### **Publish as a Website**

Your React Native app can also run on the web:

1. **Build for web**:

   ```bash
   eas build --platform web
   ```

2. **Deploy with EAS Hosting**:
   ```bash
   eas hosting:configure
   eas hosting:deploy
   ```

Alternative web deployment options:

- **Vercel**: Deploy directly from your GitHub repository
- **Netlify**: Connect your GitHub repo to Netlify for automatic deployments

## App Features

This template includes:

- **Cross-platform compatibility** - Works on iOS, Android, and Web
- **File-based routing** with Expo Router
- **Tab navigation** with customizable tabs
- **Modal screens** for overlays and dialogs
- **TypeScript support** for better development experience
- **Async storage** for local data persistence
- **Vector icons** with Lucide React Native

## Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── _layout.tsx    # Tab layout configuration
│   │   └── index.tsx      # Home tab screen
│   ├── _layout.tsx        # Root layout
│   ├── modal.tsx          # Modal screen example
│   └── +not-found.tsx     # 404 screen
├── assets/                # Static assets
│   └── images/           # App icons and images
├── constants/            # App constants and configuration
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Custom Development Builds

For advanced native features, you'll need to create a Custom Development Build instead of using Expo Go.

### **When do you need a Custom Development Build?**

- **Native Authentication**: Face ID, Touch ID, Apple Sign In, Google Sign In
- **In-App Purchases**: App Store and Google Play subscriptions
- **Advanced Native Features**: Third-party SDKs, platform-specifc features (e.g. Widgets on iOS)
- **Background Processing**: Background tasks, location tracking

### **Creating a Custom Development Build**

```bash
# Install EAS CLI
bun i -g @expo/eas-cli

# Configure your project for development builds
eas build:configure

# Create a development build for your device
eas build --profile development --platform ios
eas build --profile development --platform android

# Install the development build on your device and start developing
bun start --dev-client
```

**Learn more:**

- [Development Builds Introduction](https://docs.expo.dev/develop/development-builds/introduction/)
- [Creating Development Builds](https://docs.expo.dev/develop/development-builds/create-a-build/)
- [Installing Development Builds](https://docs.expo.dev/develop/development-builds/installation/)

## Advanced Features

### **Add a Database**

Integrate with backend services:

- **Supabase** - PostgreSQL database with real-time features
- **Firebase** - Google's mobile development platform
- **Custom API** - Connect to your own backend

### **Add Authentication**

Implement user authentication:

**Basic Authentication (works in Expo Go):**

- **Expo AuthSession** - OAuth providers (Google, Facebook, Apple) - [Guide](https://docs.expo.dev/guides/authentication/)
- **Supabase Auth** - Email/password and social login - [Integration Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- **Firebase Auth** - Comprehensive authentication solution - [Setup Guide](https://docs.expo.dev/guides/using-firebase/)

**Native Authentication (requires Custom Development Build):**

- **Apple Sign In** - Native Apple authentication - [Implementation Guide](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- **Google Sign In** - Native Google authentication - [Setup Guide](https://docs.expo.dev/guides/google-authentication/)

### **Add Push Notifications**

Send notifications to your users:

- **Expo Notifications** - Cross-platform push notifications
- **Firebase Cloud Messaging** - Advanced notification features

### **Add Payments**

Monetize your app:

**Web & Credit Card Payments (works in Expo Go):**

- **Stripe** - Credit card payments and subscriptions - [Expo + Stripe Guide](https://docs.expo.dev/guides/using-stripe/)
- **PayPal** - PayPal payments integration - [Setup Guide](https://developer.paypal.com/docs/checkout/mobile/react-native/)

**Native In-App Purchases (requires Custom Development Build):**

- **RevenueCat** - Cross-platform in-app purchases and subscriptions - [Expo Integration Guide](https://www.revenuecat.com/docs/expo)
- **Expo In-App Purchases** - Direct App Store/Google Play integration - [Implementation Guide](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)

**Paywall Optimization:**

- **Superwall** - Paywall A/B testing and optimization - [React Native SDK](https://docs.superwall.com/docs/react-native)
- **Adapty** - Mobile subscription analytics and paywalls - [Expo Integration](https://docs.adapty.io/docs/expo)

## I want to use a custom domain - is that possible?

For web deployments, you can use custom domains with:

- **EAS Hosting** - Custom domains available on paid plans
- **Netlify** - Free custom domain support
- **Vercel** - Custom domains with automatic SSL

For mobile apps, you'll configure your app's deep linking scheme in `app.json`.

## Troubleshooting

### **App not loading on device?**

1. Make sure your phone and computer are on the same WiFi network
2. Try using tunnel mode: `bun start -- --tunnel`
3. Check if your firewall is blocking the connection

### **Build failing?**

1. Clear your cache: `bunx expo start --clear`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && bun install`
3. Check [Expo's troubleshooting guide](https://docs.expo.dev/troubleshooting/build-errors/)

### **Need help with native features?**

- Check [Expo's documentation](https://docs.expo.dev/) for native APIs
- Browse [React Native's documentation](https://reactnative.dev/docs/getting-started) for core components
- Visit [Rork's FAQ](https://rork.com/faq) for platform-specific questions

## About Rork

Rork builds fully native mobile apps using React Native and Expo - the same technology stack used by Discord, Shopify, Coinbase, Instagram, and nearly 30% of the top 100 apps on the App Store.

Your Rork app is production-ready and can be published to both the App Store and Google Play Store. You can also export your app to run on the web, making it truly cross-platform.
