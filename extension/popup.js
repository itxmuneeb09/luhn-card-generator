/* Luhn Card Generator — popup logic */

function luhnCheckDigit(numWithoutCheck) {
  // Compute the Luhn check digit for a string of digits.
  let sum = 0;
  // Position from right of the final number — check digit will be at pos 1.
  // So digits in numWithoutCheck are at positions 2,3,4,... from the right.
  // Double every digit at even position from the right of the FULL number,
  // which corresponds to every other digit starting from the rightmost of numWithoutCheck.
  for (let i = 0; i < numWithoutCheck.length; i++) {
    let d = parseInt(numWithoutCheck[numWithoutCheck.length - 1 - i], 10);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

function randDigit() {
  return Math.floor(Math.random() * 10).toString();
}

function generateCardNumber(bin, length) {
  let body = bin;
  while (body.length < length - 1) body += randDigit();
  body = body.slice(0, length - 1);
  return body + luhnCheckDigit(body).toString();
}

function generateExpiry() {
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const yearOffset = Math.floor(Math.random() * 4) + 1;
  const year = String((new Date().getFullYear() + yearOffset) % 100).padStart(2, "0");
  return { mm: month, yy: year };
}

function generateCvv(bin) {
  const isAmex = bin.startsWith("34") || bin.startsWith("37");
  const len = isAmex ? 4 : 3;
  let v = "";
  for (let i = 0; i < len; i++) v += randDigit();
  return v;
}

function generateBatch(bin, length, count) {
  const seen = new Set();
  const out = [];
  let attempts = 0;
  while (out.length < count && attempts < count * 20) {
    attempts++;
    const number = generateCardNumber(bin, length);
    if (seen.has(number)) continue;
    seen.add(number);
    const { mm, yy } = generateExpiry();
    out.push({ number, mm, yy, cvv: generateCvv(bin) });
  }
  return out;
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1200);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied: " + (text.length > 20 ? text.slice(0, 20) + "…" : text));
  } catch {
    toast("Copy failed");
  }
}

let lastBatch = [];

function render(batch) {
  const ul = document.getElementById("results");
  ul.innerHTML = "";
  for (const card of batch) {
    const li = document.createElement("li");
    const line = `${card.number}|${card.mm}|${card.yy}|${card.cvv}`;

    const num = document.createElement("span");
    num.className = "field num";
    num.textContent = card.number;
    num.title = "Click to copy number";
    num.addEventListener("click", (e) => { e.stopPropagation(); copy(card.number); });

    const exp = document.createElement("span");
    exp.className = "field exp";
    exp.textContent = `${card.mm}/${card.yy}`;
    exp.title = "Click to copy expiry";
    exp.addEventListener("click", (e) => { e.stopPropagation(); copy(`${card.mm}/${card.yy}`); });

    const cvv = document.createElement("span");
    cvv.className = "field cvv";
    cvv.textContent = card.cvv;
    cvv.title = "Click to copy CVV";
    cvv.addEventListener("click", (e) => { e.stopPropagation(); copy(card.cvv); });

    li.appendChild(num);
    li.appendChild(exp);
    li.appendChild(cvv);
    li.title = "Click background to copy full row";
    li.addEventListener("click", () => copy(line));

    ul.appendChild(li);
  }
}

function showError(msg) {
  const el = document.getElementById("error");
  if (!msg) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.textContent = msg;
}

function readInputs() {
  const bin = document.getElementById("bin").value.replace(/\D/g, "");
  const length = parseInt(document.getElementById("length").value, 10);
  const count = parseInt(document.getElementById("count").value, 10);
  if (!bin) throw new Error("Enter at least one starting digit.");
  if (!(length >= 13 && length <= 19)) throw new Error("Length must be 13–19.");
  if (bin.length >= length) throw new Error("BIN must be shorter than total length.");
  if (!(count >= 1 && count <= 100)) throw new Error("Count must be 1–100.");
  return { bin, length, count };
}

document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  showError("");
  try {
    const { bin, length, count } = readInputs();
    lastBatch = generateBatch(bin, length, count);
    render(lastBatch);
  } catch (err) {
    showError(err.message);
  }
});

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("csv").addEventListener("click", () => {
  if (!lastBatch.length) { toast("Generate first"); return; }
  const rows = ["number,mm,yy,cvv", ...lastBatch.map(c => `${c.number},${c.mm},${c.yy},${c.cvv}`)];
  download("cards.csv", rows.join("\n"), "text/csv");
});

document.getElementById("txt").addEventListener("click", () => {
  if (!lastBatch.length) { toast("Generate first"); return; }
  const rows = lastBatch.map(c => `${c.number}|${c.mm}|${c.yy}|${c.cvv}`);
  download("cards.txt", rows.join("\n"), "text/plain");
});
