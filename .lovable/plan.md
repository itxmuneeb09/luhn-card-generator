# Aegon Hitter — Rebrand & Workflow Overhaul

Rename the extension to **Aegon Hitter**, drop the batch generator UI, and replace it with a saved-BIN library + one-click Start that generates a single Luhn-valid card and AutoFills the active page. Strictly QA / sandbox / educational use — no auto-submit.

## Extension changes (`/extension/`)

### `manifest.json`
- `name`: "Aegon Hitter"
- `description`: "One-click test card AutoFill from saved BINs. QA and sandbox use only."
- Add `"storage"` to permissions (alongside existing `activeTab`, `scripting`)
- Keep `host_permissions: ["<all_urls>"]` and the `content.js` content script registration
- Bump version to `2.0.0`
- New `icon.png` — neon shield/cyber crest replacing the credit card

### `popup.html` + `popup.css` (full redesign)
Dark cyber UI:
- Background `#05060a` with subtle scanline/grid overlay
- Neon accents: cyan `#22d3ee`, magenta `#f0abfc`, lime `#a3e635`
- Mono font (`JetBrains Mono`/`ui-monospace`), uppercase tracked labels
- Glowing primary "START" button with pulse on hover
- Tabs / sections: **Hitter** (main), **BINs** (library), **Settings**

Sections:
1. **Header** — "AEGON HITTER" wordmark + small "QA / SANDBOX ONLY" tag
2. **Active BIN card** — shows currently active BIN label + digits, "Change" link to BINs tab
3. **START button** — large, full-width; on click → generate + autofill
4. **Status line** — last result ("Filled 4 fields" / "No payment form detected.")
5. **BINs tab** — list of saved BINs, each with: label, digits, length, Set Active, Delete; "Add BIN" form (label, digits 6–18, length 13–19)
6. **Settings tab** — global cardholder name input, "Save" button

### `popup.js`
Logic only — no batch generation, no CSV/TXT export.

State persisted in `chrome.storage.local`:
```
{
  bins: [{ id, label, digits, length }],
  activeBinId: string | null,
  cardholderName: string
}
```

Functions:
- `loadState()` / `saveState(patch)` — chrome.storage.local wrapper
- `addBin({label, digits, length})`, `deleteBin(id)`, `setActive(id)`
- `luhnCheckDigit(s)` (kept), `generateCardNumber(bin, length)`, `randomExpiry()`, `randomCvv(bin)` (Amex → 4 digits)
- `start()`:
  1. Load active BIN; if none → status "Add and select a BIN first."
  2. Generate one card `{ number, mm, yy, cvv, name }`
  3. `chrome.tabs.query({active, currentWindow})` → `chrome.tabs.sendMessage(tab.id, {type:"AUTOFILL", card})`
  4. On failure, fall back to `chrome.scripting.executeScript({files:["content.js"]})` then retry
  5. Update status line + flash glow on START button
- Keyboard: Enter inside popup triggers Start

### `content.js`
**Keep current detection + filling logic unchanged** (already covers cc-number/cc-exp/cc-csc/cc-name + name/id/placeholder regexes, native setter, input/change/blur events).

Add explicit safeguard at top of file comment: "Never clicks submit/pay buttons — fills only."

No code path that calls `.click()` on buttons or submits forms.

## Landing page (`src/routes/index.tsx` + tokens)

Full redesign, dark cyber theme.

### Design tokens (`src/styles.css`)
Add semantic tokens:
- `--background: oklch(0.13 0.02 260)` (near-black blue)
- `--foreground: oklch(0.95 0.01 240)`
- `--primary: oklch(0.78 0.18 200)` (neon cyan)
- `--accent: oklch(0.72 0.25 320)` (magenta)
- `--success: oklch(0.82 0.2 140)` (lime)
- `--card: oklch(0.17 0.02 260)`
- `--border: oklch(0.28 0.03 250)`
- `--gradient-cyber: linear-gradient(135deg, var(--primary), var(--accent))`
- `--shadow-glow: 0 0 40px color-mix(in oklab, var(--primary) 40%, transparent)`

### Page sections
- **Hero**: animated grid backdrop, glowing "AEGON HITTER" wordmark, tagline ("One-click test card autofill for QA engineers"), primary `Download Extension` button (keeps fetch+blob pattern, file is now `aegon-hitter.zip`)
- **Workflow** (3 steps with neon-bordered cards):
  1. Save your BINs
  2. Pick the active one
  3. Click START on a sandbox checkout
- **Install** (keep current 4-step `chrome://extensions` flow, restyled)
- **Disclaimer** card (kept, restyled with destructive-tinted border): explicit "QA, sandbox, demo environments only. Never auto-submits payments. Do not use on real payment pages."
- Footer: small mono "v2.0.0 · QA-only build"

### `head()` updates
- Title: "Aegon Hitter — One-click QA Card AutoFill"
- Description: "Save BINs once, click START, and AutoFill Luhn-valid test cards into your sandbox checkout — for QA engineers."

## Packaging
- Output renamed to `public/aegon-hitter.zip` (delete old `luhn-cards.zip`)
- Re-zip via existing `nix run nixpkgs#zip` command
- Update download href in landing page

## Out of scope
- Cloud sync of BINs (storage stays local)
- Per-BIN cardholder names (one global name)
- Auto-submit / one-click pay (explicitly forbidden)
- Cross-origin hosted-field iframes (Stripe Elements etc.)
- Importing/exporting BIN library
