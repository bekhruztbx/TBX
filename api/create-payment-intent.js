/* Vercel serverless function — creates a real Stripe PaymentIntent.
   STRIPE_SECRET_KEY lives ONLY in Vercel's Environment Variables (Project Settings →
   Environment Variables), never in this file, never in the repo. This function uses
   Stripe's REST API directly via fetch (no npm dependency needed).

   Pricing is computed HERE, not trusted from the client — the client only sends how
   many items are in the cart, never a dollar amount. PRICE_CENTS mirrors the PRICE
   constant in tbx-core.js. TODO once products move to a real database: look up each
   line item's real price server-side instead of this flat per-item constant. */

const PRICE_CENTS = 6999;   // $69.99 — every tone/size is the same price today
const TAX_RATE     = 0.08;  // matches TAX_RATE in tbx-core.js
const SHIP_CENTS   = 599;   // matches SHIP_COST in tbx-core.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    res.status(400).json({ error: 'Invalid quantity' });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: 'Payments are not configured yet.' });
    return;
  }

  const subtotal = quantity * PRICE_CENTS;
  const tax = Math.round(subtotal * TAX_RATE);
  const amount = subtotal + tax + SHIP_CENTS;

  try {
    const params = new URLSearchParams();
    params.set('amount', String(amount));
    params.set('currency', 'usd');
    params.set('automatic_payment_methods[enabled]', 'true');

    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: data.error?.message || 'Stripe error' });
      return;
    }
    res.status(200).json({ clientSecret: data.client_secret, amount });
  } catch (e) {
    res.status(500).json({ error: 'Server error creating payment intent' });
  }
}
