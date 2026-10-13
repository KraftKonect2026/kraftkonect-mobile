# KraftKonect design review — 13 October 2026

The current main screen families were compared with KraftKonect Figma and the
handoff. This review found and corrected frontend mismatches. It does **not**
certify every prototype frame, live backend behavior or native-device behavior.
All work is local; no commit, GitHub push, deployment, EAS build or OTA publication.

## Sources and scope

- Figma: `r9tDEePO6S96nPWlE2fw2c`, current App page `0:1`.
- Handoff: [Original product handoff](KraftKonect_Codex_Handoff.md), copied
  unchanged from Joshua's supplied Downloads document for repository delivery.
- Current source inventory: 259 direct phone-width frames across 13 sections,
  including 24 hidden feedback references and 16 loading-animation phases.
- [Frame coverage inventory](DESIGN_AUDIT_SCREENS.csv) maps every inventoried
  frame to its shared implementation family and development entry. It explicitly
  identifies frames that were not individually rendered in this review. An
  inventory entry is not a visual pass.
- Fresh design contexts/screenshots cover Home in both modes, sign-in, role
  choice, provider results/profile, customer/provider messages, Account, services,
  availability, earnings, bank selection/no results, recovery, notifications and
  their empty state, review entry, deletion information, Bookings and the resting
  payment loader. Resolved child contexts were used for overridden artwork.

## Corrections made

| Area | Finding and final change |
| --- | --- |
| Provider onboarding | The convenience export for the provider role contained the customer briefcase. Resolved `I983:3367;983:3276` and downloaded its actual hand-and-package vector `b50cf.svg`. Its 30×30.0001 root is preserved inside the 42px badge. |
| Home cards | Compact service text now uses the source 12px medium role, compact ratings the 16px line height, and recommendation cards the 8px image/copy gap. Search text uses 14px/20px. |
| Home controls | The 44px forward touch control no longer expands the source 36px heading layout. Saved providers use the approved filled-heart vector on the white circle. Provider earnings labels/numbers retain the source 4px gap; Manage retains its neutral border. |
| Messages | Conversation rows are grouped without an extra 20px between rows. Customer/provider subtitles, search text, avatar initials and time text follow the source roles. |
| Real message route | Removed the mode switch from the authenticated Messages screen. Mode switching belongs on Home and Account. Native top safe-area spacing is retained; identity and owned-message readers are unchanged. |
| Bank search | Replaced stretched SearchAI images with the shared 24px slot containing the original 17.5×18.5 vector. Restored search copy, Choose your bank, 8px bank-row spacing and the empty-state grouping. Resolved `I1520:7787;1161:5024` rather than using its incorrect whole-frame calendar export. |
| Input focus | Removed the browser's second black outline from the inner input. The wrapper's visible blue focus border remains. |
| Notifications | Corrected group typography, white unread-card surface and New! label. The development batch-read control is in States, keeping the feed layout faithful. Empty notifications use the actual Bell rather than a calendar. |
| Bell artwork | Reused the exact approved transparent Bell vector already used by Account, from the same mapped Bell 24 component. This removes the previous PNG's white square on the blue empty-state badge and retains vector root geometry. |
| Account deletion information | Restored the source 13px supporting text for record retention. No deletion policy or action was changed. |
| Navigation and product copy | A direct preview Bookings/Jobs entry now opens the implemented booking journey rather than the old placeholder. Invalid preview tab values fall back to Home. Live Home notification failures describe availability rather than promising a future implementation step. |

## Verification

- **269 existing domain/read/auth regression checks passed**. The checks cover
  stable identity, verification/discovery gates, unpaid requests, inspections,
  versioned quotes, fee conservation, completion, cancellation/refund/repayment,
  payout races, messaging, notifications, recovery, account lifecycle and owned
  live readers. No real payment, message, upload, identity inquiry or deletion was
  executed. Log: `.expo/design-review-checks.log`.
- TypeScript, scoped ESLint and `git diff --check` passed for the changed files.
- The final static scan found **164 asset references / 123 unique assets**, no
  missing/empty files and no direct numeric SVG root-size differences. This is a
  file/direct-callsite check, not a claim that every dynamic scene was rendered.
  Report: `.expo/design-audit-assets.json`.
- Browser evidence is saved at
  `C:\Users\Joshua\Documents\KK App\review\design-audit-2026-10-13`.
  The screenshots/DOM observations include main screen families at 393px and
  focused small-phone checks at 320px for Home, messages, bank no-results,
  availability and deletion information. Those pages had no horizontal page
  overflow. Gallery artwork loaded when scrolled into view; initial lazy-loading
  observations are retained in the raw evidence, rather than labelled missing
  assets. New provider artwork and bank-vector geometry were measured in the
  rendered page.
- Message search/no-results, bank search/no-results/clear, and the direct Jobs
  redirect were exercised. The existing test login/sign-out/mode-switch checks
  from this session remain documented in Step 4. Saved sample records were not
  reset to fabricate matching Figma amounts or dates.
- Android export is a local bundle/asset check. It is **not** installation or
  testing on a native device. The final export record is noted below.

Final Android export passed: 3,494 modules, 162 assets, 7.22 MB,
`.expo/design-review-complete-android`, bundle
`entry-d224c3e94ddceba5c8d4be9b46367747.hbc`.
Log: `.expo/design-review-complete-export.log`.

## Intentional differences

Development labels, test credentials and scenario controls identify fictional
data. Native status bars and bottom safe areas come from the OS; web does not
draw a fake 9:41 status bar. API/fixture people, dates, photos, balances, review
counts and service descriptions remain data. They are not replaced with literal
Figma examples to produce a misleading screenshot. Required editable scope/time
fields, unknown-data labels and explicit unavailable-write states follow the
handoff and the existing contract evidence.

## Outstanding checks

1. **Loading motion is not complete.** The resting mark's source geometry is
   present. The authoritative `get_motion_context` read for `1539:8169` returned
   `{"nodes":[]}`. Prototype pulse phases exist in Figma, but a verified runtime
   animation has not been implemented. The
   [Figma motion skill](C:/Users/Joshua/.codex/plugins/cache/openai-curated-remote/figma/15.0.0/skills/figma-implement-motion/SKILL.md)
   requires: "Don't fabricate motion. If a node has no motion data in the response,
   leave it static." Its transition-export diagnostic says:

   > Prototype interactions aren't currently supported in MCP. Keyframes on the canvas are visible, but not the smart animate interactions between frames or their transition settings. Code generated from this selection will represent the start and end states, not the transition between them.

2. **Hidden feedback/status references need a reliable visual source.** In
   particular, the dedicated payout/bank outcome panels previously returned blank
   renders. Their exact visual fidelity is not certified. Shared nonblocking
   feedback and honest operation states are implemented; no timed success is
   substituted for actual operation results.
3. **Live integration remains open.** New phone auth, requests, notifications,
   messaging writes, quote/payment/ledger operations, publication/weekdays, bank
   verification, payouts, contact recovery and lifecycle operations need working,
   confirmed backend contracts. The last endpoint audit returned HTTP 503.
   Several of these complete interactions are development samples; authenticated
   routes retain honest read/error boundaries. The same user ID and production
   credentials are not replaced by a local test identity.
4. **Native-device acceptance remains open.** Safe areas, keyboard avoidance,
   native navigation, larger system text, screen readers, Persona, actual SMS and
   push permissions, attachments, hosted checkout and account changes need a
   compatible device/runtime and working services. A browser preview and an
   Android bundle cannot establish those results.
5. **Every frame has not been individually compared in this pass.** The coverage
   CSV separates fresh representative visual evidence from source inventory and
   earlier frontend gates. Continue with frame-by-frame acceptance for all
   exceptional states before release; do not label the app a 100% match based on
   this review alone.

The review is complete as an audit with local corrections and explicit remaining
gates. The full implementation/release goal remains unfinished. See
[Implementation gates](IMPLEMENTATION_GATES.md).
