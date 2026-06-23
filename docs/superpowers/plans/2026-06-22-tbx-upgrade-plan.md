# TBX Upgrade Plan — V2

> **Maqsadli o'quvchi:** Founder va jamoa  
> **Sana:** 2026-yil 22-iyun  
> **Holat:** Rejalashtirilgan

**Maqsad:** Mavjud TBX statik saytiga real e-commerce (Shopify), mijoz hisobi va qo'shimcha o'sish vositalarini ulash.

**Yondashuv:** Sayt dizayni o'zgarmaydi — faqat funksionallik qo'shiladi. Har bir bosqich mustaqil ishlaydi.

**Texnologiyalar:** Shopify Buy Button API · Shopify Storefront API · Vanilla JS · Vercel

---

## BOSQICH 1 — Shopify Integratsiyasi

### 1.1 Shopify Hisob va Mahsulotlar Sozlash

**Qilinadigan ishlar:**

- [ ] **Shopify hisob ochish**
  - shopify.com ga o'ting → "Start free trial"
  - Plan tanlang: **Starter ($9/oy)** — Buy Button uchun yetarli
  - Do'kon nomi: `tbx-takeaction`

- [ ] **5 ta mahsulot yaratish** (har bir rang uchun alohida)
  - Admin → Products → Add product
  - Har bir mahsulot uchun:
    ```
    Nom:        TBX Heavyweight Hoodie — Bone
    Narx:       $69.99
    Taqqoslama: $79.99
    SKU:        TBX-BONE-S / TBX-BONE-M / TBX-BONE-L
    Variants:   Size → S, M, L
    Rasmlar:    assets/ papkasidan yuklang (front, back, tight)
    Inventory:  Ombordagi sonni kiriting
    ```
  - Xuddi shu: Olive, Graphite, Navy, Brown uchun takrorlang

- [ ] **Shopify Storefront API kalitini olish**
  - Admin → Settings → Apps and sales channels → Develop apps
  - "Create an app" → TBX Frontend
  - Permissions: `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`
  - API tokenni nusxalab oling (keyingi bosqichda kerak)

---

### 1.2 Buy Button Saytga Ulash

**O'zgartiriladigan fayllar:**
- `tbx-core.js` — mahsulot ma'lumotlari va savatcha logikasi
- `TBX.html`, `shop.html`, `product.html` — skript va checkout ulanishi

**Qilinadigan ishlar:**

- [ ] **Shopify JS SDK ni ulash**

  Har 3 sahifaning `<head>` qismiga qo'shing:
  ```html
  <script src="https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js"></script>
  ```

- [ ] **`tbx-core.js` ga Shopify client ulash**

  Fayl boshiga qo'shing:
  ```js
  const shopifyClient = ShopifyBuy.buildClient({
    domain: 'tbx-takeaction.myshopify.com',
    storefrontAccessToken: 'YOUR_TOKEN_HERE',
  });
  ```

- [ ] **Mahsulot ID larini olish**

  Shopify Admin → Products → har bir mahsulotni oching → URL dagi raqam = Product ID
  ```
  bone:     gid://shopify/Product/XXXXXXXXXX
  olive:    gid://shopify/Product/XXXXXXXXXX
  graphite: gid://shopify/Product/XXXXXXXXXX
  navy:     gid://shopify/Product/XXXXXXXXXX
  brown:    gid://shopify/Product/XXXXXXXXXX
  ```

- [ ] **Savatcha (Cart) funksiyasini ulash**

  `tbx-core.js` da `addToCart` funksiyasini yangilang:
  ```js
  async function addToCart(productId, variantId, quantity) {
    let checkout = await getOrCreateCheckout();
    checkout = await shopifyClient.checkout.addLineItems(checkout.id, [
      { variantId, quantity }
    ]);
    updateCartUI(checkout);
  }

  async function getOrCreateCheckout() {
    const id = localStorage.getItem('tbx_checkout_id');
    if (id) {
      const existing = await shopifyClient.checkout.fetch(id);
      if (existing && !existing.completedAt) return existing;
    }
    const fresh = await shopifyClient.checkout.create();
    localStorage.setItem('tbx_checkout_id', fresh.id);
    return fresh;
  }
  ```

- [ ] **Checkout sahifasiga yo'naltirish**

  "Checkout" tugmasiga bosish → Shopify checkout sahifasiga o'tish:
  ```js
  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const checkout = await getOrCreateCheckout();
    window.location.href = checkout.webUrl;
  });
  ```

- [ ] **Test qilish**
  - Localhost da sahifani oching
  - Mahsulot tanlang → savatchaga qo'shing
  - Savatcha icon da miqdor ko'rinadi
  - Checkout bosilganda Shopify to'lov sahifasi ochiladi
  - Test karta: `4242 4242 4242 4242`, istagan muddat, `123` CVV

- [ ] **GitHub ga push + Vercel deploy**
  ```bash
  git add tbx-core.js TBX.html shop.html product.html
  git commit -m "feat: Shopify Buy Button integration"
  git push origin upgrade
  ```

---

### 1.3 Shopify Admin Sozlamalari

- [ ] **To'lov usullari ulash**
  - Settings → Payments → Shopify Payments aktiv qiling
  - Yoki Stripe ulang (Settings → Payments → Third-party providers)

- [ ] **Yetkazib berish sozlash**
  - Settings → Shipping and delivery
  - US: Standard $5.99 · 5–7 kun
  - Free shipping: $100+ buyurtmalarga

- [ ] **Buyurtma email shablonlari**
  - Settings → Notifications
  - Tasdiqlash emaili brend ovozida yozing
  - Tracking emaili avtomatik ketadi

- [ ] **Tax sozlash**
  - Settings → Taxes and duties
  - US state soliqlarini Shopify avtomatik hisoblaydi

---

## BOSQICH 2 — Customer Account Bo'limi

### 2.1 Sahifalar

| Sahifa | URL | Nima qiladi |
|--------|-----|-------------|
| Login / Ro'yxatdan o'tish | `/account` | Email + parol bilan kirish |
| Dashboard | `/account/dashboard` | Buyurtmalar, profil umumiy ko'rinishi |
| Buyurtmalar | `/account/orders` | Barcha buyurtmalar tarixi |
| Buyurtma tafsiloti | `/account/orders/:id` | Bir buyurtma + kuzatuv |
| Profil | `/account/profile` | Ism, email, parol o'zgartirish |
| Manzillar | `/account/addresses` | Saqlangan yetkazib berish manzillari |
| Wishlist | `/account/wishlist` | Saqlangan mahsulotlar |

---

### 2.2 Login / Ro'yxatdan O'tish Sahifasi

**Yaratilishi kerak:** `account.html`

- [ ] **account.html fayli yaratish**

  TBX dizayn tizimida login formasi:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Account — TBX</title>
    <link rel="stylesheet" href="tbx-core.css" />
    <link rel="stylesheet" href="tbx-pages.css" />
  </head>
  <body data-active="account">
  <section class="auth pad">
    <div class="auth-box">
      <!-- TAB: Login / Register -->
      <div class="authtabs">
        <button class="on" id="tabLogin">Sign In</button>
        <button id="tabRegister">Create Account</button>
      </div>

      <!-- LOGIN FORM -->
      <form id="loginForm">
        <div class="field">
          <label>Email</label>
          <input type="email" id="loginEmail" placeholder="you@email.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="loginPass" placeholder="••••••••" />
        </div>
        <button class="btn ink lg" type="submit">Sign In</button>
        <a class="forgot" href="#" id="forgotLink">Forgot password?</a>
      </form>

      <!-- REGISTER FORM (yashirin) -->
      <form id="registerForm" style="display:none">
        <div class="field">
          <label>First name</label>
          <input type="text" id="regFirst" placeholder="First" />
        </div>
        <div class="field">
          <label>Last name</label>
          <input type="text" id="regLast" placeholder="Last" />
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="regEmail" placeholder="you@email.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="regPass" placeholder="Min 8 characters" />
        </div>
        <button class="btn ink lg" type="submit">Create Account</button>
      </form>
    </div>
  </section>
  <script src="tbx-core.js"></script>
  <script src="tbx-account.js"></script>
  </body>
  </html>
  ```

- [ ] **Shopify Customer API ulash** (`tbx-account.js`)

  Shopify Storefront API orqali mijoz hisobi:
  ```js
  // Login
  async function customerLogin(email, password) {
    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken expiresAt }
          userErrors { field message }
        }
      }`;
    const res = await shopifyFetch(mutation, {
      input: { email, password }
    });
    const { customerAccessToken, userErrors } = res.customerAccessTokenCreate;
    if (userErrors.length) throw new Error(userErrors[0].message);
    localStorage.setItem('tbx_token', customerAccessToken.accessToken);
    window.location.href = '/account/dashboard';
  }

  // Register
  async function customerCreate(firstName, lastName, email, password) {
    const mutation = `
      mutation customerCreate($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          customer { id email }
          userErrors { field message }
        }
      }`;
    const res = await shopifyFetch(mutation, {
      input: { firstName, lastName, email, password }
    });
    const { customer, userErrors } = res.customerCreate;
    if (userErrors.length) throw new Error(userErrors[0].message);
    await customerLogin(email, password);
  }
  ```

---

### 2.3 Dashboard — Buyurtmalar Tarixi

**Yaratilishi kerak:** `account-dashboard.html`

- [ ] **Buyurtmalar ro'yxatini ko'rsatish**

  ```js
  async function fetchOrders() {
    const token = localStorage.getItem('tbx_token');
    const query = `
      query {
        customer(customerAccessToken: "${token}") {
          orders(first: 10) {
            edges {
              node {
                id orderNumber processedAt
                totalPrice { amount currencyCode }
                fulfillmentStatus financialStatus
                lineItems(first: 5) {
                  edges {
                    node {
                      title quantity
                      variant { image { url } price { amount } }
                    }
                  }
                }
              }
            }
          }
        }
      }`;
    const data = await shopifyFetch(query);
    return data.customer.orders.edges.map(e => e.node);
  }
  ```

  Har bir buyurtma kartochkasi:
  ```
  ┌─────────────────────────────────────┐
  │  Order #1042          Jun 20, 2026  │
  │  TBX Hoodie — Bone · Size M · x1   │
  │  $69.99        ● Delivered          │
  │                        [View Order] │
  └─────────────────────────────────────┘
  ```

---

### 2.4 Profil va Manzil Boshqaruvi

- [ ] **Profil tahrirlash**
  - Ism, familiya, email o'zgartirish
  - Parol yangilash (eski → yangi → tasdiqlash)
  - Shopify `customerUpdate` mutation

- [ ] **Manzillar**
  - Saqlangan manzillar ro'yxati
  - Yangi manzil qo'shish
  - Asosiy manzil belgilash
  - Shopify `customerAddressCreate` / `customerAddressUpdate`

---

### 2.5 Wishlist (Saqlanganlar)

Shopify da wishlist tizimi yo'q — `localStorage` da saqlash:

- [ ] **Wishlist logikasi**
  ```js
  function toggleWishlist(productKey) {
    const list = JSON.parse(localStorage.getItem('tbx_wishlist') || '[]');
    const idx = list.indexOf(productKey);
    if (idx === -1) list.push(productKey);
    else list.splice(idx, 1);
    localStorage.setItem('tbx_wishlist', JSON.stringify(list));
    updateWishlistUI();
  }
  ```

- [ ] **Mahsulot kartochkalarida yurak icon**
  - Saqlangan bo'lsa — to'la yurak
  - Saqlanmagan bo'lsa — bo'sh yurak
  - Login qilinmagan bo'lsa → `account.html` ga yo'naltirish

---

### 2.6 vercel.json Yangilash

- [ ] Account sahifalari uchun route qo'shish:
  ```json
  {
    "rewrites": [
      { "source": "/", "destination": "/TBX.html" },
      { "source": "/shop", "destination": "/shop.html" },
      { "source": "/product", "destination": "/product.html" },
      { "source": "/contact", "destination": "/contact.html" },
      { "source": "/account", "destination": "/account.html" },
      { "source": "/account/dashboard", "destination": "/account-dashboard.html" },
      { "source": "/account/orders", "destination": "/account-orders.html" },
      { "source": "/account/profile", "destination": "/account-profile.html" }
    ]
  }
  ```

---

## BOSQICH 3 — Qo'shimcha Tavsiyalar

### 3.1 Analytics (O'lchash) — YUQORI PRIORITET

| Vosita | Maqsad | Narx |
|--------|--------|------|
| **Google Analytics 4** | Tashrif, konversiya, traffic manba | Bepul |
| **Meta Pixel** | Facebook/Instagram reklama kuzatuvi | Bepul |
| **Hotjar** | Foydalanuvchi harakatini video ko'rish | Bepul (basic) |

- [ ] GA4 o'rnatish → `<head>` ga skript → maqsadlar belgilash (purchase, add_to_cart)
- [ ] Meta Pixel → Instagram reklamalari uchun majburiy

---

### 3.2 Email Marketing — YUQORI PRIORITET

**Klaviyo** ($20/oy dan) — streetwear brendlar uchun standart:

- [ ] Klaviyo hisob ochish → Shopify bilan ulanish
- [ ] Avtomatik email ketma-ketliklari:
  ```
  Ro'yxatdan o'tish  → Xush kelibsiz seriyasi (3 ta email, 7 kun)
  Savatcha tashlab ketish → 1 soat + 24 soat eslatma
  Buyurtma tasdiqlash → Brendga mos dizaynda
  Buyurtma yetkazildi → Izoh so'rash
  Drop'dan oldin     → "48 soat qoldi" xabarnoma
  ```
- [ ] Contact sahifasidagi "Subscribe" formani Klaviyo ga ulash
- [ ] Pop-up (10 soniyadan keyin): "Drop 02 uchun ro'yxatga kirish"

---

### 3.3 SEO — O'RTA PRIORITET

- [ ] Har bir sahifaga meta tag qo'shish:
  ```html
  <meta name="description" content="TBX Drop 01 — 450 GSM heavyweight hoodie in 5 colorways. Premium streetwear. Free returns." />
  <meta property="og:image" content="https://tbx-site.vercel.app/assets/tbx-logo.png" />
  ```
- [ ] `sitemap.xml` yaratish → Google Search Console ga yuborish
- [ ] Alt text barcha rasmlarga qo'shish
- [ ] Sahifa tezligini tekshirish: PageSpeed Insights

---

### 3.4 Drop Countdown Timer — O'RTA PRIORITET

Har bir yangi drop oldidan bosh sahifada hisoblagich:

```
NEXT DROP ARRIVING IN
  04  :  23  :  17  :  09
DAYS   HRS   MIN   SEC
```

- [ ] `countdown.js` yaratish → `localStorage` da drop sanasini saqlash
- [ ] Email ro'yxatiga kirganlar birinchi biladi

---

### 3.5 Umumiy Sayt Yaxshilanishlari — PAST PRIORITET

- [ ] **Instagram feed** — bosh sahifaga oxirgi 6 ta post (@tbx.takeaction)
- [ ] **Mahsulot zoom** — rasm ustiga hover qilganda kattalashtirish
- [ ] **Size guide modal** — jadval ko'rinishida (cm/inch)
- [ ] **Tezkor ko'rish (Quick View)** — do'kon sahifasida mahsulotga hover
- [ ] **Taqqoslash** — ikki rangni yonma-yon ko'rish
- [ ] **Accessibility** — keyboard navigation, ARIA labels

---

### 3.6 Kelajak — DROP 02 REJASI

| Bosqich | Tavsif |
|---------|--------|
| Drop 02 e'lon | Countdown + email to'plash (2 hafta oldin) |
| Members only | Hisobli foydalanuvchilar 24 soat erta kiradi |
| Wishlist → Stock | Wishlist ga qo'shilgan foydalanuvchiga stock alert |
| Referral | "Do'stingni taklif et → $10 chegirma" |
| Limited bundle | 2 ta rang → 10% chegirma |

---

## Bajarish Tartibi

```
Hozir:     Bosqich 1 — Shopify ulash (1–2 kun)
           ↓
Keyin:     Bosqich 2 — Customer Account (3–5 kun)
           ↓
Parallel:  Analytics + Email Marketing (har ikkalasi 1 kun)
           ↓
Drop 02:   Countdown + Members Early Access
```

---

*TBX Upgrade Plan · 2026-yil 22-iyun*
