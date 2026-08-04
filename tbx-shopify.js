/* ===================== TBX — SHOPIFY INTEGRATION =====================
  SOZLASH (3 qadam):
  1. shopify.com → Starter plan ($9/oy) → do'kon yarating
  2. Admin → Settings → Apps → Develop apps → "TBX Frontend" → yarating
     Permissions: unauthenticated_read_product_listings, unauthenticated_write_checkouts
  3. Quyidagi SHOPIFY_DOMAIN va SHOPIFY_STOREFRONT_TOKEN ni to'ldiring

  XAVFSIZLIK: SHOPIFY_STOREFRONT_TOKEN faqat "Storefront API" tokeni bo'lishi shart —
  bu token brauzerda ochiq turishi uchun mo'ljallangan (public, faqat mahsulot o'qish +
  checkout yaratish huquqi bilan). HECH QACHON bu yerga "Admin API" tokenini qo'ymang —
  Admin token butun do'konni (buyurtmalar, mijozlar, sozlamalar) to'liq boshqarish huquqini
  beradi va faqat serverda, hech qachon client-side kodda saqlanmasligi kerak.
======================================================================= */

const SHOPIFY_DOMAIN = 'YOUR_STORE.myshopify.com'; // masalan: tbx-takeaction.myshopify.com
const SHOPIFY_STOREFRONT_TOKEN = 'YOUR_STOREFRONT_ACCESS_TOKEN'; // faqat Storefront API tokeni — Admin token EMAS

/* Shopify Admin → Products → har bir mahsulot → F12 Console →
   ShopifyAnalytics.meta.product.variants ni ko'ring yoki URL dagi ID dan foydalaning */
const SHOPIFY_VARIANTS = {
  bone:     { S:'gid://shopify/ProductVariant/FILL_ME', M:'gid://shopify/ProductVariant/FILL_ME', L:'gid://shopify/ProductVariant/FILL_ME' },
  olive:    { S:'gid://shopify/ProductVariant/FILL_ME', M:'gid://shopify/ProductVariant/FILL_ME', L:'gid://shopify/ProductVariant/FILL_ME' },
  graphite: { S:'gid://shopify/ProductVariant/FILL_ME', M:'gid://shopify/ProductVariant/FILL_ME', L:'gid://shopify/ProductVariant/FILL_ME' },
  navy:     { S:'gid://shopify/ProductVariant/FILL_ME', M:'gid://shopify/ProductVariant/FILL_ME', L:'gid://shopify/ProductVariant/FILL_ME' },
  brown:    { S:'gid://shopify/ProductVariant/FILL_ME', M:'gid://shopify/ProductVariant/FILL_ME', L:'gid://shopify/ProductVariant/FILL_ME' },
};

/* ------------------------------------------------------------------ */
const SHOPIFY_ENABLED = !SHOPIFY_DOMAIN.includes('YOUR_STORE');
const SHOPIFY_CO_KEY  = 'tbx_shopify_co';

async function _gql(query, variables) {
  const r = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(j.errors[0].message);
  return j.data;
}

async function _getOrCreateCheckout() {
  const id = localStorage.getItem(SHOPIFY_CO_KEY);
  if (id) {
    try {
      const d = await _gql(`query{node(id:"${id}"){...on Checkout{id webUrl completedAt}}}`);
      const co = d?.node;
      if (co && !co.completedAt) return co;
    } catch (e) { /* expired — create new */ }
  }
  const d = await _gql(`mutation{checkoutCreate(input:{}){checkout{id webUrl}userErrors{message}}}`);
  const co = d.checkoutCreate.checkout;
  localStorage.setItem(SHOPIFY_CO_KEY, co.id);
  return co;
}

async function shopifyGoCheckout(cartItems) {
  if (!SHOPIFY_ENABLED) return null;
  try {
    const co = await _getOrCreateCheckout();
    const lineItems = cartItems
      .map(i => ({ variantId: SHOPIFY_VARIANTS[i.key]?.[i.size], quantity: i.qty }))
      .filter(li => li.variantId && !li.variantId.includes('FILL_ME'));
    if (!lineItems.length) return null;
    const d = await _gql(`
      mutation replace($id:ID!,$li:[CheckoutLineItemInput!]!){
        checkoutLineItemsReplace(checkoutId:$id,lineItems:$li){
          checkout{id webUrl} userErrors{message}
        }
      }`, { id: co.id, li: lineItems });
    return d.checkoutLineItemsReplace.checkout;
  } catch (e) {
    console.error('[TBX Shopify]', e);
    return null;
  }
}

/* Shopify Customer Auth */
async function shopifyCustomerLogin(email, password) {
  const d = await _gql(`
    mutation login($input:CustomerAccessTokenCreateInput!){
      customerAccessTokenCreate(input:$input){
        customerAccessToken{accessToken expiresAt}
        userErrors{message}
      }
    }`, { input: { email, password } });
  const { customerAccessToken, userErrors } = d.customerAccessTokenCreate;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return customerAccessToken;
}

async function shopifyCustomerCreate(firstName, lastName, email, password) {
  const d = await _gql(`
    mutation create($input:CustomerCreateInput!){
      customerCreate(input:$input){
        customer{id email}
        userErrors{field message}
      }
    }`, { input: { firstName, lastName, email, password } });
  const { customer, userErrors } = d.customerCreate;
  if (userErrors.length) throw new Error(userErrors[0].message);
  return customer;
}

async function shopifyGetCustomer(token) {
  const d = await _gql(`
    query($token:String!){
      customer(customerAccessToken:$token){
        id firstName lastName email
        orders(first:10,sortKey:PROCESSED_AT,reverse:true){
          edges{node{
            id orderNumber processedAt
            totalPrice{amount currencyCode}
            fulfillmentStatus financialStatus
            lineItems(first:3){edges{node{
              title quantity
              variant{image{url} price{amount currencyCode}}
            }}}
          }}
        }
      }
    }`, { token });
  return d.customer;
}

window.TBXShopify = {
  SHOPIFY_ENABLED,
  shopifyGoCheckout,
  shopifyCustomerLogin,
  shopifyCustomerCreate,
  shopifyGetCustomer,
};
