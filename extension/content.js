/* Luhn Card Generator — content script
 * Educational / QA / sandbox payment testing only.
 * Detects payment fields on the active page and fills them with provided test data.
 */
(() => {
  if (window.__luhnAutofillInstalled) return;
  window.__luhnAutofillInstalled = true;

  const PATTERNS = {
    number: /(card.*number|cc-?num|cardnum|^number$|ccnumber)/i,
    expCombined: /(cc-?exp(?!iry-(month|year))|expir|exp-?date|expiration)/i,
    expMonth: /(exp.*mo|cc-?exp-?m|^month$|mm)/i,
    expYear: /(exp.*y(ea)?r|cc-?exp-?y|^year$|yy)/i,
    cvv: /(cvv|cvc|csc|security.*code|card.*code)/i,
    name: /(card.?holder|cc-?name|name.*on.*card|holder|ccname)/i,
  };

  const AUTOCOMPLETE = {
    "cc-number": "number",
    "cc-exp": "expCombined",
    "cc-exp-month": "expMonth",
    "cc-exp-year": "expYear",
    "cc-csc": "cvv",
    "cc-name": "name",
    "cc-given-name": "name",
  };

  function inputs() {
    return Array.from(document.querySelectorAll("input, select"));
  }

  function classify(el) {
    const ac = (el.getAttribute("autocomplete") || "").toLowerCase().trim();
    if (AUTOCOMPLETE[ac]) return AUTOCOMPLETE[ac];
    const hay = [
      el.name, el.id, el.placeholder,
      el.getAttribute("aria-label"),
      el.getAttribute("data-testid"),
    ].filter(Boolean).join(" ").toLowerCase();
    if (!hay) return null;
    // Order matters — month/year before generic exp.
    if (PATTERNS.cvv.test(hay)) return "cvv";
    if (PATTERNS.expMonth.test(hay) && !PATTERNS.expYear.test(hay)) return "expMonth";
    if (PATTERNS.expYear.test(hay) && !PATTERNS.expMonth.test(hay)) return "expYear";
    if (PATTERNS.expCombined.test(hay)) return "expCombined";
    if (PATTERNS.number.test(hay)) return "number";
    if (PATTERNS.name.test(hay)) return "name";
    return null;
  }

  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
  }

  function fire(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function fill(el, value) {
    if (el.disabled || el.readOnly) return false;
    el.focus();
    setNativeValue(el, value);
    fire(el);
    return true;
  }

  function formatExpCombined(el, mm, yy) {
    const ph = (el.placeholder || "").toLowerCase();
    if (ph.includes("yyyy")) return `${mm}/20${yy}`;
    if (ph.includes(" / ")) return `${mm} / ${yy}`;
    if (ph.includes("-")) return `${mm}-${yy}`;
    return `${mm}/${yy}`;
  }

  function formatYear(el, yy) {
    const ml = parseInt(el.getAttribute("maxlength") || "0", 10);
    if (ml === 4) return `20${yy}`;
    if (el.tagName === "SELECT") {
      // Try matching either YY or YYYY option.
      const opts = Array.from(el.options).map(o => o.value);
      if (opts.includes(`20${yy}`)) return `20${yy}`;
      if (opts.includes(yy)) return yy;
    }
    return yy;
  }

  function formatMonth(el, mm) {
    if (el.tagName === "SELECT") {
      const opts = Array.from(el.options).map(o => o.value);
      const noPad = String(parseInt(mm, 10));
      if (opts.includes(mm)) return mm;
      if (opts.includes(noPad)) return noPad;
    }
    return mm;
  }

  function autofill(card) {
    const all = inputs();
    const found = { number: [], expCombined: [], expMonth: [], expYear: [], cvv: [], name: [] };
    for (const el of all) {
      const kind = classify(el);
      if (kind) found[kind].push(el);
    }

    const filled = [];
    for (const el of found.number) if (fill(el, card.number)) filled.push("number");
    for (const el of found.expCombined) if (fill(el, formatExpCombined(el, card.mm, card.yy))) filled.push("exp");
    for (const el of found.expMonth) if (fill(el, formatMonth(el, card.mm))) filled.push("expMonth");
    for (const el of found.expYear) if (fill(el, formatYear(el, card.yy))) filled.push("expYear");
    for (const el of found.cvv) if (fill(el, card.cvv)) filled.push("cvv");
    for (const el of found.name) if (card.name && fill(el, card.name)) filled.push("name");

    return { filled: filled.length, fields: filled };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "AUTOFILL" && msg.card) {
      try {
        sendResponse(autofill(msg.card));
      } catch (e) {
        sendResponse({ filled: 0, fields: [], error: String(e) });
      }
      return true;
    }
    if (msg && msg.type === "PING") {
      sendResponse({ ok: true });
      return true;
    }
  });
})();
