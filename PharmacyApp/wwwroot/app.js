'use strict';

const API = '/api';
let medicinesCache = [];
let addMedModal, saleModal;
let activeFilter     = 'all';
let CURRENCY         = '₹';    // overwritten by /api/config on init
let EXPIRY_WARN_DAYS = 30;
let LOW_STOCK_QTY    = 10;
let DATE_LOCALE      = 'en-IN';
let sortCol          = null;
let sortDir          = 'asc';
let currentPage      = 1;
const PAGE_SIZE      = 10;

// ── Bootstrap modal instances ─────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  addMedModal = new bootstrap.Modal(document.getElementById('addMedModal'));
  saleModal   = new bootstrap.Modal(document.getElementById('saleModal'));

  document.getElementById('addMedModal').addEventListener('hidden.bs.modal', resetAddForm);
  document.getElementById('saleModal').addEventListener('hidden.bs.modal', resetSaleForm);

  init();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(d) {
  return new Date(d).toLocaleDateString(DATE_LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(d) { return Math.ceil((new Date(d) - Date.now()) / 864e5); }

function rowClass(m) {
  if (m.quantity === 0)                            return 'r-out';
  if (daysUntil(m.expiryDate) < EXPIRY_WARN_DAYS) return 'r-expiry';
  if (m.quantity < LOW_STOCK_QTY)                  return 'r-stock';
  return 'r-ok';
}

function statusBadge(m) {
  const d = daysUntil(m.expiryDate);
  if (m.quantity === 0)           return `<span class="b-out"><i class="bi bi-slash-circle me-1"></i>Out of stock</span>`;
  if (d < EXPIRY_WARN_DAYS)       return `<span class="b-expiry"><i class="bi bi-clock-history me-1"></i>Exp. in ${d}d</span>`;
  if (m.quantity < LOW_STOCK_QTY) return `<span class="b-stock"><i class="bi bi-exclamation-triangle me-1"></i>Low stock</span>`;
  return `<span class="b-ok"><i class="bi bi-check-circle me-1"></i>In stock</span>`;
}

function setHtml(id, html) { document.getElementById(id).innerHTML = html; }

function toast(msg, type = 'success') {
  const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
  const el = document.createElement('div');
  el.className = `toast-msg t-${type}`;
  el.innerHTML = `<i class="bi ${icon}"></i>${esc(msg)}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

// ── Tab routing ───────────────────────────────────────────────────────────────

function showTab(name) {
  document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('d-none'));
  document.getElementById(`tab-${name}`).classList.remove('d-none');
  document.querySelectorAll('.npill').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'inventory') loadMedicines();
  if (name === 'sales')     loadSales();
}

document.querySelectorAll('.npill').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab)));

// ── Inventory ─────────────────────────────────────────────────────────────────

async function loadMedicines() {
  try {
    medicinesCache = await apiFetch('/medicines');
    updateInventoryStats();
    applyFilters();
  } catch {
    setHtml('medicinesBody', '<tr><td colspan="8" class="empty-state text-danger"><i class="bi bi-exclamation-circle"></i>Failed to load medicines.</td></tr>');
  }
}

function applyFilters(resetPage = true) {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();

  if (resetPage) currentPage = 1;

  let list = medicinesCache;

  if (activeFilter === 'ok')     list = list.filter(m => m.quantity > 0 && daysUntil(m.expiryDate) >= EXPIRY_WARN_DAYS && m.quantity >= LOW_STOCK_QTY);
  if (activeFilter === 'stock')  list = list.filter(m => m.quantity > 0 && m.quantity < LOW_STOCK_QTY);
  if (activeFilter === 'expiry') list = list.filter(m => daysUntil(m.expiryDate) < EXPIRY_WARN_DAYS);
  if (activeFilter === 'out')    list = list.filter(m => m.quantity === 0);

  if (q) list = list.filter(m => m.fullName.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q));

  if (sortCol) {
    list = [...list].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  renderMedicines(list);
}

function renderMedicines(list) {
  const total = list.length;

  if (!total) {
    setHtml('medicinesBody',
      '<tr><td colspan="8" class="empty-state"><i class="bi bi-capsule-pill"></i>No medicines found</td></tr>');
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = list.slice(start, start + PAGE_SIZE);

  setHtml('medicinesBody', page.map((m, i) => `
    <tr class="${rowClass(m)}">
      <td class="text-muted">${start + i + 1}</td>
      <td><span class="med-name">${esc(m.fullName)}</span></td>
      <td><span class="text-secondary">${esc(m.brand)}</span></td>
      <td>${fmt(m.expiryDate)}</td>
      <td>${m.quantity}</td>
      <td>${CURRENCY}${m.price.toFixed(2)}</td>
      <td>${statusBadge(m)}</td>
      <td><button class="btn-sell" data-id="${m.id}" ${m.quantity === 0 ? 'disabled title="Out of stock"' : ''}><i class="bi bi-bag-plus-fill"></i> Sell</button></td>
    </tr>`).join(''));

  document.querySelectorAll('.btn-sell').forEach(btn =>
    btn.addEventListener('click', () => openSaleModal(btn.dataset.id)));

  renderPagination(total);
}

function renderPagination(total) {
  const bar   = document.getElementById('paginationBar');
  const pages = Math.ceil(total / PAGE_SIZE);

  if (pages <= 1) { bar.innerHTML = ''; return; }

  const clamp    = p => Math.min(Math.max(p, 1), pages);
  const winStart = Math.max(1, Math.min(currentPage - 2, pages - 4));
  const winEnd   = Math.min(pages, winStart + 4);

  const items = [];
  items.push(`<li class="page-item${currentPage === 1 ? ' disabled' : ''}">
    <button class="page-link" data-page="${clamp(currentPage - 1)}"><i class="bi bi-chevron-left"></i></button>
  </li>`);

  for (let p = winStart; p <= winEnd; p++) {
    items.push(`<li class="page-item${p === currentPage ? ' active' : ''}">
      <button class="page-link" data-page="${p}">${p}</button>
    </li>`);
  }

  items.push(`<li class="page-item${currentPage === pages ? ' disabled' : ''}">
    <button class="page-link" data-page="${clamp(currentPage + 1)}"><i class="bi bi-chevron-right"></i></button>
  </li>`);

  bar.innerHTML = `<nav><ul class="pagination pagination-sm mb-0">${items.join('')}</ul></nav>`;

  bar.querySelectorAll('[data-page]').forEach(btn =>
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      applyFilters(false);
    }));
}

function updateInventoryStats() {
  document.getElementById('statTotal').textContent    = medicinesCache.length;
  document.getElementById('statExpiring').textContent = medicinesCache.filter(m => daysUntil(m.expiryDate) < EXPIRY_WARN_DAYS).length;
  document.getElementById('statLowStock').textContent = medicinesCache.filter(m => m.quantity < LOW_STOCK_QTY).length;
}

// ── Search on typing (client-side, 200 ms debounce) ──────────────────────────

let searchTimer;
document.getElementById('searchInput').addEventListener('input', function () {
  document.getElementById('btnClearSearch').classList.toggle('d-none', !this.value);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 200);
});

// ── Status filter pills ───────────────────────────────────────────────────────

document.getElementById('filterBar').addEventListener('click', e => {
  const pill = e.target.closest('.fpill');
  if (!pill) return;
  activeFilter = pill.dataset.filter;
  document.querySelectorAll('.fpill').forEach(p => p.classList.toggle('active', p === pill));
  applyFilters();
});

document.getElementById('btnClearSearch').addEventListener('click', () => {
  const inp = document.getElementById('searchInput');
  inp.value = '';
  inp.focus();
  document.getElementById('btnClearSearch').classList.add('d-none');
  applyFilters();
});

// ── Sort ──────────────────────────────────────────────────────────────────────

document.getElementById('medicinesTable').querySelector('thead').addEventListener('click', e => {
  const th = e.target.closest('.th-sort');
  if (!th) return;
  const col = th.dataset.sort;
  sortDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc';
  sortCol = col;
  document.querySelectorAll('.th-sort').forEach(h => {
    h.classList.remove('asc', 'desc');
    h.querySelector('.th-sort-icon').className = 'bi bi-chevron-expand th-sort-icon';
  });
  th.classList.add(sortDir);
  th.querySelector('.th-sort-icon').className = `bi bi-chevron-${sortDir === 'asc' ? 'up' : 'down'} th-sort-icon`;
  applyFilters();
});

// ── Add Medicine modal ────────────────────────────────────────────────────────

const ADD_REQUIRED = ['fName', 'fBrand', 'fExpiry', 'fQty', 'fPrice'];

function checkAddFormReady() {
  const allFilled = ADD_REQUIRED.every(id => document.getElementById(id).value.trim() !== '');
  document.getElementById('btnSubmitMed').disabled = !allFilled;
}

ADD_REQUIRED.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if (el.value.trim()) el.classList.remove('field-invalid');
    checkAddFormReady();
    checkDuplicateWarning();
  });
  el.addEventListener('blur', () => {
    if (!el.value.trim()) el.classList.add('field-invalid');
  });
});

function checkDuplicateWarning() {
  const name  = document.getElementById('fName').value.trim().toLowerCase();
  const brand = document.getElementById('fBrand').value.trim().toLowerCase();
  const warn  = document.getElementById('dupWarn');
  if (!name || !brand) { warn.innerHTML = ''; return; }

  const matches = medicinesCache.filter(m =>
    m.fullName.toLowerCase() === name && m.brand.toLowerCase() === brand);

  if (!matches.length) { warn.innerHTML = ''; return; }

  const rows = matches.map(m =>
    `<span class="dup-batch">Exp: ${fmt(m.expiryDate)} · Stock: ${m.quantity} · ${CURRENCY}${m.price.toFixed(2)}</span>`
  ).join('');

  warn.innerHTML =
    `<div class="dup-notice"><i class="bi bi-exclamation-triangle-fill me-1"></i>` +
    `<strong>${matches.length} batch${matches.length > 1 ? 'es' : ''} already in stock.</strong> ` +
    `You are adding a new batch (different expiry / price / supplier).<br><span class="dup-batches">${rows}</span></div>`;
}

document.getElementById('btnOpenAddMed').addEventListener('click', () => addMedModal.show());

document.getElementById('btnSubmitMed').addEventListener('click', async () => {
  const alertEl = document.getElementById('addAlert');
  alertEl.innerHTML = '';

  const fName  = document.getElementById('fName').value.trim();
  const fBrand = document.getElementById('fBrand').value.trim();
  const fExp   = document.getElementById('fExpiry').value;
  const fQty   = document.getElementById('fQty').value;
  const fPrice = document.getElementById('fPrice').value;

  const btn = document.getElementById('btnSubmitMed');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…';

  try {
    await apiFetch('/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName:   fName,
        brand:      fBrand,
        expiryDate: fExp,
        quantity:   parseInt(fQty, 10),
        price:      parseFloat(fPrice),
        notes:      document.getElementById('fNotes').value.trim()
      })
    });
    addMedModal.hide();
    toast('Medicine added successfully!');
    loadMedicines();
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-danger py-2 small mb-0">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Medicine';
  }
});

function resetAddForm() {
  document.getElementById('addMedicineForm').reset();
  document.getElementById('addAlert').innerHTML = '';
  document.getElementById('dupWarn').innerHTML = '';
  ADD_REQUIRED.forEach(id => document.getElementById(id).classList.remove('field-invalid'));
  document.getElementById('btnSubmitMed').disabled = true;
}

// ── Sales tab ─────────────────────────────────────────────────────────────────

async function loadSales() {
  try {
    const sales = await apiFetch('/sales');

    const rev     = sales.reduce((s, r) => s + r.totalAmount, 0);
    const uniq    = new Set(sales.map(r => r.customerName.toLowerCase())).size;
    const today   = sales.filter(r => new Date(r.saleDate).toDateString() === new Date().toDateString()).length;

    document.getElementById('revenueTotal').textContent    = `${CURRENCY}${rev.toFixed(2)}`;
    document.getElementById('salesTotalCount').textContent = sales.length;
    document.getElementById('uniqueCustomers').textContent = uniq;
    document.getElementById('statSalesToday').textContent  = today;

    if (!sales.length) {
      setHtml('salesBody',
        '<tr><td colspan="7" class="empty-state"><i class="bi bi-receipt"></i>No sales recorded yet</td></tr>');
      return;
    }

    setHtml('salesBody', [...sales].reverse().map((s, i) => `
      <tr>
        <td class="text-muted">${i + 1}</td>
        <td><span class="fw-medium">${esc(s.medicineName)}</span></td>
        <td>${esc(s.customerName)}</td>
        <td>${s.quantity}</td>
        <td>${CURRENCY}${s.unitPrice.toFixed(2)}</td>
        <td><strong class="text-success">${CURRENCY}${s.totalAmount.toFixed(2)}</strong></td>
        <td class="text-muted">${fmt(s.saleDate)}</td>
      </tr>`).join(''));
  } catch {
    setHtml('salesBody',
      '<tr><td colspan="7" class="empty-state text-danger"><i class="bi bi-exclamation-circle"></i>Failed to load sales.</td></tr>');
  }
}

document.getElementById('btnOpenSale').addEventListener('click', () => openSaleModal());

// ── Record Sale modal ─────────────────────────────────────────────────────────

async function openSaleModal(preSelectId = null) {
  resetSaleForm();

  // Refresh cache so stock counts are accurate
  try { medicinesCache = await apiFetch('/medicines'); } catch { /* keep cache */ }

  const sel = document.getElementById('sMedicine');
  sel.innerHTML = '<option value="">— Select a medicine —</option>' +
    medicinesCache.map(m =>
      `<option value="${m.id}" data-price="${m.price}" data-qty="${m.quantity}">
        ${esc(m.fullName)} · ${esc(m.brand)} &nbsp;(${m.quantity} in stock)
      </option>`
    ).join('');

  if (preSelectId) {
    sel.value = preSelectId;
    sel.dispatchEvent(new Event('change'));
  }

  saleModal.show();
}

function getSaleOpt() {
  const sel = document.getElementById('sMedicine');
  return sel.options[sel.selectedIndex];
}

function recalcTotal() {
  const opt = getSaleOpt();
  const qty = parseInt(document.getElementById('sQty').value, 10) || 0;
  const price = parseFloat(opt?.dataset.price ?? 0);
  document.getElementById('saleTotalAmt').textContent = `${CURRENCY}${(price * qty).toFixed(2)}`;
}

document.getElementById('sMedicine').addEventListener('change', () => {
  const opt = getSaleOpt();
  const hint = document.getElementById('stockHint');
  if (opt?.dataset.qty) {
    const qty = parseInt(opt.dataset.qty, 10);
    hint.innerHTML = qty < LOW_STOCK_QTY
      ? `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>Only <strong>${qty}</strong> units in stock`
      : `<i class="bi bi-check-circle-fill text-success me-1"></i><strong>${qty}</strong> units available`;
  } else {
    hint.innerHTML = '';
  }
  recalcTotal();
});

document.getElementById('sQty').addEventListener('input', recalcTotal);

document.getElementById('btnSubmitSale').addEventListener('click', async () => {
  const alertEl  = document.getElementById('saleAlert');
  alertEl.innerHTML = '';

  const opt      = getSaleOpt();
  const customer = document.getElementById('sCustomer').value.trim();
  const qty      = parseInt(document.getElementById('sQty').value, 10);
  const available = parseInt(opt?.dataset.qty ?? 0, 10);

  if (!opt?.value)     { alertEl.innerHTML = '<div class="alert alert-warning py-2 small mb-0">Please select a medicine.</div>'; return; }
  if (!customer)       { alertEl.innerHTML = '<div class="alert alert-warning py-2 small mb-0">Please enter a customer name.</div>'; return; }
  if (!qty || qty < 1) { alertEl.innerHTML = '<div class="alert alert-warning py-2 small mb-0">Please enter a valid quantity (minimum 1).</div>'; return; }
  if (qty > available) { alertEl.innerHTML = `<div class="alert alert-warning py-2 small mb-0">Only ${available} units in stock.</div>`; return; }

  const btn = document.getElementById('btnSubmitSale');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processing…';

  try {
    await apiFetch('/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicineId: opt.value, customerName: customer, quantity: qty })
    });
    saleModal.hide();
    toast('Sale recorded successfully!');
    loadMedicines();
    refreshSalesToday();
    if (!document.getElementById('tab-sales').classList.contains('d-none')) loadSales();
  } catch (err) {
    alertEl.innerHTML = `<div class="alert alert-danger py-2 small mb-0">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Confirm Sale';
  }
});

function resetSaleForm() {
  document.getElementById('saleForm').reset();
  document.getElementById('saleAlert').innerHTML = '';
  document.getElementById('saleTotalAmt').textContent = `${CURRENCY}0.00`;
  document.getElementById('stockHint').innerHTML = '';
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const cfg = await fetch(`${API}/config`).then(r => r.json());
    CURRENCY         = cfg.currencySymbol    ?? CURRENCY;
    EXPIRY_WARN_DAYS = cfg.expiryWarningDays ?? EXPIRY_WARN_DAYS;
    LOW_STOCK_QTY    = cfg.lowStockThreshold ?? LOW_STOCK_QTY;
    DATE_LOCALE      = cfg.dateLocale        ?? DATE_LOCALE;
    document.querySelectorAll('[data-currency]').forEach(el => el.textContent = CURRENCY);
  } catch { /* keep fallback */ }

  showTab('inventory');
  refreshSalesToday();
}

async function refreshSalesToday() {
  try {
    const sales = await apiFetch('/sales');
    const today = sales.filter(s => new Date(s.saleDate).toDateString() === new Date().toDateString());
    document.getElementById('statSalesToday').textContent = today.length;
    renderTodaySalesCards(today);
  } catch { /* non-critical */ }
}

let todaySalesExpanded = false;

document.getElementById('cardSalesToday').addEventListener('click', () => {
  const hasSales = document.getElementById('todaySalesCards').innerHTML.trim() !== '';
  if (!hasSales) return;
  todaySalesExpanded = !todaySalesExpanded;
  document.getElementById('todaySalesSection').classList.toggle('d-none', !todaySalesExpanded);
  document.getElementById('cardSalesToday').classList.toggle('active', todaySalesExpanded);
  document.getElementById('salesTodayChevron').className =
    `bi ms-1 ${todaySalesExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`;
});

function renderTodaySalesCards(todaySales) {
  const cards = document.getElementById('todaySalesCards');

  if (!todaySales.length) {
    cards.innerHTML = '';
    todaySalesExpanded = false;
    document.getElementById('todaySalesSection').classList.add('d-none');
    document.getElementById('cardSalesToday').classList.remove('active');
    document.getElementById('salesTodayChevron').className = 'bi bi-chevron-down ms-1';
    return;
  }

  document.getElementById('todaySalesBadge').textContent = todaySales.length;
  cards.innerHTML = [...todaySales].reverse().map(s => `
    <div class="sale-card">
      <div class="sale-card-name" title="${esc(s.medicineName)}">${esc(s.medicineName)}</div>
      <div class="sale-card-cust"><i class="bi bi-person me-1"></i>${esc(s.customerName)}</div>
      <div class="sale-card-row">
        <span class="sale-card-qty">${s.quantity} × ${CURRENCY}${s.unitPrice.toFixed(2)}</span>
        <span class="sale-card-total">${CURRENCY}${s.totalAmount.toFixed(2)}</span>
      </div>
      <div class="sale-card-time"><i class="bi bi-clock me-1"></i>${new Date(s.saleDate).toLocaleTimeString(DATE_LOCALE, { hour: '2-digit', minute: '2-digit' })}</div>
    </div>`).join('');

  // keep section in sync with expanded state (cards refreshed after a new sale)
  document.getElementById('todaySalesSection').classList.toggle('d-none', !todaySalesExpanded);
}
