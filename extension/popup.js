/* Aegon Hitter — popup logic
 * QA / sandbox / educational use only. Never auto-submits forms.
 */

// ============= Luhn + generation =============

function luhnCheckDigit(numWithoutCheck) {
  let sum = 0;
  for (let i = 0; i < numWithoutCheck.length; i++) {
    let d = parseInt(numWithoutCheck[numWithoutCheck.length - 1 - i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}
const randDigit = () => Math.floor(Math.random() * 10).toString();

function generateCardNumber(bin, length) {
  let body = bin;
  while (body.length < length - 1) body += randDigit();
  body = body.slice(0, length - 1);
  return body + luhnCheckDigit(body).toString();
}
function randomExpiry() {
  const mm = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const yy = String((new Date().getFullYear() + Math.floor(Math.random() * 4) + 1) % 100).padStart(2, "0");
  return { mm, yy };
}
function randomCvv(bin) {
  const len = (bin.startsWith("34") || bin.startsWith("37")) ? 4 : 3;
  let v = ""; for (let i = 0; i < len; i++) v += randDigit();
  return v;
}

// ============= State =============

const DEFAULT_STATE = { bins: [], activeBinId: null, cardholderName: "QA Tester" };
let state = { ...DEFAULT_STATE };

async function loadState() {
  const res = await chrome.storage.local.get("aegon");
  state = { ...DEFAULT_STATE, ...(res.aegon || {}) };
}
async function saveState() {
  await chrome.storage.local.set({ aegon: state });
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ============= Rendering =============

function activeBin() { return state.bins.find(b => b.id === state.activeBinId) || null; }

function renderActiveBin() {
  const el = document.getElementById("active-bin-display");
  const b = activeBin();
  if (!b) { el.innerHTML = "— none — <span class='meta'>add a BIN to begin</span>"; return; }
  el.innerHTML = `${b.digits} <span class="meta">${b.label} · len ${b.length}</span>`;
}

function renderBinList() {
  const ul = document.getElementById("bin-list");
  ul.innerHTML = "";
  for (const b of state.bins) {
    const li = document.createElement("li");
    li.className = "bin-item" + (b.id === state.activeBinId ? " active" : "");
    li.innerHTML = `
      <div class="info">
        <div class="name">${escapeHtml(b.label)}</div>
        <div class="digits">${b.digits} <span class="len">· len ${b.length}</span></div>
      </div>
    `;
    const setBtn = document.createElement("button");
    setBtn.textContent = b.id === state.activeBinId ? "ACTIVE" : "USE";
    setBtn.disabled = b.id === state.activeBinId;
    setBtn.addEventListener("click", async () => {
      state.activeBinId = b.id;
      await saveState();
      renderAll();
    });
    const delBtn = document.createElement("button");
    delBtn.className = "del";
    delBtn.textContent = "DEL";
    delBtn.addEventListener("click", async () => {
      state.bins = state.bins.filter(x => x.id !== b.id);
      if (state.activeBinId === b.id) state.activeBinId = state.bins[0]?.id || null;
      await saveState();
      renderAll();
    });
    li.appendChild(setBtn);
    li.appendChild(delBtn);
    ul.appendChild(li);
  }
}

function renderSettings() {
  document.getElementById("cardholder").value = state.cardholderName || "";
}

function renderAll() {
  renderActiveBin();
  renderBinList();
  renderSettings();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ============= Status =============

function setStatus(msg, kind) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status" + (kind ? " " + kind : "");
}

// ============= Tabs =============

function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.dataset.panel === target));
    });
  });
}

// ============= START =============

async function start() {
  const b = activeBin();
  if (!b) { setStatus("Add and select a BIN first.", "err"); return; }
  const card = {
    number: generateCardNumber(b.digits, b.length),
    ...randomExpiry(),
    cvv: randomCvv(b.digits),
    name: state.cardholderName || "QA Tester",
  };
  card.mm = card.mm; // keep keys stable
  setStatus(`Hitting ${b.label}…`);
  const btn = document.getElementById("start");
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) { setStatus("No active tab.", "err"); return; }

  const send = () => chrome.tabs.sendMessage(tab.id, { type: "AUTOFILL", card });
  try {
    const res = await send();
    handleResult(res);
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["content.js"],
      });
      const res = await send();
      handleResult(res);
    } catch {
      setStatus("Cannot access this page.", "err");
    }
  }
}
function handleResult(res) {
  if (res && res.filled > 0) setStatus(`Filled ${res.filled} field(s) · ${res.fields.join(", ")}`, "ok");
  else setStatus("No payment form detected.", "err");
}

// ============= BIN form =============

function initBinForm() {
  const form = document.getElementById("bin-form");
  const err = document.getElementById("bin-error");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true; err.textContent = "";
    const label = document.getElementById("bin-label").value.trim();
    const digits = document.getElementById("bin-digits").value.replace(/\D/g, "");
    const length = parseInt(document.getElementById("bin-length").value, 10);
    try {
      if (!label) throw new Error("Label required.");
      if (digits.length < 4) throw new Error("BIN must be at least 4 digits.");
      if (!(length >= 13 && length <= 19)) throw new Error("Length must be 13–19.");
      if (digits.length >= length) throw new Error("BIN must be shorter than length.");
      const bin = { id: uid(), label, digits, length };
      state.bins.push(bin);
      if (!state.activeBinId) state.activeBinId = bin.id;
      await saveState();
      form.reset();
      document.getElementById("bin-length").value = 16;
      renderAll();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
    }
  });
}

function initSettingsForm() {
  const form = document.getElementById("settings-form");
  const status = document.getElementById("settings-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    state.cardholderName = document.getElementById("cardholder").value.trim() || "QA Tester";
    await saveState();
    status.textContent = "Saved.";
    setTimeout(() => { status.textContent = ""; }, 1200);
  });
}

// ============= Init =============

(async function init() {
  initTabs();
  initBinForm();
  initSettingsForm();
  await loadState();
  renderAll();
  document.getElementById("start").addEventListener("click", start);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.querySelector(".panel.active")?.dataset.panel === "hitter") {
      start();
    }
  });
})();
