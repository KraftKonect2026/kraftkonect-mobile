# Paid inspection artwork

Step 9 provider management: `d6f80.svg` is the approved 28×28 empty-services calendar in a 56px badge (485:71). The shared sink photograph `assets/design/1b9df.png` supplies fictional, dynamic service photos in 114×84 list slots and 108×80 detail/editor slots with 16px corners. The editor's exact `assets/onboarding/702e9.svg` camera is 24×24 in its 40px translucent overlay at (34,20). Availability reuses the exact 8px `4b9ae.svg` dot and 24px `dd103.svg`/`0eb97.svg` selected/unselected radio artwork, plus shared 63×44 DayChips. No full screen render is used as interface art.

Step 9 finance additions: `00a6f.svg` from Figma 487:240 is the exact 24×24 verified-bank check beside the resolved account name. `ccb57.svg` from 1402:7696 is the exact 6×10 report-period arrow within a 44×44 button; the source flips its vertical axis, and the next-period control also mirrors horizontally. Both local files are nonempty. Search uses the exact shared `assets/design/a2717.svg` at its original 17.5×18.5 root dimensions inside the 24px SearchAI slot; flow headers use the existing 24px Back and Forward assets. The empty-bank icon override was resolved from `I1520:7787;1161:5024`, which also uses SearchAI rather than the convenience export's calendar. No temporary Figma URL remains in application code.

Protected provider catalog/financial readers reuse the same native frames,
rows, cards and approved vectors. Real service photos remain public API URLs;
the read-preview fixture resolves its image URL to the existing local sink asset.
No example photo is substituted into a live account. Unknown weekly settings do
not render a saved available-status dot. Missing bank identity/receipts do not
render a verified-bank check or a successful transfer panel. Their interactive
boundaries remain explicit until confirmed data is available.

Figma file `r9tDEePO6S96nPWlE2fw2c`, current customer/provider inspection frames. Downloaded through the asset URLs returned by `get_design_context`; no frame render is used as interface artwork.

| File | Figma frame / use | Root dimensions and slot |
| --- | --- | --- |
| 6cc70.png | 1332:6470, 1332:6553; sample customer avatar | Dynamic imagery; circle 32px in Jobs/chat, 48px in detail |
| 995c1.svg | 1332:6470; request area | 9.92785 × 12, centred in 16px slot |
| fece3.svg | 1332:6553, 469:437; appointment calendar | 20.8 × 20.8 at (1.2, 1.2) in 24px slot, including the source stroke bounds |
| f57a9.svg | 469:437, 469:483, 1334:6153; provider fee help | 14 × 14 |
| 12dea.svg | 1005:2839, 1005:2952; customer deposit information | 12 × 12 |
| 18fcc.svg | 469:437, 1332:6155; forward navigation | 24 × 24 |
| 11f21.svg | 1332:6155; attachment control | 24 × 24 inside 44px quiet control |

Exact existing assets reused: onboarding `542d7.svg` (Back, 24px); discovery `8647c.svg` (Close, 24px), `5636f.svg` (confirmation check, 32px), `17ce3.svg` (calendar Next, 24px); design `3156e.svg` (timeline Done, 24px, identical SHA-256 to the inspection export), existing BottomNavigation assets and `1b9df.png` sample service photo (56px square, cover, 12px radius). The actual app's photographs remain API supplied. Source SVG dimensions are preserved; no SVG paths are copied into TSX.

Native status bars and bottom insets come from the operating system. The Figma sample date, address, actors and amounts are replaceable data, not UI artwork.

## Final quote and confirmed job

Step 7 uses current frames 1334:6154–6156, 1005:3000/3024/3048/3072 and 1541:8573. Shared exact Back, Close, calendar, help, confirmation and forward assets above are reused.

| File | Source / use | Root dimensions and placement |
| --- | --- | --- |
| 66b3e.svg | 1541:8573 → 1652:11591 → I1652:11591;7758:11608; Report flag | 15.3333 × 18.6667 at (2.33333, 0.66667) in 20px slot |
| 6d320.svg | 1541:8573 → 1652:11596 → I1652:11596;7758:12610; Cancel | 18.6667 × 18.6667 at (0.66667, 0.66667) in 20px slot |
| 3121f.svg | 1541:8573; Manage job forward arrow | 20 × 20 |

Code Connect named web Simple Design System Flag/XCircle components without a usable native import. This Expo repository has no mapped implementation/package. The approved vector children were fetched with design context and used as native Image assets instead. Source stroke bounds and offsets are preserved. Browser comparison matched the source and all assets loaded at the intended dimensions (subpixel rounding of the flag width was 15.3229px).

## Work, completion and exceptions

Step 8 uses the current customer 1005:3286/3310/3504/3552/3576/3600/3694, 1539:9122, 1639:10430, cancellation 1097:4898/5057, 1132:4674, 1135:4732; provider 1541:8643/8707/8771/8835, 1539:9166, 1664:8855/8920, 1672:9165/9238/9284/9344; support 1097:5244/5350/5403; repayment 1402:8031 and 1442:11252/11284/11328/11450.

| File | Figma source / use | Root dimensions and slot |
| --- | --- | --- |
| 8b741.svg | 1005:3576; selected review star | 24 × 24 within 32px quiet circle and 44px touch target |
| 0e66f.svg | 1005:3576; unselected review star | 24 × 24 within the same slot |
| 9f924.svg | 1005:3552/3694; receipt link | 18 × 18 within a 44px-high accessible action |
| cd3d1.svg | 1672:9344; support verification mark | 16 × 16 |
| bee61.svg | 1672:9344; support attachment control | 24 × 24 within 44px quiet circle |

Exact shared assets reused: design `2a0eb.svg` (upcoming timeline, 24px), `3156e.svg` (Done, 24px), booking `fece3.svg` (Current, source stroke bounds), discovery `f9eaa.svg` and onboarding `c2e9c.svg` (selected/unselected choices, 22px), Back/check/Manage job arrows above. The approved white brand mark is 22px high in the 32px support avatar. Its source aspect ratio renders 17.8958px wide. Chat headers use the source 56px minimum height and can grow with wrapping/accessibility text. The illustrative report photograph is dynamic sample evidence using the existing local service artwork, never a full-frame render.

All files are nonempty, referenced by native components and included in the Android export. Browser checks showed loaded assets, preserved dimensions and no horizontal overflow at 393px and 320px; rating spacing adapts to retain five 44px touch targets on compact phones. Review and chat controls were compared with the source screenshots. Financial wording follows verified records and the handoff where Figma samples have inconsistent fee/refund amounts.
