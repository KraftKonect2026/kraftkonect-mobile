# Approved Figma onboarding assets

File: `r9tDEePO6S96nPWlE2fw2c` (KraftKonect).
Source screens: welcome `360:9131`, mode `340:27`, registration `340:53`,
code `340:75`, name `340:104`, customer area `340:122`, manual area `380:9344`,
provider work/area/profile/gallery/service `342:2`, `342:36`, `342:63`,
`342:206`, `342:158`, verification `342:83`, `342:111`, `342:131`, completion
`342:241`, sign-in `425:5`, `425:38`, account missing `425:76`, recovery
`524:37`, `528:2/35/72/105/134/166/207/235/264/301`, review `501:71`,
support `1605:8510`, splash `332:8980`.

Assets were downloaded from Figma's export/context tools. SVG root width/height
and viewBox are unchanged. Whole-screen screenshots are kept outside the code
for review; no screen screenshot is used to implement an interface.

| Asset | Source/use | Original geometry |
| --- | --- | --- |
| `intro-illustration.png` | Illustration-only graphic `396:19117`; visible child contexts inspected | 345 × 339.306 design units |
| `blue-lockup.png` | Blue wordmark `983:2173` | 184.923874 × 63 design units |
| `splash-mark.svg` | White mark `338:9087` | 117.896 × 144.9 |
| `542d7.svg` | Onboarding Back | 24 × 24 |
| `799c1.svg` | Onboarding brand mark | 39 × 47 |
| `405d3.svg` | Mode card arrow | 22 × 22 |
| `1b3b6.svg` | Customer choice artwork | 42 × 42 |
| `b50cf.svg` | Provider choice, resolved from `I983:3367;983:3276`; hand and package | 30 × 30.0001 inside the 42px blue-soft badge with 8px corners |
| `3e0a0.svg` | Customer-location graphic | 48 × 48 |
| `702e9.svg` | Photo camera overlay | 24 × 24 |
| `49a3c.svg` | Add work photo | 24 × 24 |
| `91c63.svg` | Remove work photo | 16 × 16 |
| `c2e9c.svg`, `1ac41.svg` | Recovery unselected/selected radio | 22 × 22 |
| `383cf.svg` | Recovery activity failure, inside the 64px red slot | 24 × 24 |
| `29380.png` | Provider avatar including ring/shadow; preview only | 80 × 80 |

The sample sink photo in profile/gallery/service previews reuses the identical
approved Figma image at `assets/design/1b9df.png`. Real profile images come from
the user's selected public photos. Example images never become actual account
photos. The native Expo splash uses the already approved white brand PNG at
`assets/brand/kk-mark-white.png`, with the blue foundation background.

Recovery completion reuses the approved `assets/discovery/5636f.svg` at its
32 × 32 root dimensions inside the 64px blue slot. Private ID/selfie captures
are fictional local references in the preview; no personal document is used as
an implementation asset or uploaded. Recovery options and activity answers
remain data supplied by the controller, rather than Figma example answers.

The original whole-card convenience export `9d7d8.svg` contained the customer
briefcase rather than the provider instance swap. The resolved RoleProvider child
context supplies `b50cf.svg`; its bytes and root dimensions are retained unchanged.
