/* ===================== TBX — ACCOUNT LOGIC ===================== */
(function () {
'use strict';

const USER_KEY   = 'tbx_user';
const TOKEN_KEY  = 'tbx_cust_token';

/* ---- helpers ---- */
function getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
function clearAuth(){ localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); }

function requireAuth() {
  if (!getUser()) { window.location.href = 'account.html'; return false; }
  return true;
}

function logout() {
  clearAuth();
  window.location.href = 'TBX.html';
}

/* ---- update nav account icon ---- */
function syncAccountNav() {
  const user = getUser();
  const links = document.querySelectorAll('.nav-account-link');
  links.forEach(el => {
    el.href = user ? 'account-dashboard.html' : 'account.html';
    el.setAttribute('title', user ? `${user.firstName} ${user.lastName}` : 'Sign In');
    el.classList.toggle('signed-in', !!user);
  });
}

/* ===== LOGIN / REGISTER PAGE (account.html) ===== */
function initAuthPage() {
  if (!document.getElementById('loginForm')) return;

  /* Redirect if already signed in */
  if (getUser()) { window.location.href = 'account-dashboard.html'; return; }

  const tabLogin    = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm   = document.getElementById('loginForm');
  const regForm     = document.getElementById('registerForm');
  const authErr     = document.getElementById('authErr');

  function showErr(msg) { authErr.textContent = msg; authErr.style.display = 'block'; }
  function hideErr()    { authErr.style.display = 'none'; }

  /* Tabs */
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('on'); tabRegister.classList.remove('on');
    loginForm.style.display = ''; regForm.style.display = 'none';
    hideErr();
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('on'); tabLogin.classList.remove('on');
    regForm.style.display = ''; loginForm.style.display = 'none';
    hideErr();
  });

  /* Login */
  loginForm.addEventListener('submit', async e => {
    e.preventDefault(); hideErr();
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    if (!email || !pass) { showErr('Email va parolni kiriting.'); return; }

    const btn = loginForm.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Kirish...';

    try {
      if (window.TBXShopify?.SHOPIFY_ENABLED) {
        const tok = await window.TBXShopify.shopifyCustomerLogin(email, pass);
        setToken(tok.accessToken);
        const cust = await window.TBXShopify.shopifyGetCustomer(tok.accessToken);
        setUser({ firstName: cust.firstName, lastName: cust.lastName, email: cust.email });
      } else {
        /* Demo mode */
        const stored = JSON.parse(localStorage.getItem('tbx_demo_users') || '{}');
        const u = stored[email];
        if (!u || u.password !== pass) throw new Error('Email yoki parol noto\'g\'ri.');
        setUser({ firstName: u.firstName, lastName: u.lastName, email });
      }
      window.location.href = 'account-dashboard.html';
    } catch (err) {
      showErr(err.message || 'Kirish muvaffaqiyatsiz.');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  /* Register */
  regForm.addEventListener('submit', async e => {
    e.preventDefault(); hideErr();
    const firstName = document.getElementById('regFirst').value.trim();
    const lastName  = document.getElementById('regLast').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const pass      = document.getElementById('regPass').value;

    if (!firstName || !email || !pass) { showErr('Barcha maydonlarni to\'ldiring.'); return; }
    if (pass.length < 6) { showErr('Parol kamida 6 ta belgidan iborat bo\'lishi kerak.'); return; }

    const btn = regForm.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Ro\'yxatdan o\'tilmoqda...';

    try {
      if (window.TBXShopify?.SHOPIFY_ENABLED) {
        await window.TBXShopify.shopifyCustomerCreate(firstName, lastName, email, pass);
        const tok = await window.TBXShopify.shopifyCustomerLogin(email, pass);
        setToken(tok.accessToken);
      } else {
        /* Demo mode */
        const stored = JSON.parse(localStorage.getItem('tbx_demo_users') || '{}');
        if (stored[email]) throw new Error('Bu email allaqachon ro\'yxatdan o\'tgan.');
        stored[email] = { firstName, lastName, password: pass };
        localStorage.setItem('tbx_demo_users', JSON.stringify(stored));
      }
      setUser({ firstName, lastName, email });
      window.location.href = 'account-dashboard.html';
    } catch (err) {
      showErr(err.message || 'Xatolik yuz berdi.');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
}

/* ===== DASHBOARD PAGE ===== */
function initDashboard() {
  if (!document.getElementById('dashGreeting')) return;
  if (!requireAuth()) return;

  const user = getUser();
  document.getElementById('dashGreeting').textContent = `Hello, ${user.firstName}.`;
  document.getElementById('dashEmail').textContent = user.email;

  /* Wishlist count */
  const wl = JSON.parse(localStorage.getItem('tbx_wishlist') || '[]');
  document.getElementById('dashWishCount').textContent = wl.length;

  /* Cart count */
  const cart = JSON.parse(localStorage.getItem('tbx_cart_v1') || '[]');
  const cartQty = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('dashCartCount').textContent = cartQty;

  /* Logout */
  document.querySelectorAll('[data-logout]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); logout(); })
  );

  /* Orders */
  loadOrders();
}

async function loadOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;

  try {
    let orders = [];

    if (window.TBXShopify?.SHOPIFY_ENABLED) {
      const token = getToken();
      if (token) {
        const cust = await window.TBXShopify.shopifyGetCustomer(token);
        orders = cust.orders.edges.map(e => ({
          id: e.node.orderNumber,
          date: new Date(e.node.processedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: e.node.fulfillmentStatus,
          total: `$${parseFloat(e.node.totalPrice.amount).toFixed(2)}`,
          items: e.node.lineItems.edges.map(li => li.node.title).join(', '),
        }));
      }
    } else {
      /* Demo: sample orders */
      orders = [
        { id: '1042', date: 'Jun 20, 2026', status: 'FULFILLED', total: '$69.99', items: 'TBX Hoodie — Bone · Size M' },
        { id: '1019', date: 'May 15, 2026', status: 'FULFILLED', total: '$139.98', items: 'TBX Hoodie — Navy · Size M, Olive · Size L' },
      ];
    }

    if (!orders.length) {
      container.innerHTML = '<div class="acempty"><p>Buyurtmalar yo\'q.</p><a href="shop.html" class="btn ink">Shop Now</a></div>';
      return;
    }

    const statusLabel = { FULFILLED: 'Delivered', PARTIALLY_FULFILLED: 'Partial', UNFULFILLED: 'Processing', IN_PROGRESS: 'Shipped' };
    const statusClass = { FULFILLED: 'green', PARTIALLY_FULFILLED: 'amber', UNFULFILLED: 'grey', IN_PROGRESS: 'amber' };

    container.innerHTML = orders.map(o => `
      <div class="order-row">
        <div class="or-meta">
          <span class="or-num mono">ORDER #${o.id}</span>
          <span class="or-date">${o.date}</span>
        </div>
        <div class="or-items">${o.items}</div>
        <div class="or-foot">
          <span class="or-status ${statusClass[o.status] || 'grey'}">${statusLabel[o.status] || o.status}</span>
          <span class="or-total">${o.total}</span>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = '<div class="acempty"><p>Buyurtmalarni yuklashda xatolik.</p></div>';
  }
}

/* ===== PROFILE PAGE ===== */
function initProfile() {
  if (!document.getElementById('profileForm')) return;
  if (!requireAuth()) return;

  const user = getUser();
  document.getElementById('pfFirst').value   = user.firstName || '';
  document.getElementById('pfLast').value    = user.lastName  || '';
  document.getElementById('pfEmail').value   = user.email     || '';

  document.querySelectorAll('[data-logout]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); logout(); })
  );

  const profileErr = document.getElementById('profileErr');
  const profileOk  = document.getElementById('profileOk');

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    profileErr.style.display = 'none';
    profileOk.style.display  = 'none';

    const firstName = document.getElementById('pfFirst').value.trim();
    const lastName  = document.getElementById('pfLast').value.trim();
    const email     = document.getElementById('pfEmail').value.trim();

    if (!firstName || !email) { profileErr.textContent = 'Ism va email majburiy.'; profileErr.style.display = 'block'; return; }

    /* Demo mode: just update localStorage */
    setUser({ firstName, lastName, email });
    profileOk.style.display = 'block';
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  syncAccountNav();
  initAuthPage();
  initDashboard();
  initProfile();
});

window.TBXAccount = { getUser, logout, syncAccountNav };
})();
