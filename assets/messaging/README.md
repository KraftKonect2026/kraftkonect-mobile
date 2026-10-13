# Messages and notifications artwork

Approved KraftKonect Figma file: `r9tDEePO6S96nPWlE2fw2c`.

- `4b014.svg`: empty inbox `459:159`, 24 × 24 root centered in its 48 × 48 slot. The slot does not scale the SVG.
- `bf893.svg`: provider notification Messages vector `1643:10744`, 24 × 24 root.
- Shared Back `542d7.svg`, Search `d67f7.svg`, Forward `18fcc.svg`, Calendar `fece3.svg` (20.8 × 20.8 root inside a 24px slot), attachment `11f21.svg`, empty Bell `d6f80.svg` (28 × 28), Check `3156e.svg` (`851:58`) and Support verification `cd3d1.svg` (16 × 16) reuse identical approved local assets.
- Support avatar uses the original approved white BrandMark `982:1819` PNG at 32px height within a 48px blue circle, and 22px within a 32px chat avatar. Provider/customer avatar initials and chat photos are dynamic data.
- The connected web CreditCard/Shield components are absent from this Expo repository. The exact visible vector fallbacks documented in `assets/account/README.md` retain their root dimensions and slot offsets. No asset paths are redrawn or modified.

Frames: Inbox `459:3`, active/request chat `459:85/123`, empty inbox `459:159`, search `1146:3969`, customer notifications `467:505`, empty notifications `1162:5610`, provider notifications `1643:10744`. Dedicated provider notification row contexts `1648:8830/8860` confirm the shared payment icon and read-row styling.

General account support uses the high-fidelity `1148:4498` frame and screenshot.
It reuses the same Back, white brand, 16px verification artwork, message bubbles
and 24px attachment control. The header retains its 56px minimum. The subtitle
is account context supplied by the controller; the design's example booking
and greeting are not invented as saved account records. Incoming messages show
their actual saved date/time and support sender. Photos remain controller data,
with the existing explicitly fictional plumbing photo used only in DEV samples.

The protected live inbox/chat readers reuse these slots and bubble styles. Real
avatar URLs are response data; absent avatars use the existing initials fallback.
Legacy DTOs cannot supply booking/support/attachment proof, so the reader keeps
that context unavailable and does not substitute a Figma example photograph or
support verification badge. The approved Back and attachment roots stay 24px in
44px targets; message bubbles retain their source 297px width and narrow-screen
maximum. The DEV-only `/messages-adapter-preview` exercises this presentation
with fictional response data and no real authentication or network writes.
