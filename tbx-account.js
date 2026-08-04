/* ===================== TBX — ACCOUNT LOGIC ===================== */
(function () {
'use strict';

const USER_KEY          = 'tbx_user';
const TOKEN_KEY         = 'tbx_cust_token';
const DEMO_USERS_KEY    = 'tbx_demo_users';
const ADDR_KEY          = 'tbx_addresses';
const CARD_KEY          = 'tbx_payment_methods';

/* ---- world data: countries + dial codes, regions for a few countries, postal rules ----
   Dial codes are accurate; national number FORMATTING is exact for the countries this project
   explicitly targets (US/CA/UK/DE/FR/JP/UZ) and falls back to a generic 3-digit grouping for
   the rest — a full per-country formatting grammar needs a library the size of libphonenumber,
   which is out of scope for this static demo. */
const COUNTRIES = [
  ['Afghanistan','+93'],['Albania','+355'],['Algeria','+213'],['Andorra','+376'],['Angola','+244'],
  ['Antigua and Barbuda','+1'],['Argentina','+54'],['Armenia','+374'],['Australia','+61'],['Austria','+43'],
  ['Azerbaijan','+994'],['Bahamas','+1'],['Bahrain','+973'],['Bangladesh','+880'],['Barbados','+1'],
  ['Belarus','+375'],['Belgium','+32'],['Belize','+501'],['Benin','+229'],['Bhutan','+975'],
  ['Bolivia','+591'],['Bosnia and Herzegovina','+387'],['Botswana','+267'],['Brazil','+55'],['Brunei','+673'],
  ['Bulgaria','+359'],['Burkina Faso','+226'],['Burundi','+257'],['Cabo Verde','+238'],['Cambodia','+855'],
  ['Cameroon','+237'],['Canada','+1'],['Central African Republic','+236'],['Chad','+235'],['Chile','+56'],
  ['China','+86'],['Colombia','+57'],['Comoros','+269'],['Congo (Congo-Brazzaville)','+242'],['Congo (DRC)','+243'],
  ['Costa Rica','+506'],['Croatia','+385'],['Cuba','+53'],['Cyprus','+357'],['Czech Republic','+420'],
  ['Denmark','+45'],['Djibouti','+253'],['Dominica','+1'],['Dominican Republic','+1'],['Ecuador','+593'],
  ['Egypt','+20'],['El Salvador','+503'],['Equatorial Guinea','+240'],['Eritrea','+291'],['Estonia','+372'],
  ['Eswatini','+268'],['Ethiopia','+251'],['Fiji','+679'],['Finland','+358'],['France','+33'],
  ['Gabon','+241'],['Gambia','+220'],['Georgia','+995'],['Germany','+49'],['Ghana','+233'],
  ['Greece','+30'],['Grenada','+1'],['Guatemala','+502'],['Guinea','+224'],['Guinea-Bissau','+245'],
  ['Guyana','+592'],['Haiti','+509'],['Honduras','+504'],['Hungary','+36'],['Iceland','+354'],
  ['India','+91'],['Indonesia','+62'],['Iran','+98'],['Iraq','+964'],['Ireland','+353'],
  ['Israel','+972'],['Italy','+39'],['Ivory Coast','+225'],['Jamaica','+1'],['Japan','+81'],
  ['Jordan','+962'],['Kazakhstan','+7'],['Kenya','+254'],['Kiribati','+686'],['Kosovo','+383'],
  ['Kuwait','+965'],['Kyrgyzstan','+996'],['Laos','+856'],['Latvia','+371'],['Lebanon','+961'],
  ['Lesotho','+266'],['Liberia','+231'],['Libya','+218'],['Liechtenstein','+423'],['Lithuania','+370'],
  ['Luxembourg','+352'],['Madagascar','+261'],['Malawi','+265'],['Malaysia','+60'],['Maldives','+960'],
  ['Mali','+223'],['Malta','+356'],['Marshall Islands','+692'],['Mauritania','+222'],['Mauritius','+230'],
  ['Mexico','+52'],['Micronesia','+691'],['Moldova','+373'],['Monaco','+377'],['Mongolia','+976'],
  ['Montenegro','+382'],['Morocco','+212'],['Mozambique','+258'],['Myanmar','+95'],['Namibia','+264'],
  ['Nauru','+674'],['Nepal','+977'],['Netherlands','+31'],['New Zealand','+64'],['Nicaragua','+505'],
  ['Niger','+227'],['Nigeria','+234'],['North Korea','+850'],['North Macedonia','+389'],['Norway','+47'],
  ['Oman','+968'],['Pakistan','+92'],['Palau','+680'],['Palestine','+970'],['Panama','+507'],
  ['Papua New Guinea','+675'],['Paraguay','+595'],['Peru','+51'],['Philippines','+63'],['Poland','+48'],
  ['Portugal','+351'],['Qatar','+974'],['Romania','+40'],['Russia','+7'],['Rwanda','+250'],
  ['Saint Kitts and Nevis','+1'],['Saint Lucia','+1'],['Saint Vincent and the Grenadines','+1'],['Samoa','+685'],['San Marino','+378'],
  ['Sao Tome and Principe','+239'],['Saudi Arabia','+966'],['Senegal','+221'],['Serbia','+381'],['Seychelles','+248'],
  ['Sierra Leone','+232'],['Singapore','+65'],['Slovakia','+421'],['Slovenia','+386'],['Solomon Islands','+677'],
  ['Somalia','+252'],['South Africa','+27'],['South Korea','+82'],['South Sudan','+211'],['Spain','+34'],
  ['Sri Lanka','+94'],['Sudan','+249'],['Suriname','+597'],['Sweden','+46'],['Switzerland','+41'],
  ['Syria','+963'],['Taiwan','+886'],['Tajikistan','+992'],['Tanzania','+255'],['Thailand','+66'],
  ['Timor-Leste','+670'],['Togo','+228'],['Tonga','+676'],['Trinidad and Tobago','+1'],['Tunisia','+216'],
  ['Turkey','+90'],['Turkmenistan','+993'],['Tuvalu','+688'],['Uganda','+256'],['Ukraine','+380'],
  ['United Arab Emirates','+971'],['United Kingdom','+44'],['United States','+1'],['Uruguay','+598'],['Uzbekistan','+998'],
  ['Vanuatu','+678'],['Vatican City','+379'],['Venezuela','+58'],['Vietnam','+84'],['Yemen','+967'],
  ['Zambia','+260'],['Zimbabwe','+263'],
];
const COUNTRY_NAMES = COUNTRIES.map(c => c[0]);
const DIAL_CODES = Object.fromEntries(COUNTRIES);

const CANADA_PROVINCES = ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'];
const AUSTRALIA_STATES = ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'];
const UK_REGIONS = ['England','Scotland','Wales','Northern Ireland'];
function regionsForCountry(country) {
  if (country === 'United States') return window.TBX?.US_STATES || [];
  if (country === 'Canada') return CANADA_PROVINCES;
  if (country === 'Australia') return AUSTRALIA_STATES;
  if (country === 'United Kingdom') return UK_REGIONS;
  return [];
}

const ZIP_RULES = {
  'United States': { re: /^\d{5}(-\d{4})?$/, hint: 'e.g. 12345 or 12345-6789' },
  'Canada':        { re: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, hint: 'e.g. A1A 1A1' },
  'United Kingdom':{ re: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, hint: 'e.g. SW1A 1AA' },
  'Germany':       { re: /^\d{5}$/, hint: '5 digits' },
  'France':        { re: /^\d{5}$/, hint: '5 digits' },
  'Uzbekistan':    { re: /^\d{6}$/, hint: '6 digits' },
};
const DEFAULT_ZIP_RULE = { re: /^[A-Za-z0-9\s-]{3,10}$/, hint: 'Enter a valid postal code' };
function zipRuleForCountry(country) { return ZIP_RULES[country] || DEFAULT_ZIP_RULE; }

/* national-number formatting per country (digits in, formatted string out) */
function formatNationalNumber(country, digits) {
  digits = digits.replace(/\D/g, '');
  if (country === 'United States' || country === 'Canada') {
    digits = digits.slice(0, 10);
    if (digits.length < 4) return digits.length ? `(${digits}` : '';
    if (digits.length < 7) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (country === 'United Kingdom') {
    digits = digits.slice(0, 10);
    return digits.length > 4 ? `${digits.slice(0,4)} ${digits.slice(4)}` : digits;
  }
  if (country === 'Uzbekistan') {
    digits = digits.slice(0, 9);
    let out = digits.slice(0, 2);
    if (digits.length > 2) out += ' ' + digits.slice(2, 5);
    if (digits.length > 5) out += ' ' + digits.slice(5, 7);
    if (digits.length > 7) out += ' ' + digits.slice(7, 9);
    return out;
  }
  if (country === 'France') {
    digits = digits.slice(0, 9);
    return digits.replace(/(\d)(?=(\d{2})+(?!\d))/g, '$1 ').trim();
  }
  if (country === 'Germany' || country === 'Japan') {
    digits = digits.slice(0, 11);
    if (digits.length < 4) return digits;
    if (digits.length < 8) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,7)} ${digits.slice(7)}`;
  }
  /* generic fallback: group in 3s */
  digits = digits.slice(0, 12);
  return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
}
/* reformat an <input> in place without throwing the caret to the end */
function reformatPreservingCaret(input, formatter) {
  const caret = input.selectionStart == null ? input.value.length : input.selectionStart;
  const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;
  const next = formatter(input.value);
  input.value = next;
  if (document.activeElement !== input) return;
  let count = 0, pos = next.length;
  if (digitsBeforeCaret === 0) pos = 0;
  else {
    for (let i = 0; i < next.length; i++) {
      if (/\d/.test(next[i])) count++;
      if (count === digitsBeforeCaret) { pos = i + 1; break; }
    }
  }
  input.setSelectionRange(pos, pos);
}

/* ---- searchable dropdown (country / state pickers) ----
   getOptions() returning [] means "no predefined list" — the combo then behaves as a plain
   free-text input and never opens a popup. */
function initSearchCombo({ input, list, getOptions, onSelect }) {
  let opts = [];
  let activeIdx = -1;
  let selectedValue = input.value || '';

  /* portal the panel to <body> so it floats above the modal instead of being
     clipped by the modal's overflow-y:auto, then track the input's position. */
  if (list.parentElement !== document.body) document.body.appendChild(list);
  function positionList() {
    const r = input.getBoundingClientRect();
    const desiredHeight = Math.min(230, list.scrollHeight || 230);
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    list.style.left  = r.left + 'px';
    list.style.width = r.width + 'px';
    if (spaceBelow < desiredHeight + 12 && spaceAbove > spaceBelow) {
      list.style.top = 'auto';
      list.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    } else {
      list.style.bottom = 'auto';
      list.style.top = (r.bottom + 6) + 'px';
    }
  }
  window.addEventListener('resize', () => { if (list.classList.contains('show')) positionList(); });
  document.addEventListener('scroll', () => { if (list.classList.contains('show')) positionList(); }, true);

  function renderList(filter) {
    const q = (filter || '').trim().toLowerCase();
    const base = getOptions();
    opts = base.filter(o => !q || o.toLowerCase().includes(q));
    list.innerHTML = opts.length
      ? opts.map((o, i) => `<div class="lux-combo-opt" data-idx="${i}">${o}</div>`).join('')
      : '<div class="lux-combo-empty">No matches</div>';
    activeIdx = -1;
  }
  function openList() { if (!getOptions().length) { closeList(); return; } renderList(input.value); positionList(); list.classList.add('show'); input.setAttribute('aria-expanded','true'); }
  function closeList() { list.classList.remove('show'); input.setAttribute('aria-expanded','false'); }
  function highlight(i) {
    list.querySelectorAll('.lux-combo-opt').forEach(el => el.classList.remove('active'));
    const el = list.querySelector(`[data-idx="${i}"]`);
    if (el) { el.classList.add('active'); el.scrollIntoView({ block: 'nearest' }); }
    activeIdx = i;
  }
  function select(value) {
    selectedValue = value;
    input.value = value;
    closeList();
    onSelect(value);
  }

  input.addEventListener('focus', openList);
  input.addEventListener('input', openList);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!list.classList.contains('show')) openList(); highlight(Math.min(activeIdx + 1, opts.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(activeIdx - 1, 0)); }
    else if (e.key === 'Enter') { if (activeIdx >= 0 && opts[activeIdx]) { e.preventDefault(); select(opts[activeIdx]); } }
    else if (e.key === 'Escape') { closeList(); }
  });
  list.addEventListener('mousedown', e => {
    const opt = e.target.closest('.lux-combo-opt');
    if (!opt) return;
    e.preventDefault();
    select(opts[+opt.dataset.idx]);
  });
  document.addEventListener('click', e => {
    if (e.target !== input && !list.contains(e.target)) closeList();
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      const base = getOptions();
      if (!base.length) { selectedValue = input.value.trim(); onSelect(selectedValue); return; }
      const match = base.find(o => o.toLowerCase() === input.value.trim().toLowerCase());
      if (match) { input.value = match; selectedValue = match; onSelect(match); }
      else if (input.value.trim() === '') { selectedValue = ''; onSelect(''); }
      else { input.value = selectedValue; }
    }, 120);
  });

  return {
    getValue: () => selectedValue,
    setValue(v) { selectedValue = v; input.value = v; },
    refresh() { if (list.classList.contains('show')) renderList(input.value); },
  };
}

/* ---- session helpers ---- */
function getUser()  { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setUser(u) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch(e) {} }
function setToken(t){ try { localStorage.setItem(TOKEN_KEY, t); } catch(e) {} }
function clearAuth(){ localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); }

function requireAuth() {
  if (!getUser()) { window.location.href = 'account.html'; return false; }
  return true;
}

async function logout() {
  if (window.TBXSupabase?.SUPABASE_ENABLED) {
    try { await window.TBXSupabase.sbSignOut(); } catch (e) {}
  }
  clearAuth();
  window.location.href = 'TBX.html';
}

/* ---- demo user directory (email -> {firstName,lastName,password,phone,phoneVerified}) ----
   DEMO ONLY: passwords are plaintext in localStorage — this is a client-side simulation for
   a static site with no backend. This whole mechanism (getDemoUsers/setDemoUsers + the plaintext
   comparison in the sign-in handler below) MUST be fully replaced by real server-side auth with
   hashed+salted passwords (e.g. Supabase Auth) before any real customer accounts are created —
   never adapt or "harden" this in place, replace it outright. */
function getDemoUsers()   { try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '{}'); } catch(e) { return {}; } }
function setDemoUsers(u)  { try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(u)); } catch(e) {} }
function normalizePhone(p){ return (p || '').replace(/[^\d]/g, ''); }
function maskPhone(phone) {
  const digits = normalizePhone(phone);
  if (digits.length < 6) return phone || '';
  const head  = digits.slice(0, 3);
  const last2 = digits.slice(-2);
  const stars = '•'.repeat(Math.max(1, digits.length - head.length - 2));
  return `+${head} ${stars} ${last2}`;
}

function uid() { return 'id' + Math.random().toString(36).slice(2, 10); }

/* escape free-text user input before it's interpolated into innerHTML (addresses, saved cards) */
function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ---- tiny card-brand sniff for the demo Payment Methods card (never stores the full number) ---- */
function detectCardBrand(digits) {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

/* ---- addresses / payment methods (localStorage, demo only) ---- */
function getAddresses()  { try { return JSON.parse(localStorage.getItem(ADDR_KEY) || '[]'); } catch(e) { return []; } }
function setAddresses(a) { try { localStorage.setItem(ADDR_KEY, JSON.stringify(a)); } catch(e) {} }
function getCards()       { try { return JSON.parse(localStorage.getItem(CARD_KEY) || '[]'); } catch(e) { return []; } }
function setCards(c)      { try { localStorage.setItem(CARD_KEY, JSON.stringify(c)); } catch(e) {} }

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

/* ===== SIGN IN PAGE (account.html) ===== */
function initSignInPage() {
  const form = document.getElementById('signinForm');
  if (!form) return;

  if (getUser()) { window.location.href = 'account-dashboard.html'; return; }

  const errEl = document.getElementById('siErr');
  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  function hideErr()    { errEl.style.display = 'none'; }

  const params = new URLSearchParams(window.location.search);
  if (params.get('reset') === 'success') {
    const okEl = document.getElementById('siOk');
    if (okEl) { okEl.textContent = 'Password updated. Please sign in.'; okEl.style.display = 'block'; }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault(); hideErr();
    const email = document.getElementById('siEmail').value.trim();
    const pass  = document.getElementById('siPassword').value;
    if (!email || !pass) { showErr('Enter your email and password.'); return; }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Signing In...';

    try {
      if (window.TBXSupabase?.SUPABASE_ENABLED) {
        const { user } = await window.TBXSupabase.sbSignIn({ email, password: pass });
        const profile = await window.TBXSupabase.sbGetProfile(user.id);
        setUser({ firstName: profile?.first_name || '', lastName: profile?.last_name || '', email: user.email, phone: profile?.phone || '' });
      } else if (window.TBXShopify?.SHOPIFY_ENABLED) {
        const tok = await window.TBXShopify.shopifyCustomerLogin(email, pass);
        setToken(tok.accessToken);
        const cust = await window.TBXShopify.shopifyGetCustomer(tok.accessToken);
        setUser({ firstName: cust.firstName, lastName: cust.lastName, email: cust.email });
      } else {
        const stored = getDemoUsers();
        const u = stored[email];
        if (!u || u.password !== pass) throw new Error('Incorrect email or password.');
        setUser({ firstName: u.firstName, lastName: u.lastName, email, phone: u.phone });
      }
      window.location.href = 'account-dashboard.html';
    } catch (err) {
      showErr(err.message || 'Sign in failed.');
      btn.disabled = false;
      btn.innerHTML = 'Sign In <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg>';
    }
  });

  const googleBtn = document.getElementById('googleSignIn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      hideErr();
      if (!window.TBXSupabase?.SUPABASE_ENABLED) { showErr('Google sign-in isn\'t connected yet.'); return; }
      try { await window.TBXSupabase.sbSignInWithGoogle(); }
      catch (err) { showErr(err.message || 'Google sign-in failed.'); }
    });
  }
}

/* ===== CREATE ACCOUNT — 4-step wizard (account-create.html) ===== */
function initCreateWizard() {
  const root = document.getElementById('createWizard');
  if (!root) return;
  if (getUser()) { window.location.href = 'account-dashboard.html'; return; }

  const state = { firstName: '', lastName: '', email: '', phone: '', password: '' };
  let step = 1;

  const segs  = Array.from(document.querySelectorAll('.lux-steps .seg'));
  const steps = Array.from(document.querySelectorAll('.lux-step'));
  const errEl = document.getElementById('wizErr');

  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  function hideErr()    { errEl.style.display = 'none'; }

  function renderStep() {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === step));
    segs.forEach((s, i) => { s.classList.toggle('done', i < step - 1); s.classList.toggle('active', i === step - 1); });
    hideErr();
  }
  function goTo(n) { step = n; renderStep(); }
  renderStep();

  /* STEP 1 — name */
  document.getElementById('step1Next').addEventListener('click', () => {
    hideErr();
    const first = document.getElementById('cwFirst').value.trim();
    const last  = document.getElementById('cwLast').value.trim();
    if (!first || !last) { showErr('Enter your first and last name.'); return; }
    state.firstName = first; state.lastName = last;
    goTo(2);
  });

  /* STEP 2 — email + phone + password -> create real Supabase account */
  document.getElementById('step2Back').addEventListener('click', () => goTo(1));
  async function createAccount() {
    hideErr();
    const email = document.getElementById('cwEmail').value.trim();
    const phone = document.getElementById('cwPhone').value.trim();
    const pass  = document.getElementById('cwPass').value;
    if (!email) { showErr('Enter your email.'); return; }
    if (pass.length < 6) { showErr('Password must be at least 6 characters.'); return; }
    if (!window.TBXSupabase?.SUPABASE_ENABLED) { showErr('Account creation is temporarily unavailable.'); return; }

    const btn = document.getElementById('step2Next');
    btn.disabled = true; btn.textContent = 'Creating...';
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('show');

    try {
      await window.TBXSupabase.sbSignUp({ email, password: pass, firstName: state.firstName, lastName: state.lastName, phone });
      state.email = email; state.phone = phone; state.password = pass;
      overlay.classList.remove('show');
      document.getElementById('cwSentEmail').textContent = email;
      goTo(3);
    } catch (err) {
      overlay.classList.remove('show');
      showErr(err.message || 'Something went wrong.');
    }
    btn.disabled = false;
    btn.innerHTML = 'Create Account <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg>';
  }
  document.getElementById('step2Next').addEventListener('click', createAccount);

  /* STEP 3 — check your email */
  document.getElementById('cwResendEmail').addEventListener('click', async () => {
    const btn = document.getElementById('cwResendEmail');
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      await window.TBXSupabase.client.auth.resend({
        type: 'signup', email: state.email,
        options: { emailRedirectTo: window.location.origin + '/account.html?confirmed=1' },
      });
      btn.textContent = 'Sent!';
    } catch (err) {
      btn.textContent = 'Resend Email';
      showErr(err.message || 'Could not resend — try again in a moment.');
    }
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend Email'; }, 3000);
  });
}

/* ===== FORGOT PASSWORD — 4-step wizard (account-forgot.html) ===== */
function initForgotWizard() {
  const root = document.getElementById('forgotWizard');
  if (!root) return;

  let step = 1;
  const segs  = Array.from(document.querySelectorAll('.lux-steps .seg'));
  const steps = Array.from(document.querySelectorAll('.lux-step'));
  const errEl = document.getElementById('wizErr');

  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  function hideErr()    { errEl.style.display = 'none'; }

  function renderStep() {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === step));
    segs.forEach((s, i) => { s.classList.toggle('done', i < step - 1); s.classList.toggle('active', i === step - 1); });
    hideErr();
  }
  function goTo(n) { step = n; renderStep(); }
  renderStep();

  /* STEP 1 — email -> send reset link */
  document.getElementById('fpStep1Next').addEventListener('click', async () => {
    hideErr();
    const email = document.getElementById('fpEmail').value.trim();
    if (!email) { showErr('Enter your email.'); return; }
    if (!window.TBXSupabase?.SUPABASE_ENABLED) { showErr('Password reset is temporarily unavailable.'); return; }

    const btn = document.getElementById('fpStep1Next');
    btn.disabled = true; btn.textContent = 'Sending...';

    try {
      await window.TBXSupabase.sbResetPasswordForEmail(email);
      document.getElementById('fpSentEmail').textContent = email;
      goTo(2);
    } catch (err) {
      showErr(err.message || 'Something went wrong.');
    }
    btn.disabled = false;
    btn.innerHTML = 'Send Reset Link <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg>';
  });

  /* STEP 3 — new password (reached only via the emailed recovery link, see bootstrapRecovery below) */
  document.getElementById('fpStep3Next').addEventListener('click', async () => {
    hideErr();
    const p1 = document.getElementById('fpPass').value;
    const p2 = document.getElementById('fpPassConfirm').value;
    if (p1.length < 6) { showErr('Password must be at least 6 characters.'); return; }
    if (p1 !== p2) { showErr('Passwords do not match.'); return; }

    const btn = document.getElementById('fpStep3Next');
    btn.disabled = true; btn.textContent = 'Updating...';
    try {
      await window.TBXSupabase.sbUpdatePassword(p1);
      goTo(4);
    } catch (err) {
      showErr(err.message || 'Something went wrong.');
    }
    btn.disabled = false;
    btn.innerHTML = 'Reset Password <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg>';
  });

  /* Landed here via the emailed recovery link? Supabase's JS client parses the URL
     and fires this event once the temporary recovery session is ready. */
  if (window.TBXSupabase?.SUPABASE_ENABLED) {
    window.TBXSupabase.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') goTo(3);
    });
  }

  /* STEP 4 — success (static markup handles the "Continue to Sign In" link) */
}

/* ===== DASHBOARD (account-dashboard.html) ===== */
function initDashboard() {
  if (!document.getElementById('dashName')) return;
  if (!requireAuth()) return;

  const user = getUser();
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  document.getElementById('dashName').textContent = fullName || 'there';
  const subEl = document.getElementById('dashSub');
  if (subEl) subEl.textContent = `Welcome back, ${user.firstName || ''}.`;

  const pfName = document.getElementById('pfNameRow');
  if (pfName) pfName.textContent = fullName;
  const pfEmail = document.getElementById('pfEmailRow');
  if (pfEmail) pfEmail.textContent = user.email || '';
  const pfPhone = document.getElementById('pfPhoneRow');
  const pfBadge = document.getElementById('pfPhoneBadge');
  if (pfPhone) pfPhone.textContent = user.phone ? maskPhone(user.phone) : '—';
  if (pfBadge) pfBadge.style.display = user.phone ? '' : 'none';

  document.querySelectorAll('[data-logout]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); logout(); })
  );

  loadOrdersCard();
  loadWishlistCard();
  initAddressesCard();
  initPaymentCard();
}

async function loadOrdersCard() {
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
      const user = getUser();
      const all = JSON.parse(localStorage.getItem('tbx_orders') || '[]');
      orders = user ? all.filter(o => o.email === user.email) : [];
    }

    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:8px 0 4px">
          <p class="lux-empty" style="padding-bottom:16px">No orders yet.<br>Your future TBX orders will appear here.</p>
          <a href="shop.html" class="lux-btn primary" data-cur style="width:auto;display:inline-flex">Shop Drop 01 <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg></a>
        </div>`;
      return;
    }

    const statusLabel = { FULFILLED: 'Delivered', PARTIALLY_FULFILLED: 'Partial', UNFULFILLED: 'Processing', IN_PROGRESS: 'Shipped' };
    container.innerHTML = orders.map(o => `
      <div class="lux-mini-row">
        <div>
          <div class="mr-title">Order #${o.id} — ${o.items}</div>
          <div class="mr-sub">${o.date} · ${statusLabel[o.status] || o.status}</div>
        </div>
        <div class="mr-val">${o.total}</div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = '<p class="lux-empty">Couldn\'t load orders.</p>';
  }
}

function loadWishlistCard() {
  const container = document.getElementById('wishlistList');
  if (!container) return;
  const list = window.TBX?.getWishlist ? window.TBX.getWishlist() : [];
  if (!list.length) {
    container.innerHTML = '<p class="lux-empty">No saved items yet. <a href="shop.html" data-cur>Browse the collection</a>.</p>';
    return;
  }
  const TONES = window.TBX?.TONES || [];
  container.innerHTML = list.slice(0, 5).map(key => {
    const t = TONES.find(x => x.key === key);
    if (!t) return '';
    return `<a href="product.html?product=${t.key}" class="lux-mini-row" data-cur>
      <div class="mr-title">${t.name}</div>
      <div class="mr-val">$69.99</div>
    </a>`;
  }).join('');
}

function initAddressesCard() {
  const listEl  = document.getElementById('addrList');
  const emptyEl = document.getElementById('addrEmpty');
  if (!listEl) return;

  function render() {
    const list = getAddresses();
    if (!list.length) { listEl.innerHTML = ''; emptyEl.style.display = ''; return; }
    emptyEl.style.display = 'none';
    listEl.innerHTML = list.map(a => `
      <div class="lux-list-item">
        <div>
          <div class="li-main">${escapeHTML(a.label)} — ${escapeHTML(a.fullName)}</div>
          <div class="li-sub">${escapeHTML([a.address, a.unit].filter(Boolean).join(' '))}, ${escapeHTML(a.city)}, ${escapeHTML(a.state)} ${escapeHTML(a.zip)}, ${escapeHTML(a.country)}</div>
          <div class="li-sub">${escapeHTML(a.phone)}</div>
        </div>
        <button type="button" class="li-remove" data-remove-addr="${a.id}" aria-label="Remove"><svg width="16" height="16"><use href="#i-close"/></svg></button>
      </div>`).join('');
    listEl.querySelectorAll('[data-remove-addr]').forEach(btn =>
      btn.addEventListener('click', () => { setAddresses(getAddresses().filter(a => a.id !== btn.dataset.removeAddr)); render(); })
    );
  }
  render();

  const modal   = document.getElementById('addrModal');
  const openBtn = document.getElementById('addAddrBtn');
  const closeBtn = document.getElementById('addrModalClose');
  const form    = document.getElementById('addrForm');
  if (!modal) return;

  openBtn.addEventListener('click', () => { resetAddrForm(); modal.classList.add('show'); });
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

  /* Country combo — searchable list of ~195 countries. No default: the shopper picks their own. */
  const countryCombo = initSearchCombo({
    input: document.getElementById('addrCountryInput'),
    list: document.getElementById('addrCountryList'),
    getOptions: () => COUNTRY_NAMES,
    onSelect: country => onCountryChange(country),
  });

  /* State combo — list-mode for US/Canada/Australia/UK, free text for every other country */
  const stateCombo = initSearchCombo({
    input: document.getElementById('addrStateInput'),
    list: document.getElementById('addrStateList'),
    getOptions: () => regionsForCountry(countryCombo.getValue()),
    onSelect: () => {},
  });

  const phoneDial  = document.getElementById('addrPhoneDial');
  const phoneInput = document.getElementById('addrPhone');
  const zipInput   = document.getElementById('addrZip');
  const zipField   = document.getElementById('addrZipField');
  const zipErrEl   = document.getElementById('addrZipErr');

  function onCountryChange(country) {
    stateCombo.setValue('');
    const stateInputEl = document.getElementById('addrStateInput');
    stateInputEl.placeholder = !country ? 'Select a country first'
      : regionsForCountry(country).length ? 'Select or type a state…' : 'State / Province';
    phoneDial.textContent = country ? (DIAL_CODES[country] || '+—') : '+—';
    reformatPreservingCaret(phoneInput, v => formatNationalNumber(country, v));
    validateZip();
  }
  function validateZip() {
    const rule = zipRuleForCountry(countryCombo.getValue());
    zipErrEl.textContent = `Invalid format — ${rule.hint}.`;
    const ok = !zipInput.value.trim() || rule.re.test(zipInput.value.trim());
    zipField.classList.toggle('invalid', !ok);
    return ok;
  }
  onCountryChange('');

  phoneInput.addEventListener('input', () => reformatPreservingCaret(phoneInput, v => formatNationalNumber(countryCombo.getValue(), v)));
  zipInput.addEventListener('input', validateZip);
  zipInput.addEventListener('blur', validateZip);

  function resetAddrForm() {
    form.reset();
    countryCombo.setValue('');
    onCountryChange('');
    zipField.classList.remove('invalid');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const label    = document.getElementById('addrLabel').value.trim() || 'Address';
    const fullName = document.getElementById('addrFullName').value.trim();
    const country  = countryCombo.getValue().trim();
    const address  = document.getElementById('addrLine').value.trim();
    const unit     = document.getElementById('addrUnit').value.trim();
    const city     = document.getElementById('addrCity').value.trim();
    const state    = stateCombo.getValue().trim();
    const zip      = zipInput.value.trim();
    const phone    = phoneInput.value.trim() ? `${phoneDial.textContent} ${phoneInput.value.trim()}` : '';
    if (!fullName || !country || !address || !city || !state || !zip || !phone) return;
    if (!validateZip()) { zipInput.focus(); return; }
    const list = getAddresses();
    list.push({ id: uid(), label, fullName, country, address, unit, city, state, zip, phone });
    setAddresses(list);
    resetAddrForm();
    modal.classList.remove('show');
    render();
  });
}

function initPaymentCard() {
  const listEl  = document.getElementById('cardList');
  const emptyEl = document.getElementById('cardEmpty');
  if (!listEl) return;

  function render() {
    const list = getCards();
    if (!list.length) { listEl.innerHTML = ''; emptyEl.style.display = ''; return; }
    emptyEl.style.display = 'none';
    listEl.innerHTML = list.map(c => `
      <div class="lux-list-item">
        <div>
          <div class="li-main">${escapeHTML(c.brand)} •••• ${escapeHTML(c.last4)}</div>
          <div class="li-sub">${escapeHTML(c.holder)} · Exp ${escapeHTML(c.expiry)} · ZIP ${escapeHTML(c.zip)}</div>
        </div>
        <button type="button" class="li-remove" data-remove-card="${c.id}" aria-label="Remove"><svg width="16" height="16"><use href="#i-close"/></svg></button>
      </div>`).join('');
    listEl.querySelectorAll('[data-remove-card]').forEach(btn =>
      btn.addEventListener('click', () => { setCards(getCards().filter(c => c.id !== btn.dataset.removeCard)); render(); })
    );
  }
  render();

  const modal   = document.getElementById('cardModal');
  const openBtn = document.getElementById('addCardBtn');
  const closeBtn = document.getElementById('cardModalClose');
  const form    = document.getElementById('cardForm');
  if (!modal) return;

  const holderInp = document.getElementById('cardHolder'),  holderField = document.getElementById('cardHolderField');
  const numberInp = document.getElementById('cardNumber'),  numberField = document.getElementById('cardNumberField');
  const expiryInp = document.getElementById('cardExpiry'),  expiryField = document.getElementById('cardExpiryField');
  const cvcInp    = document.getElementById('cardCvc'),     cvcField    = document.getElementById('cardCvcField');
  const zipInp    = document.getElementById('cardZip'),     zipField    = document.getElementById('cardZipField');
  const saveBtn   = document.getElementById('cardSaveBtn');
  const touched   = new Set();

  const formatHolder     = v => v.replace(/[^A-Za-z\s'-]/g, '');
  const formatCardNumber = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry     = v => { let d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; };
  const formatCvc        = v => v.replace(/\D/g, '').slice(0, 4);
  const formatZip        = v => v.replace(/[^A-Za-z0-9\s-]/g, '').slice(0, 10);

  const isValidHolder = v => v.trim().length > 0;
  const isValidNumber = v => { const d = v.replace(/\D/g, ''); return d.length >= 13 && d.length <= 16; };
  const isValidExpiry = v => { const m = /^(\d{2})\/(\d{2})$/.exec(v); return !!m && +m[1] >= 1 && +m[1] <= 12; };
  const isValidCvc    = v => /^\d{3,4}$/.test(v);
  const isValidZip    = v => v.trim().length >= 3;

  function isFormValid() {
    return isValidHolder(holderInp.value) && isValidNumber(numberInp.value) && isValidExpiry(expiryInp.value)
      && isValidCvc(cvcInp.value) && isValidZip(zipInp.value);
  }
  function refreshErr(input, field, validator) {
    if (touched.has(input.id)) field.classList.toggle('invalid', !validator(input.value));
  }
  function updateAll() {
    refreshErr(holderInp, holderField, isValidHolder);
    refreshErr(numberInp, numberField, isValidNumber);
    refreshErr(expiryInp, expiryField, isValidExpiry);
    refreshErr(cvcInp, cvcField, isValidCvc);
    refreshErr(zipInp, zipField, isValidZip);
    saveBtn.disabled = !isFormValid();
  }
  function wireField(input, formatter) {
    input.addEventListener('input', () => { input.value = formatter(input.value); updateAll(); });
    input.addEventListener('blur', () => { touched.add(input.id); updateAll(); });
  }
  wireField(holderInp, formatHolder);
  wireField(numberInp, formatCardNumber);
  wireField(expiryInp, formatExpiry);
  wireField(cvcInp, formatCvc);
  wireField(zipInp, formatZip);

  function resetCardForm() {
    form.reset();
    touched.clear();
    [holderField, numberField, expiryField, cvcField, zipField].forEach(f => f.classList.remove('invalid'));
    saveBtn.disabled = true;
  }

  openBtn.addEventListener('click', () => { resetCardForm(); modal.classList.add('show'); });
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!isFormValid()) { touched.add(holderInp.id).add(numberInp.id).add(expiryInp.id).add(cvcInp.id).add(zipInp.id); updateAll(); return; }
    const holder = holderInp.value.trim();
    const digits = numberInp.value.replace(/\D/g, '');
    const expiry = expiryInp.value.trim();
    const zip    = zipInp.value.trim();
    /* CVC is validated above but never stored — real processors forbid persisting it, and this demo follows the same rule. */
    const list = getCards();
    list.push({ id: uid(), holder, brand: detectCardBrand(digits), last4: digits.slice(-4), expiry, zip });
    setCards(list);
    resetCardForm();
    modal.classList.remove('show');
    render();
  });
}

/* ===== PROFILE PAGE (account-profile.html) ===== */
function initProfile() {
  if (!document.getElementById('profileForm')) return;
  if (!requireAuth()) return;

  const user = getUser();
  document.getElementById('pfFirst').value = user.firstName || '';
  document.getElementById('pfLast').value  = user.lastName  || '';
  document.getElementById('pfEmail').value = user.email     || '';

  const pfPhone = document.getElementById('pfPhone');
  if (pfPhone) pfPhone.value = user.phone ? maskPhone(user.phone) : 'Not added';
  const pfBadge = document.getElementById('pfPhoneBadge');
  if (pfBadge) pfBadge.style.display = user.phone ? '' : 'none';

  document.querySelectorAll('[data-logout]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); logout(); })
  );

  const profileErr = document.getElementById('profileErr');
  const profileOk  = document.getElementById('profileOk');

  document.getElementById('profileForm').addEventListener('submit', e => {
    e.preventDefault();
    profileErr.style.display = 'none';
    profileOk.style.display  = 'none';

    const firstName = document.getElementById('pfFirst').value.trim();
    const lastName  = document.getElementById('pfLast').value.trim();
    const email     = document.getElementById('pfEmail').value.trim();

    if (!firstName || !email) { profileErr.textContent = 'Name and email are required.'; profileErr.style.display = 'block'; return; }

    setUser({ firstName, lastName, email, phone: user.phone });
    profileOk.style.display = 'block';
  });

  const pwForm = document.getElementById('pwForm');
  if (pwForm) {
    const pwErr = document.getElementById('pwErr');
    const pwOk  = document.getElementById('pwOk');
    pwForm.addEventListener('submit', e => {
      e.preventDefault();
      pwErr.style.display = 'none'; pwOk.style.display = 'none';
      const cur  = document.getElementById('pwCurrent').value;
      const nw   = document.getElementById('pwNew').value;
      const conf = document.getElementById('pwConfirm').value;
      if (!cur || !nw) { pwErr.textContent = 'Fill in all fields.'; pwErr.style.display = 'block'; return; }
      if (nw.length < 6) { pwErr.textContent = 'New password must be at least 6 characters.'; pwErr.style.display = 'block'; return; }
      if (nw !== conf) { pwErr.textContent = 'Passwords do not match.'; pwErr.style.display = 'block'; return; }
      pwOk.style.display = 'block';
      document.getElementById('pwCurrent').value = '';
      document.getElementById('pwNew').value = '';
      document.getElementById('pwConfirm').value = '';
    });
  }
}

/* ===== SUPABASE SESSION BOOTSTRAP =====
   Supabase manages the real session; tbx_user in localStorage stays a synchronous
   "mirror" of it so the rest of the app (dashboard, checkout autofill, nav icon)
   can keep reading getUser() synchronously without an app-wide async rewrite. */
async function bootstrapSupabaseSession() {
  if (!window.TBXSupabase?.SUPABASE_ENABLED) return;
  try {
    const session = await window.TBXSupabase.sbGetSession();
    if (session?.user) {
      const profile = await window.TBXSupabase.sbGetProfile(session.user.id);
      setUser({
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        email: session.user.email,
        phone: profile?.phone || '',
      });
    } else {
      clearAuth();
    }
  } catch (e) { /* keep whatever mirror already exists rather than signing the user out on a network hiccup */ }
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSupabaseSession();
  syncAccountNav();
  initSignInPage();
  initCreateWizard();
  initForgotWizard();
  initDashboard();
  initProfile();
});

window.TBXAccount = { getUser, logout, syncAccountNav, maskPhone, getAddresses, getCards };
})();
