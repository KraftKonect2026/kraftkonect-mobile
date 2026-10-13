# Step 5 Figma assets

Source: KraftKonect file `r9tDEePO6S96nPWlE2fw2c`. Downloaded locally through the Figma MCP asset URLs. No temporary URLs are used by the app. Full-screen reference screenshots are kept outside the app assets in the local review folder.

| Design nodes | Slots / callsites |
| --- | --- |
| 428:176, 428:219, 428:255 | What/Where/When; SearchAI reuses the approved existing DesignIcon; pin/search/back/close/calendar arrows in SearchFields/Parts |
| 428:333; 734:2; 734:124; 747:2; 1620:9277 | Provider covers, save hearts, small stars, filter pills and sheets in Parts/Journey |
| `I917:1438;893:1065;853:8` | Correct overridden Filter vector `24644.svg`, 24 × 14.6667, centered in the 24px icon slot. The full-frame convenience export `254fd.svg` incorrectly contained Back; it was replaced by the resolved child export. |
| 753:379 | Profile cover, 96px exported avatar around its 92px design slot, service photos, four paired gallery layers and rating/review stars in Profile and preview fixtures |
| 793:2 | Review stars and the sort glyph (root 26 × 26 preserved inside the touch target) |
| 809:4 | Full gallery photos and 80 × 60 thumbnails. The approved 82 × 7 carousel artwork remains unchanged; wrapper clipping selects its approved active/inactive shapes for the dynamic photo count. |
| 753:473; 827:1426; 753:507; 753:541 | Request service cover, back/close controls and 32px confirmation check |
| 826:65; 467:381 | Book again / Saved covers and stars. Kola's Book again cover uses the separate `930fb.png`, rather than his result cover. |

SVG files retain their exported bytes, root dimensions and aspect ratios. PNG crops follow the source slots; the 345 × 228 provider card crops a 363 × 272 cover at (-9,-22). Native layouts adapt to screen width and use OS safe areas. API-supplied imagery remains dynamic; Figma's illustrative people, reviews and prices occur only in the development preview.

Byte-identical existing covers (`1b9df`, `631d0`, `c73f3`, `eba1f`), outline heart (`9bdc8`), back (`542d7`), radio (`c2e9c`) and SearchAI (`a2717`) reuse `assets/design` or `assets/onboarding`; duplicate downloads were removed. Profile's filled heart uses its own `6b6b5` export. Compact/full reviews use their respective `ec071`/`0cb8d` stars, with the number of stars supplied by the review rating and an accessible numeric label.
