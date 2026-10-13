# Account artwork

Exact static assets from KraftKonect Figma `r9tDEePO6S96nPWlE2fw2c`. Temporary Figma URLs are not referenced by the app.

Account frames: 459:231 / 488:3. `0124c.svg`, `c6d05.svg`, `793aa.svg`, `30b49.svg`, `82b9f.svg` and `f46d6.svg` have 24×24 roots. Customer Saved and reviews use the isolated 20×20 `d1377.svg` (I1162:6485;857:103) and `fb33e.svg`. Location uses the existing 14.8918×18 `d1e99.svg` centred in its 24px slot. Forward, calendar and native navigation artwork are reused from the existing library.

The Figma Code Connect map calls for both Account frames returned a seat/plan limitation. Their connected Simple Design System components (`Bell`, `CreditCard`, `HelpCircle`, `Shield`) are not installed in this React Native repository. The approved visible vector children were retrieved individually with high-fidelity design context rather than substituted with a different icon library:

- Bell: I1148:4643;1143:3905;1141:3871;7758:11129 → `aa40c.svg`, root 20.5002×22.4965, at (1.7499, 0.75) in a 24px slot.
- Payment card: I1148:4655;1143:3905;1141:3887;7758:11429 → `f5026.svg`, root 24.5×18.5, at (-0.25, 2.75).
- Help: I1148:4667;1143:3905;1141:3919;7758:11723 → `7d3b1.svg`, root 22.5×22.5, at (0.75, 0.75).
- Shield: I1148:4679;1143:3905;1141:3903;7758:12233 → `46047.svg`, root 18.5×22.5, at (2.75, 0.75).

Notification preferences (459:395 / 488:229) use unedited 48×28 `ae317.svg` and `cdea8.svg` inside 52×44 switch targets. Help (459:492) uses 24×24 `c00f0.svg` and `75ba6.svg`. Verification's isolated leading icon (I1347:7124;1143:3905 / I1347:7134;1143:3905) uses 24×24 `143ee.svg`; it is distinct from the previous filled-colour check.

Profile, banner and gallery fills are data supplied. The local fixture reuses fictional source photos from onboarding; private ID documents are never rendered or stored as public images. The native app supplies its system status bar.

The same Bell primitive is reused by Home and the empty notification badge. The
override `I1162:6377;1161:5024;1141:3871` resolves to Bell 24, not the calendar in
the whole-frame convenience export. Reusing the exact transparent SVG also avoids
the previous PNG's white square on the pale blue badge. Its root geometry is unchanged.

The protected live Account adapters reuse these same rows, roots and slots. Real avatars and provider photos use API URLs, with neutral placeholders for absent data. Provider editing reuses `ProfilePhotos`: 144px cover, 76px avatar, 182px group and 24px camera artwork in its 40px control. The live response is never replaced by a Figma example photograph or fictional account. `/account-adapter-preview` checks the same presentation with a labelled fictional response and no uploads or account writes.

Payments use the 24×24 history icon `6c26a.svg` from 459:451. Empty reviews (1162:5620) use `8805f.svg` at its original 28×28 inside a 56px badge. Review cards reuse the original 10×10 `0cb8d.svg` (467:798). Saved-card credentials are intentionally delegated to the secure checkout integration, per the handoff.
