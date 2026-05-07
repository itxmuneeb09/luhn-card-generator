## Luhn Card Generator — Chrome Extension

A Manifest V3 Chrome extension popup that generates Luhn-valid test card numbers from a BIN prefix, plus matching expiry and CVV. The Lovable web app serves as a download/landing page for the packaged `.zip`.

### What gets built

**1. The extension (`/extension/`)**
- `manifest.json` — MV3, popup-only, no host permissions needed
- `popup.html` + `popup.css` — clean dark UI matching the landing page
- `popup.js` — generation logic + UI handlers
- `icon.png` — simple credit-card icon (128px)

**Popup UI:**
- Input: BIN starting digits (e.g. `414720`)
- Input: Card length (default 16, range 13–19)
- Input: How many to generate (default 10, max 100)
- Buttons: **Generate**, **Export CSV**, **Export TXT**
- Results list — each row shows `NUMBER  MM/YY  CVV`
  - Click any single field → copies that value
  - Click row background → copies `number|MM|YY|CVV`
  - Toast confirms copy

**Generation logic:**
- Take BIN digits, pad with random digits up to `length - 1`, compute Luhn check digit, append
- Expiry: random month, year = current year + 1..4
- CVV: random 3-digit (4 if BIN starts with `34`/`37` Amex)
- Dedup within a batch

**2. Landing page (`src/routes/index.tsx`)**
Replaces the placeholder. Sections:
- Hero: name, one-line description, **Download Extension** button (uses fetch+blob pattern)
- "How to install" — 4 numbered steps for `chrome://extensions` → Developer mode → Load unpacked
- "How to use" — short blurb about BIN input and copy/export
- Disclaimer: "For testing/QA only — these are not real cards and cannot be used for payments."

**3. Packaging**
- Build script zips `/extension/` into `/public/luhn-cards.zip` using `nix run nixpkgs#zip`
- Served as static asset, downloaded via fetch+blob in the landing page button

### Technical notes

- All generation runs in the popup — no network, no storage permissions, no content scripts
- Manifest permissions: none required
- Pure vanilla JS in the extension (no React build step inside `/extension/`)
- Landing page uses existing shadcn `Button`, `Input`, `Card` components and design tokens from `src/styles.css`
- No backend / Lovable Cloud needed

### Out of scope
- Cardholder name generation
- Auto-fill into web pages
- Persisting generated batches across popup opens
- Publishing to Chrome Web Store (user loads unpacked)
