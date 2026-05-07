# AutoFill Feature Plan

Add an "AutoFill" capability to the Luhn Card Generator extension so a generated test card can be injected into payment form fields on the active tab. Strictly for QA/sandbox/educational use.

## Changes

### 1. `extension/manifest.json`
- Add `"permissions": ["activeTab", "scripting"]`
- Add `"host_permissions": ["<all_urls>"]` (needed to message a content script on arbitrary test pages; documented as QA-only in UI)
- Register content script:
  ```
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle",
    "all_frames": true
  }]
  ```

### 2. `extension/content.js` (new)
- Listens via `chrome.runtime.onMessage` for `{ type: "AUTOFILL", card }`
- Field detection strategy, in priority order:
  1. `autocomplete` attribute: `cc-number`, `cc-exp`, `cc-exp-month`, `cc-exp-year`, `cc-csc`, `cc-name`
  2. `name`/`id`/`placeholder`/`aria-label` regex match against:
     - number: `card.*number|cc-?num|cardnum|number`
     - expiry combined: `cc-?exp(?!-)|expir|exp-?date`
     - month: `exp.*month|cc-?exp-?m|month`
     - year: `exp.*year|cc-?exp-?y|year`
     - cvv: `cvv|cvc|csc|security.*code`
     - name: `card.*holder|cc-?name|name.*on.*card|holder`
  3. Search inputs inside same form/section; also walk `iframe`-less same-origin subframes via `all_frames: true`
- Format helpers:
  - Expiry combined → `MM/YY` (also try `MM / YY` if input has slash already by inspecting placeholder)
  - Split month/year fields → `MM` and `YY` or `YYYY` based on `maxlength`
- Filling:
  - Use native setter (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) to bypass React's synthetic input handling
  - Dispatch `input` and `change` events with `bubbles: true`
  - Also dispatch `blur` for Vue/Angular validators
- Returns `{ filled: number, fields: string[] }` to popup; popup shows toast or "No payment form detected."

### 3. `extension/popup.js`
- Each generated card row gets an "AutoFill" button (alongside existing copy actions)
- Also a top-level "AutoFill first card" quick action
- Handler:
  ```
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // Ensure content script present (programmatic injection fallback)
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "AUTOFILL", card });
    showToast(res.filled ? `Filled ${res.filled} field(s)` : "No payment form detected.");
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content.js"] });
    // retry sendMessage
  }
  ```
- Card payload: `{ number, expMonth, expYear, cvv, name }` — name is generated client-side from a small fixed pool (e.g. "QA Tester", "Test User") since current generator has no name field

### 4. `extension/popup.html` + `popup.css`
- Add AutoFill button styling (subtle accent)
- Add per-row inline button

### 5. `src/routes/index.tsx` (landing page)
- Add a short "AutoFill" section under "How to use":
  - "Open a sandbox checkout page, click AutoFill on a generated card"
  - Reiterate disclaimer: educational/QA/sandbox only

### 6. Repackage
- Rebuild `public/luhn-cards.zip` via existing nix zip command

## Out of scope
- Persisting AutoFill across page navigations
- Filling cross-origin iframes (Stripe Elements, Adyen hosted fields) — these are deliberately not supported; UI message will say "No payment form detected." in that case
- Submitting the form automatically

## Disclaimer (enforced in UI)
Popup header and landing page will state: "Educational, QA, and sandbox payment testing only. Do not use on real payment pages."
