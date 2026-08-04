/* ===================== TBX — STRIPE INTEGRATION =====================
  Real card payments. The publishable key below is safe client-side by design
  (same category as the Shopify Storefront token / Supabase publishable key) —
  the SECRET key that actually moves money lives only in Vercel's Environment
  Variables and is read server-side in /api/create-payment-intent.js. Never
  put the secret key here or anywhere in this repo.

  This is Stripe TEST MODE (pk_test_...) — no real money moves until the keys
  are swapped for live (pk_live_.../sk_live_...) in the Vercel dashboard.

  Requires https://js.stripe.com/v3/ to be loaded first (must come straight
  from Stripe's CDN, not self-hosted — this is a Stripe requirement, not a
  style choice, since it lets them ship fraud-detection updates instantly).
======================================================================= */

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TyhLURqELx0HLW4Tsaj6DZddApcSrt9lFJsZYeV24yoxVOsQwi5Pxc0hlaajKUxbSRzw7TarqThbq9rh5BlmfO900rc2bj9Kd';

const STRIPE_ENABLED = !STRIPE_PUBLISHABLE_KEY.includes('YOUR_') && typeof window.Stripe !== 'undefined';
const stripe = STRIPE_ENABLED ? window.Stripe(STRIPE_PUBLISHABLE_KEY) : null;
let elements = null;
let cardElement = null;

function mountCardElement(selector, onChange) {
  if (!STRIPE_ENABLED) return null;
  if (cardElement) return cardElement; // already mounted this checkout session
  elements = stripe.elements();
  cardElement = elements.create('card', {
    style: {
      base: {
        fontFamily: '"Archivo", sans-serif',
        fontSize: '15px',
        color: '#13120E',
        '::placeholder': { color: '#9a948a' },
      },
      invalid: { color: '#A23E2A' },
    },
  });
  cardElement.mount(selector);
  if (onChange) cardElement.on('change', onChange);
  return cardElement;
}

async function createPaymentIntent(quantity) {
  const r = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Could not start payment.');
  return data; // { clientSecret, amount }
}

async function confirmCardPayment(clientSecret, billingDetails) {
  if (!cardElement) throw new Error('Card details are not ready yet.');
  const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: cardElement, billing_details: billingDetails },
  });
  if (error) throw new Error(error.message);
  return paymentIntent;
}

window.TBXStripe = {
  STRIPE_ENABLED,
  mountCardElement,
  createPaymentIntent,
  confirmCardPayment,
};
