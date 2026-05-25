/* ================================================
   CHRIS ROYAL ELECTRONIC ENTERPRISE — checkout.js
   Checkout logic + Day.js EAT timestamps
   ================================================ */

// ---- Day.js Setup ----
// Wait for Day.js plugins to load
function setupDayjs() {
  if (typeof dayjs !== 'undefined' && dayjs.extend) {
    if (typeof window.dayjs_plugin_utc !== 'undefined') {
      dayjs.extend(window.dayjs_plugin_utc);
    }
    if (typeof window.dayjs_plugin_timezone !== 'undefined') {
      dayjs.extend(window.dayjs_plugin_timezone);
    }
  }
}

function formatDate(isoString) {
  try {
    setupDayjs();
    let d;
    if (typeof dayjs !== 'undefined') {
      try {
        d = dayjs(isoString).utcOffset(3); // EAT = UTC+3
        return d.format('DD MMM YYYY');
      } catch(_) {}
    }
    // Fallback
    const date = new Date(isoString);
    return date.toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric', timeZone:'Africa/Nairobi' });
  } catch (_) {
    return new Date().toLocaleDateString('en-UG', { day:'2-digit', month:'short', year:'numeric' });
  }
}

function formatTime(isoString) {
  try {
    setupDayjs();
    if (typeof dayjs !== 'undefined') {
      try {
        const d = dayjs(isoString).utcOffset(3); // EAT = UTC+3
        return d.format('hh:mm A') + ' EAT';
      } catch(_) {}
    }
    // Fallback
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-UG', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Africa/Nairobi' }) + ' EAT';
  } catch (_) {
    return new Date().toLocaleTimeString('en-UG', { hour:'2-digit', minute:'2-digit', hour12:true }) + ' EAT';
  }
}

// ---- Cart Utilities ----
function getCart() {
  return JSON.parse(localStorage.getItem('crCart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('crCart', JSON.stringify(cart));
}

// ---- Render Cart ----
function renderCart() {
  const cart = getCart();
  const list = document.getElementById('cartItemsList');
  const emptyEl = document.getElementById('emptyCart');
  const titleEl = document.getElementById('checkoutTitle');
  const summaryUniqueEl = document.getElementById('summaryUniqueItems');
  const summaryTotalEl = document.getElementById('summaryTotalQty');

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const uniqueItems = cart.length;

  // Update header + summary
  if (titleEl) titleEl.textContent = `(Total Items: ${totalQty})`;
  if (summaryUniqueEl) summaryUniqueEl.textContent = uniqueItems;
  if (summaryTotalEl) summaryTotalEl.textContent = totalQty;

  list.innerHTML = '';

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  cart.forEach(item => {
    const dateStr = formatDate(item.addedTime || new Date().toISOString());
    const timeStr = formatTime(item.addedTime || new Date().toISOString());

    const card = document.createElement('div');
    card.className = 'cart-item';
    card.setAttribute('data-id', item.id);
    card.innerHTML = `
      <div class="cart-item-meta">
        <span class="meta-date">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
          Added: ${dateStr}
        </span>
        <span class="meta-time">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
          ${timeStr}
        </span>
      </div>
      <div class="cart-item-body">
        <div class="cart-item-img">
          <img src="${item.img}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <div class="qty-row">
            <span class="qty-label">Quantity:</span>
            <span class="qty-badge">${item.qty}</span>
          </div>
        </div>
        <div class="cart-item-actions">
          <button class="delete-btn" onclick="deleteItem(${item.id})">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            Delete
          </button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// ---- Delete Item ----
function deleteItem(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);

  // Animate out
  const card = document.querySelector(`.cart-item[data-id="${id}"]`);
  if (card) {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-16px)';
    setTimeout(() => {
      card.remove();
      renderCart(); // Re-render to update counts
    }, 300);
  } else {
    renderCart();
  }
}

// ---- Place Order (WhatsApp) ----
function placeOrder() {
  const cart = getCart();

  if (cart.length === 0) {
    alert('Your cart is empty! Add some products first.');
    return;
  }

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // Build formatted order receipt
  let orderText = '🛒 *NEW ORDER — Chris Royal Electronic Enterprise*\n';
  orderText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  orderText += '*ORDER ITEMS:*\n';

  cart.forEach((item, idx) => {
    orderText += `${idx + 1}. ${item.name}\n`;
    orderText += `   └ Quantity: *${item.qty} unit${item.qty > 1 ? 's' : ''}*\n`;
  });

  orderText += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
  orderText += `📦 *Total Unique Products:* ${cart.length}\n`;
  orderText += `🔢 *Grand Total Units:* ${totalQty}\n`;
  orderText += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
  orderText += '📍 *Chris Royal Electronic Enterprise*\n';
  orderText += '📌 Mbarara, Uganda\n';
  orderText += '⏰ ' + formatTime(new Date().toISOString()) + '\n\n';
  orderText += '_Please confirm availability and provide payment details._';

  const encodedText = encodeURIComponent(orderText);
  const whatsappURL = `https://wa.me/256200904037?text=${encodedText}`;

  window.open(whatsappURL, '_blank');
}

// ---- Theme ----
function initTheme() {
  const saved = localStorage.getItem('crTheme') || 'light';
  document.body.className = saved === 'dark' ? 'dark-mode' : 'light-mode';
  updateThemeLabel();
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-mode');
  document.body.className = isDark ? 'light-mode' : 'dark-mode';
  localStorage.setItem('crTheme', isDark ? 'light' : 'dark');
  updateThemeLabel();
}

function updateThemeLabel() {
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = document.body.classList.contains('dark-mode') ? '🌙' : '☀️';
}

// ---- Footer Year ----
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setFooterYear();

  const tt = document.getElementById('themeToggle');
  if (tt) tt.addEventListener('click', toggleTheme);

  // Wait briefly for Day.js CDN scripts to load
  setTimeout(() => {
    setupDayjs();
    renderCart();
  }, 200);
});