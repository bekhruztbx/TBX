/* ===================== TBX CORE JS ===================== */
(function(){
"use strict";

/* ---------- ALWAYS OPEN AT TOP ---------- */
if('scrollRestoration' in history)history.scrollRestoration='manual';
// fresh load with no hash → always start at the very top (beats mobile Safari restore)
if(!location.hash){
  const toTop=()=>window.scrollTo(0,0);
  toTop();requestAnimationFrame(toTop);
  addEventListener('load',()=>{toTop();setTimeout(toTop,60);setTimeout(toTop,200);});
}

/* ---------- DATA ---------- */
const TONES=[
  {key:'bone',name:'Bone',code:'01 — Natural Sand',hex:'#C9BCA0',front:'assets/bone-front.jpeg',back:'assets/bone-back.jpeg',tight:'assets/bone-tight.jpg',badge:'NEW',desc:'Soft natural sand with tonal cursive embroidery. The quietest, most versatile tone in the drop.',sdesc:'Natural sand, tonal stitch.'},
  {key:'olive',name:'Field Olive',code:'02 — Military Green',hex:'#3F4536',front:'assets/olive-front.jpeg',back:'assets/olive-back.jpeg',tight:'assets/olive-tight.jpg',badge:'',desc:'Muted military green with contrast cream piping down the sleeve. Earthy, rugged, year-round.',sdesc:'Muted green, cream piping.'},
  {key:'graphite',name:'Graphite',code:'03 — Washed Coal',hex:'#4B4945',front:'assets/graphite-front.jpeg',back:'assets/graphite-back.jpeg',tight:'assets/graphite-tight.jpg',badge:'',desc:'Washed charcoal grey — the everyday staple that goes with everything you own.',sdesc:'Washed charcoal staple.'},
  {key:'navy',name:'Midnight Navy',code:'04 — Deep Indigo',hex:'#2B3447',front:'assets/navy-front.jpeg',back:'assets/navy-back.jpeg',tight:'assets/navy-tight.jpg',badge:'',desc:'Deep indigo navy with a cream TAKE ACTION back hit. Sharp, clean, understated.',sdesc:'Deep indigo, cream hit.'},
  {key:'brown',name:'Espresso',code:'05 — Burnt Cocoa',hex:'#46382E',front:'assets/brown-front.jpeg',back:'assets/brown-back.jpeg',tight:'assets/brown-tight.jpg',badge:'',desc:'Rich espresso brown — warm, grounded, and the standout of the season.',sdesc:'Warm espresso brown.'}
];
const PRICE=69.99, WAS=79.99, TAX_RATE=0.08, SHIP_COST=5.99;
const toneByKey=k=>TONES.find(t=>t.key===k);
const money=n=>'$'+(n<0?0:n).toFixed(2);
const US_STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

/* ---------- ICONS ---------- */
const ICONS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-ig" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></symbol>
<symbol id="i-tt" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 3c.35 2.1 1.6 3.55 3.65 3.78v2.74c-1.32.05-2.55-.33-3.66-1.02v5.96c0 3.02-2.2 5.34-5.2 5.34-2.9 0-5.24-2.18-5.24-5.07 0-3.01 2.45-5.18 5.5-5.05v2.83c-.34-.09-.66-.12-1-.12-1.3 0-2.36 1.06-2.36 2.36 0 1.36 1.02 2.4 2.36 2.4 1.36 0 2.52-1.04 2.52-2.55V3h2.93z"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.6 6.5 12 12l8.4-5.5" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 3.5h3l1.6 4.2-2.1 1.5a11.5 11.5 0 0 0 5.3 5.3l1.5-2.1 4.2 1.6v3a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 3 5.6 2 2 0 0 1 5 3.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-arr" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21c4-4 7-7.2 7-11a7 7 0 1 0-14 0c0 3.8 3 7 7 11z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-bag" viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 9.5h18" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-truck" viewBox="0 0 24 24"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17.5" cy="17.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.6"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="currentColor"/></symbol>
<symbol id="i-star-o" viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
<symbol id="i-leaf" viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-13 0 9-5 14-14 13zM5 19c3-5 6-7 9-8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M4 11l8-6 8 6M6 10v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><circle cx="7.5" cy="7.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16.5" cy="7.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="7.5" cy="16.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16.5" cy="16.5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-quote" viewBox="0 0 24 24"><path d="M9 7H5v5h4v-1c0 2-1 3-3 3M19 7h-4v5h4v-1c0 2-1 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/></symbol>
</defs></svg>`;

/* ---------- NAV LINKS ---------- */
const HOME='TBX.html';
const navLinks=[
  {label:'Shop',href:'shop.html',key:'shop'},
  {label:'Colorways',href:HOME+'#colors',key:'colors'},
  {label:'Manifesto',href:HOME+'#mani',key:'mani'},
  {label:'Contact',href:'contact.html',key:'contact'}
];
const menuLinks=[
  {label:'Home',sub:'Back to the main page',icon:'i-home',href:HOME,key:'home'},
  {label:'Hoodies / Shop',sub:'Explore Drop 01',icon:'i-bag',href:'shop.html',key:'shop'},
  {label:'Colorways',sub:'Five tonal colors',icon:'i-grid',href:HOME+'#colors',key:'colors'},
  {label:'Manifesto',sub:'The philosophy behind TBX',icon:'i-quote',href:HOME+'#mani',key:'mani'},
  {label:'Cart',sub:'Review selected pieces',icon:'i-bag',nav:'cart',key:'cart'},
  {label:'Contact',sub:'Reach the studio',icon:'i-mail',href:'contact.html',key:'contact'},
  {label:'FAQ',sub:'Shipping and returns',icon:'i-help',href:'contact.html#faq',key:'faq'}
];

/* ---------- CHROME HTML ---------- */
function navHTML(active){
  return `<div class="ticker" id="ticker"></div>
<nav id="nav">
  <a href="${HOME}" class="brand" data-cur><img src="assets/logo-bone.png" alt="TBX" /></a>
  <div class="links">
    ${navLinks.map(l=>`<a href="${l.href}" class="nl${active===l.key?' active':''}" data-cur>${l.label}</a>`).join('')}
    <div class="navsoc">
      <a href="https://instagram.com/tbx.takeaction" target="_blank" rel="noopener" aria-label="Instagram" data-cur><svg><use href="#i-ig"/></svg></a>
      <a href="https://tiktok.com/@tbx.takeaction" target="_blank" rel="noopener" aria-label="TikTok" data-cur><svg><use href="#i-tt"/></svg></a>
    </div>
    <a href="#" class="cart" id="cartBtn" data-cur>Cart<span class="cc" data-cart-count>0</span></a>
    <button class="burger" id="burger" aria-label="Open menu" data-cur><span></span><span></span><span></span></button>
  </div>
</nav>`;
}
function menuHTML(active){
  return `<div class="menu" id="menu" aria-hidden="true">
  <div class="mhead"><img src="assets/logo-bone.png" alt="TBX" />
    <button class="mclose" id="menuClose" aria-label="Close menu" data-cur><svg><use href="#i-close"/></svg></button></div>
  <nav class="mbody">
    ${menuLinks.map(l=>`<a class="mlink mcard${active===l.key?' active':''}" ${l.nav?`data-nav="${l.nav}"`:`href="${l.href}"`} data-cur>
      <span class="mci"><svg><use href="#${l.icon}"/></svg></span>
      <span class="mct"><b>${l.label}${l.key==='cart'?'<span class="mc" data-cart-count>0</span>':''}</b><span>${l.sub}</span></span>
      <span class="mca"><svg><use href="#i-arr"/></svg></span>
    </a>`).join('')}
    <div class="msocial">
      <a class="msicon" href="https://instagram.com/tbx.takeaction" target="_blank" rel="noopener" aria-label="Instagram" data-cur><svg><use href="#i-ig"/></svg></a>
      <a class="msicon" href="https://tiktok.com/@tbx.takeaction" target="_blank" rel="noopener" aria-label="TikTok" data-cur><svg><use href="#i-tt"/></svg></a>
      <a class="msicon" href="mailto:studio@tbx-takeaction.com" aria-label="Email" data-cur><svg><use href="#i-mail"/></svg></a>
    </div>
  </nav>
  <div class="mfoot">
    <span class="mtag">TAKE ACTION · EST 2026</span>
  </div>
</div>
<div class="scrim" id="scrim"></div>`;
}
function drawerHTML(){
  return `<aside class="drawer" id="drawer" aria-label="Shopping cart">
  <div class="dhead"><h3>Your Cart <span class="dn" id="drawerQty">0 items</span></h3>
    <button class="dclose" id="drawerClose" aria-label="Close cart" data-cur><svg><use href="#i-close"/></svg></button></div>
  <div class="dbody" id="drawerBody"></div>
  <div class="dfoot" id="drawerFoot">
    <div class="drow"><span>Shipping</span><span>Calculated at checkout</span></div>
    <div class="drow dsub"><span>Subtotal</span><b id="drawerSub">$0.00</b></div>
    <button class="btn fill full dgo" id="goCheckout" data-cur>Checkout <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg></button>
    <p class="dnote">Free returns within 14 days · Secure checkout</p>
  </div>
</aside>`;
}
function checkoutHTML(){
  return `<div class="checkout" id="checkout" aria-label="Checkout">
  <div class="cohead">
    <button class="coback" id="coBack" data-cur><svg><use href="#i-arr"/></svg> Back</button>
    <img src="assets/logo-bone.png" alt="TBX" style="filter:invert(1) brightness(.2)" />
    <span class="colock"><svg><use href="#i-lock"/></svg> Secure</span>
  </div>
  <div class="cowrap" id="coWrap">
    <form class="coform" id="coForm" onsubmit="return false">
      <div class="coerr" id="coErr"><svg><use href="#i-close"/></svg> Please fill in all required fields</div>
      <div class="cosec">
        <h3><span class="num">1</span> Contact</h3>
        <div class="cogrid">
          <div class="field full"><label>Email</label><input type="email" placeholder="you@email.com" autocomplete="email" data-req /><span class="err">Required</span></div>
        </div>
        <div class="checkrow on" id="emailOptin" role="checkbox" aria-checked="true" data-cur><span class="cbx"><svg><use href="#i-check"/></svg></span><span class="ctxt">Email me with news and offers</span></div>
      </div>
      <div class="cosec">
        <h3><span class="num">2</span> Shipping Address</h3>
        <div class="cogrid">
          <div class="field"><label>First name</label><input type="text" placeholder="First" autocomplete="given-name" data-req /><span class="err">Required</span></div>
          <div class="field"><label>Last name</label><input type="text" placeholder="Last" autocomplete="family-name" data-req /><span class="err">Required</span></div>
          <div class="field full"><label>Address</label><input type="text" placeholder="Street address" autocomplete="address-line1" id="addrInput" data-req /><span class="err">Required</span></div>
          <div class="field full"><label>Apartment, suite (optional)</label><input type="text" placeholder="Apt / Suite" autocomplete="address-line2" /></div>
          <div class="field full"><label>City</label><input type="text" placeholder="City" autocomplete="address-level2" id="cityInput" data-req /><span class="err">Required</span></div>
          <div class="field"><label>State</label><select data-req id="stateInput"><option value="">Select state</option>${US_STATES.map(s=>`<option>${s}</option>`).join('')}</select><span class="err">Required</span></div>
          <div class="field"><label>ZIP code</label><input type="text" placeholder="ZIP" autocomplete="postal-code" id="zipInput" data-req /><span class="err">Required</span></div>
          <div class="field full"><label>Country</label><select data-req><option value="United States" selected>United States</option></select><span class="err">Required</span></div>
        </div>
      </div>
      <div class="cosec">
        <h3><span class="num">3</span> Shipping Method</h3>
        <div class="optcards" id="delivery">
          <div class="optcard on" data-ship="5.99" data-cur><span class="ring"></span><svg><use href="#i-truck"/></svg><span class="ot"><b>Standard Shipping</b><span>Estimated 5–7 business days</span></span><span class="op">$5.99</span></div>
        </div>
      </div>
      <div class="cosec">
        <h3><span class="num">4</span> Payment</h3>
        <p class="paysub">All transactions are secure and encrypted.</p>
        <div class="paystack" id="payStack">
          <div class="payopt on" data-pay="card" data-cur>
            <div class="payhead"><span class="ring"></span><span class="payname">Credit Card</span>
              <span class="cardlogos"><i class="cl visa">VISA</i><i class="cl mc">MC</i><i class="cl amex">AMEX</i><i class="cl disc">DISC</i><i class="cl more">+5</i></span>
            </div>
            <div class="paybody">
              <div class="cogrid">
                <div class="field full"><label>Card number</label><span class="inwrap"><input type="text" inputmode="numeric" placeholder="4242 4242 4242 4242" maxlength="19" id="ccNum" data-req data-card /><span class="inlock" id="ccBrand"><svg><use href="#i-lock"/></svg></span></span><span class="err">Required</span></div>
                <div class="field"><label>Expiration (MM / YY)</label><input type="text" placeholder="MM / YY" maxlength="7" id="ccExp" data-req data-card /><span class="err">Required</span></div>
                <div class="field"><label>Security code</label><span class="inwrap"><input type="text" inputmode="numeric" placeholder="CVC" maxlength="4" data-req data-card /><span class="inlock"><svg><use href="#i-lock"/></svg></span></span><span class="err">Required</span></div>
                <div class="field full"><label>Name on card</label><input type="text" placeholder="Full name" autocomplete="cc-name" data-req data-card /><span class="err">Required</span></div>
              </div>
              <div class="checkrow on" id="billSameCard" role="checkbox" aria-checked="true" data-cur><span class="cbx"><svg><use href="#i-check"/></svg></span><span class="ctxt">Use shipping address as billing address</span></div>
            </div>
          </div>
          <div class="payopt" data-pay="shoppay" data-cur>
            <div class="payhead"><span class="ring"></span><span class="payname">Shop Pay</span><span class="paymeta">Pay in full or in installments</span><span class="paybrand shoppay">shop<b>Pay</b></span></div>
            <div class="paybody"><div class="alt"><svg><use href="#i-lock"/></svg> Continue with Shop Pay to complete securely.</div></div>
          </div>
          <div class="payopt" data-pay="paypal" data-cur>
            <div class="payhead"><span class="ring"></span><span class="payname">PayPal</span><span class="paybrand paypal">Pay<b>Pal</b></span></div>
            <div class="paybody"><div class="alt"><svg><use href="#i-lock"/></svg> You'll be redirected to PayPal to complete your purchase.</div></div>
          </div>
          <div class="payopt" data-pay="apple" data-cur>
            <div class="payhead"><span class="ring"></span><span class="payname">Apple Pay</span><span class="paybrand apple">&#63743;Pay</span></div>
            <div class="paybody"><div class="alt"><svg><use href="#i-lock"/></svg> Confirm with Apple Pay on your device.</div></div>
          </div>
          <div class="payopt" data-pay="google" data-cur>
            <div class="payhead"><span class="ring"></span><span class="payname">Google Pay</span><span class="paybrand gpay"><b>G</b>Pay</span></div>
            <div class="paybody"><div class="alt"><svg><use href="#i-lock"/></svg> Confirm with Google Pay on your device.</div></div>
          </div>
        </div>
        <div class="secline"><svg><use href="#i-lock"/></svg><span>Secure encrypted checkout · 256-bit SSL protection</span></div>
      </div>
      <div class="cosec">
        <h3><span class="num">5</span> Billing Address</h3>
        <div class="billtoggle" id="billToggle">
          <div class="optcard on" data-bill="same" data-cur><span class="ring"></span><span class="ot"><b>Same as shipping address</b></span></div>
          <div class="optcard" data-bill="diff" data-cur><span class="ring"></span><span class="ot"><b>Use a different billing address</b></span></div>
        </div>
        <div class="billfields" id="billFields">
          <div class="cogrid">
            <div class="field"><label>First name</label><input type="text" placeholder="First" data-bill-req /><span class="err">Required</span></div>
            <div class="field"><label>Last name</label><input type="text" placeholder="Last" data-bill-req /><span class="err">Required</span></div>
            <div class="field full"><label>Address</label><input type="text" placeholder="Street address" data-bill-req /><span class="err">Required</span></div>
            <div class="field full"><label>City</label><input type="text" placeholder="City" data-bill-req /><span class="err">Required</span></div>
            <div class="field"><label>State</label><select data-bill-req><option value="">Select state</option>${US_STATES.map(s=>`<option>${s}</option>`).join('')}</select><span class="err">Required</span></div>
            <div class="field"><label>ZIP code</label><input type="text" placeholder="ZIP" data-bill-req /><span class="err">Required</span></div>
            <div class="field full"><label>Country</label><select data-bill-req><option value="United States" selected>United States</option></select><span class="err">Required</span></div>
          </div>
        </div>
      </div>
      <div class="saveinfo" id="saveInfo">
        <div class="sihead on" id="saveHead" role="checkbox" aria-checked="true" data-cur><span class="cbx"><svg><use href="#i-check"/></svg></span><b>Save my information for a faster checkout</b></div>
        <p class="sitext">By paying, you agree to create a Shop account subject to Shop's Terms and Privacy Policy.</p>
        <a class="notnow" id="saveNotNow" data-cur>Not now</a>
      </div>
    </form>
    <aside class="osum" id="osum">
      <h3>Order Summary</h3>
      <div class="oitems" id="oItems"></div>
      <div class="ocode"><input type="text" placeholder="Discount code" id="codeInput" /><button type="button" id="codeApply" data-cur>Apply</button></div>
      <div class="oline"><span>Subtotal</span><span id="oSub">$0.00</span></div>
      <div class="oline" id="oDiscRow" style="display:none"><span>Discount</span><span id="oDisc">−$0.00</span></div>
      <div class="oline"><span>Shipping</span><span id="oShip">$5.99</span></div>
      <div class="oline"><span>Tax (est.)</span><span id="oTax">$0.00</span></div>
      <div class="oline tot"><span class="tl">Total</span><b id="oTotal">$0.00</b></div>
      <button class="btn fill full placebtn" id="placeOrder" data-cur><span id="placeLabel">Place Order</span> <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg></button>
      <div class="coguar">
        <span class="g"><svg><use href="#i-lock"/></svg> Encrypted &amp; secure checkout</span>
        <span class="g"><svg><use href="#i-truck"/></svg> Free returns within 14 days</span>
      </div>
    </aside>
  </div>
  <div class="cosuccess" id="coSuccess">
    <div class="sicon"><svg><use href="#i-check"/></svg></div>
    <h2>Order<br/>confirmed.</h2>
    <p>Thank you for taking action. A confirmation has been sent to your email — your TBX pieces are being prepared for shipment.</p>
    <span class="ordno" id="ordNo">ORDER #TBX-00000</span>
    <button class="btn ink" id="coDone" data-cur>Continue Shopping <svg class="ar" width="16" height="16"><use href="#i-arr"/></svg></button>
  </div>
</div>
<div class="toast" id="toast" hidden style="display:none!important"></div>`;
}
function footerHTML(){
  return `<footer>
  <div class="ftop">
    <div class="fbrand">
      <img class="flogo" src="assets/logo-bone.png" alt="TBX" />
      <p>Take Action. Oversized essentials, cut heavy and built to last. Designed in limited runs — never restocked the same way twice.</p>
      <div class="fsoc">
        <a href="https://instagram.com/tbx.takeaction" target="_blank" rel="noopener" aria-label="Instagram" data-cur><svg><use href="#i-ig"/></svg></a>
        <a href="https://tiktok.com/@tbx.takeaction" target="_blank" rel="noopener" aria-label="TikTok" data-cur><svg><use href="#i-tt"/></svg></a>
        <a href="mailto:studio@tbx-takeaction.com" aria-label="Email" data-cur><svg><use href="#i-mail"/></svg></a>
        <a href="tel:+10000000000" aria-label="Phone" data-cur><svg><use href="#i-phone"/></svg></a>
      </div>
    </div>
    <div class="fcol"><h5>Shop</h5>
      <a href="shop.html" data-cur>All Products</a>
      <a href="${HOME}#colors" data-cur>Colorways</a>
      <a href="shop.html" data-cur>The Hoodie</a>
      <a href="#" data-cur data-open-cart>Your Cart</a>
    </div>
    <div class="fcol"><h5>Help</h5>
      <a href="contact.html#faq" data-cur>Sizing Guide</a>
      <a href="contact.html#faq" data-cur>Shipping</a>
      <a href="contact.html#faq" data-cur>Returns</a>
      <a href="contact.html" data-cur>Contact Us</a>
    </div>
    <div class="fnews"><h5>Connect</h5>
      <div class="fcol" style="margin-bottom:22px;gap:11px">
        <a class="ic" href="https://instagram.com/tbx.takeaction" target="_blank" rel="noopener" data-cur><svg><use href="#i-ig"/></svg>@tbx.takeaction</a>
        <a class="ic" href="https://tiktok.com/@tbx.takeaction" target="_blank" rel="noopener" data-cur><svg><use href="#i-tt"/></svg>@tbx.takeaction</a>
        <a class="ic" href="mailto:studio@tbx-takeaction.com" data-cur><svg><use href="#i-mail"/></svg>studio@tbx-takeaction.com</a>
      </div>
      <p>Newsletter — first access to every drop.</p>
      <form class="fform" id="fform" onsubmit="return false">
        <input type="email" placeholder="Email address" id="femail" />
        <button type="submit" aria-label="Subscribe" data-cur><svg><use href="#i-arr"/></svg></button>
      </form>
    </div>
  </div>
  <div class="fbar">
    <span>© 2026 TBX STUDIO — TAKE ACTION</span>
    <span style="display:flex;gap:20px"><a href="#" data-cur>Privacy</a><a href="#" data-cur>Terms</a><a href="contact.html" data-cur>Contact</a></span>
    <span>ALL RIGHTS RESERVED</span>
  </div>
</footer>`;
}

/* ---------- MOUNT CHROME ---------- */
const body=document.body;
const active=body.getAttribute('data-active')||'';
const hasFooter=body.hasAttribute('data-no-footer');
// pre-body overlays
const pre=document.createElement('div');
pre.innerHTML=`<div class="veil" id="veil"></div><div class="grain"></div><div class="cur"></div><div class="curdot"></div>`+ICONS+navHTML(active);
body.insertBefore(pre,body.firstChild);
// post-body chrome
const post=document.createElement('div');
post.innerHTML=(hasFooter?'':footerHTML())+menuHTML(active)+drawerHTML()+checkoutHTML();
body.appendChild(post);

/* ---------- $ helpers ---------- */
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

/* ---------- SCROLLERS ---------- */
function buildScroller(host,cycleHTML){
  if(!host)return;
  const probe=document.createElement('div');probe.className='run';probe.style.visibility='hidden';probe.style.position='absolute';host.appendChild(probe);
  let html='';do{html+=cycleHTML;probe.innerHTML=html;}while(probe.scrollWidth<innerWidth*1.4&&html.length<24000);
  host.removeChild(probe);
  const track=document.createElement('div');track.className='track';
  const r1=document.createElement('div');r1.className='run';r1.innerHTML=html;
  const r2=document.createElement('div');r2.className='run';r2.innerHTML=html;
  track.appendChild(r1);track.appendChild(r2);host.innerHTML='';host.appendChild(track);
}
const TICK_CYCLE='<span>TAKE ACTION</span><span>◦</span><span><img class="tklogo" src="assets/logo-bone.png" alt="TBX"/>STUDIO</span><span>◦</span><span>FREE RETURNS WITHIN 14 DAYS</span><span>◦</span><span>DROP 01 — 5 TONES LIVE</span><span>◦</span>';
const MARQ_CYCLE='<span>TAKE ACTION</span><span><img class="mqlogo" src="assets/logo-ink.png" alt="TBX"/></span>';
function buildScrollers(){buildScroller($('#ticker'),TICK_CYCLE);buildScroller($('#marq'),MARQ_CYCLE);}
buildScrollers();
let scRsz;addEventListener('resize',()=>{clearTimeout(scRsz);scRsz=setTimeout(buildScrollers,250);});

/* ---------- CURSOR ---------- */
const cur=$('.cur'),dot=$('.curdot');
let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my;
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;dot.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;});
(function loop(){cx+=(mx-cx)*.16;cy+=(my-cy)*.16;cur.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;requestAnimationFrame(loop);})();
document.addEventListener('mouseover',e=>{if(e.target.closest('[data-cur],a,button'))cur.classList.add('big');});
document.addEventListener('mouseout',e=>{if(e.target.closest('[data-cur],a,button'))cur.classList.remove('big');});

/* ---------- VEIL ---------- */
const veil=$('#veil');
function dropVeil(){if(veil)requestAnimationFrame(()=>requestAnimationFrame(()=>veil.classList.add('gone')));}
if(document.readyState==='complete')dropVeil();else addEventListener('load',dropVeil);
setTimeout(dropVeil,1400);
if(veil)veil.addEventListener('transitionend',()=>veil.remove());

/* ---------- NAV SOLID ---------- */
const nav=$('#nav');
if(document.body.hasAttribute('data-dark-nav')){const lg=nav.querySelector('.brand img');if(lg)lg.src='assets/logo-ink.png';}
if(document.body.hasAttribute('data-solid-nav'))nav.classList.add('always-solid');
if(!nav.classList.contains('always-solid'))addEventListener('scroll',()=>nav.classList.toggle('solid',scrollY>40),{passive:true});

/* ---------- REVEAL ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.14});
function observeReveals(){$$('.reveal:not(.in)').forEach(el=>io.observe(el));}
observeReveals();
window.tbxObserveReveals=observeReveals;

/* ---------- TOAST (disabled — no floating popup) ---------- */
function showToast(){/* intentionally no-op: cart count + drawer are the only feedback */}

/* ---------- CART STATE ---------- */
const CART_KEY='tbx_cart_v1';
let cartItems=[];try{cartItems=JSON.parse(localStorage.getItem(CART_KEY))||[];}catch(e){cartItems=[];}
let discount=0, shipCost=SHIP_COST, billMode='same';
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cartItems));}catch(e){}}
const cartQty=()=>cartItems.reduce((s,i)=>s+i.qty,0);
const cartSub=()=>cartItems.reduce((s,i)=>s+i.qty*i.price,0);
function updateCount(){const q=cartQty();$$('[data-cart-count]').forEach(el=>el.textContent=q);}
function addItem(key,size,qty){
  const t=toneByKey(key);if(!t)return;qty=qty||1;size=size||'M';
  const id=key+'__'+size;const ex=cartItems.find(i=>i.id===id);
  if(ex)ex.qty+=qty;else cartItems.push({id,key,name:t.name,hex:t.hex,size,price:PRICE,img:t.tight,qty});
  saveCart();updateCount();renderDrawer();renderSummary();
  showToast(t.name+' · '+size+' — Added',t.hex);openDrawer();
}
function changeQty(id,d){const it=cartItems.find(i=>i.id===id);if(!it)return;it.qty+=d;if(it.qty<1)cartItems=cartItems.filter(i=>i.id!==id);saveCart();updateCount();renderDrawer();renderSummary();}
function removeItem(id){cartItems=cartItems.filter(i=>i.id!==id);saveCart();updateCount();renderDrawer();renderSummary();}

/* ---------- DRAWER ---------- */
const drawer=$('#drawer'),scrim=$('#scrim'),drawerBody=$('#drawerBody'),menu=$('#menu'),checkout=$('#checkout'),coWrap=$('#coWrap'),coSuccess=$('#coSuccess');
let menuOpen=false;
function syncLock(){const locked=menuOpen||drawer.classList.contains('open')||checkout.classList.contains('open');document.documentElement.style.overflow=locked?'hidden':'';document.body.style.overflow=locked?'hidden':'';}
function renderDrawer(){
  const q=cartQty();$('#drawerQty').textContent=q+(q===1?' item':' items');
  if(!cartItems.length){drawerBody.innerHTML='<div class="cempty"><svg><use href="#i-bag"/></svg><p>Your cart is empty</p><a class="shoplink" href="shop.html" data-cur>Browse the collection</a></div>';}
  else{drawerBody.innerHTML=cartItems.map(it=>`
    <div class="citem"><img class="cthumb" src="${it.img}" alt="${it.name}" />
      <div class="cmid"><div class="crow1"><h4>${it.name}</h4><span class="cprice">${money(it.qty*it.price)}</span></div>
        <div class="cmeta"><span class="cdot" style="background:${it.hex}"></span>Size ${it.size}</div>
        <div class="crow2"><div class="qty">
          <button data-q="-1" data-id="${it.id}" aria-label="Decrease" data-cur><svg><use href="#i-minus"/></svg></button>
          <span class="qn">${it.qty}</span>
          <button data-q="1" data-id="${it.id}" aria-label="Increase" data-cur><svg><use href="#i-plus"/></svg></button>
        </div><button class="cremove" data-rm="${it.id}" data-cur><svg><use href="#i-trash"/></svg> Remove</button></div>
      </div></div>`).join('');}
  $('#drawerSub').textContent=money(cartSub());
  $('#goCheckout').style.opacity=cartItems.length?'1':'.45';
}
drawerBody.addEventListener('click',e=>{const q=e.target.closest('[data-q]');if(q){changeQty(q.dataset.id,+q.dataset.q);return;}const rm=e.target.closest('[data-rm]');if(rm)removeItem(rm.dataset.rm);});
function openDrawer(){renderDrawer();drawer.classList.add('open');scrim.classList.add('show');syncLock();}
function closeDrawer(){drawer.classList.remove('open');scrim.classList.remove('show');syncLock();}
scrim.addEventListener('click',closeDrawer);
$('#drawerClose').addEventListener('click',closeDrawer);
$('#cartBtn').addEventListener('click',e=>{e.preventDefault();openDrawer();});
$$('[data-open-cart]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openDrawer();}));

/* ---------- ADD TO CART DELEGATION ---------- */
document.addEventListener('click',e=>{
  const sb=e.target.closest('.sizes button,.sizerow button,.csizes button');
  if(sb && !sb.dataset.nostate){sb.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('on'));sb.classList.add('on');}
  const add=e.target.closest('[data-add]');
  if(add){
    const key=add.dataset.add;
    const scope=add.closest('[data-scope]')||add.closest('.pcard')||document;
    const sizeBtn=scope.querySelector('.sizes button.on,.sizerow button.on,.csizes button.on');
    const size=sizeBtn?sizeBtn.dataset.size:'M';
    const qtyEl=scope.querySelector('[data-qn]');
    const qty=qtyEl?parseInt(qtyEl.textContent)||1:1;
    addItem(key,size,qty);
  }
});

/* ---------- CHECKOUT ---------- */
function renderSummary(){
  const items=$('#oItems');if(!items)return;
  items.innerHTML=cartItems.map(it=>`
    <div class="oitem"><div style="position:relative"><img class="othumb" src="${it.img}" alt="${it.name}" /><span class="oqty">${it.qty}</span></div>
    <div><div class="oname">${it.name}</div><div class="ometa">Size ${it.size}</div></div>
    <span class="olp">${money(it.qty*it.price)}</span></div>`).join('');
  const sub=cartSub(),disc=sub*discount,taxed=(sub-disc)*TAX_RATE,total=sub-disc+(cartItems.length?shipCost:0)+taxed;
  $('#oSub').textContent=money(sub);
  const dr=$('#oDiscRow');if(discount>0){dr.style.display='';$('#oDisc').textContent='−'+money(disc);}else dr.style.display='none';
  $('#oShip').textContent=cartItems.length?money(shipCost):money(0);
  $('#oTax').textContent=money(taxed);
  $('#oTotal').textContent=money(total);
}
let activePay='card';
$('#payStack').addEventListener('click',e=>{const t=e.target.closest('.payopt');if(!t)return;
  if(e.target.closest('input,.checkrow'))return;
  $$('.payopt').forEach(x=>x.classList.remove('on'));t.classList.add('on');activePay=t.dataset.pay;
  $('#payStack').classList.remove('invalid');
  const labels={card:'Place Order',shoppay:'Continue with Shop Pay',paypal:'Pay with PayPal',apple:'Pay with Apple Pay',google:'Pay with Google Pay'};
  $('#placeLabel').textContent=labels[activePay]||'Place Order';
});
// "use shipping address as billing" checkbox inside card panel mirrors billing toggle
(function(){const cb=$('#billSameCard');if(cb)cb.addEventListener('click',()=>{const on=cb.classList.toggle('on');cb.setAttribute('aria-checked',on);
  billMode=on?'same':'diff';
  $$('#billToggle .optcard').forEach(c=>c.classList.toggle('on',c.dataset.bill===billMode));
  $('#billFields').classList.toggle('show',billMode==='diff');});})();
// billing toggle
$('#billToggle').addEventListener('click',e=>{const c=e.target.closest('.optcard');if(!c)return;
  $$('#billToggle .optcard').forEach(x=>x.classList.remove('on'));c.classList.add('on');billMode=c.dataset.bill;
  $('#billFields').classList.toggle('show',billMode==='diff');
});
// checkbox toggles
function toggleCheck(el){el.addEventListener('click',()=>{const on=el.classList.toggle('on');el.setAttribute('aria-checked',on);});}
toggleCheck($('#emailOptin'));toggleCheck($('#saveHead'));
$('#saveNotNow').addEventListener('click',()=>{$('#saveInfo').classList.add('dismissed');$('#saveHead').classList.remove('on');});
// discount
$('#codeApply').addEventListener('click',()=>{const v=$('#codeInput').value.trim().toUpperCase();if(!v)return;
  if(v==='TAKEACTION'||v==='TBX10'){discount=0.1;showToast('Code applied — 10% off');}else{discount=0;showToast('Invalid code');}renderSummary();});
// card formatting + brand detection
const ccNum=$('#ccNum');const ccBrand=$('#ccBrand');
function detectBrand(n){if(/^4/.test(n))return'visa';if(/^(5[1-5]|2[2-7])/.test(n))return'mc';if(/^3[47]/.test(n))return'amex';if(/^6(011|5)/.test(n))return'disc';if(/^3(0|6|8)/.test(n))return'diners';if(/^35/.test(n))return'jcb';return'';}
const BRANDTXT={visa:'VISA',mc:'MC',amex:'AMEX',disc:'DISC',diners:'DINERS',jcb:'JCB'};
ccNum.addEventListener('input',()=>{let v=ccNum.value.replace(/\D/g,'').slice(0,16);ccNum.value=v.replace(/(.{4})/g,'$1 ').trim();
  const b=detectBrand(v);if(ccBrand){if(b&&v.length>=2){ccBrand.textContent=BRANDTXT[b];ccBrand.className='inlock brand';}else{ccBrand.innerHTML='<svg><use href="#i-lock"/></svg>';ccBrand.className='inlock';}}});
const ccExp=$('#ccExp');ccExp.addEventListener('input',()=>{let v=ccExp.value.replace(/\D/g,'').slice(0,4);if(v.length>2)v=v.slice(0,2)+' / '+v.slice(2);ccExp.value=v;});
// clear errors on input
$('#coForm').addEventListener('input',e=>{const f=e.target.closest('.field');if(f&&(e.target.value||'').trim())f.classList.remove('invalid');
  if(!$('#coForm .field.invalid'))$('#coErr').classList.remove('show');});
$('#coForm').addEventListener('change',e=>{const f=e.target.closest('.field');if(f&&(e.target.value||'').trim())f.classList.remove('invalid');});
function validate(){
  let first=null;
  $$('#coForm [data-req]').forEach(inp=>{const f=inp.closest('.field');const card=inp.hasAttribute('data-card');
    if(card&&activePay!=='card'){f.classList.remove('invalid');return;}
    if(!inp.value.trim()){f.classList.add('invalid');if(!first)first=f;}else f.classList.remove('invalid');});
  if(billMode==='diff'){$$('#billFields [data-bill-req]').forEach(inp=>{const f=inp.closest('.field');
    if(!inp.value.trim()){f.classList.add('invalid');if(!first)first=f;}else f.classList.remove('invalid');});}
  else $$('#billFields [data-bill-req]').forEach(inp=>inp.closest('.field').classList.remove('invalid'));
  const delSel=$('#delivery .optcard.on'),delW=$('#delivery');if(!delSel){delW.classList.add('invalid');if(!first)first=delW;}else delW.classList.remove('invalid');
  const paySel=$('#payStack .payopt.on'),payW=$('#payStack');if(!paySel){payW.classList.add('invalid');if(!first)first=payW;}else payW.classList.remove('invalid');
  return first;
}
function openCheckout(){
  if(!cartItems.length){showToast('Your cart is empty');return;}
  $('#coErr').classList.remove('show');$$('#coForm .field.invalid').forEach(f=>f.classList.remove('invalid'));
  $('#delivery').classList.remove('invalid');$('#payStack').classList.remove('invalid');
  closeDrawer();renderSummary();coWrap.style.display='';coSuccess.classList.remove('on');
  checkout.classList.add('open');syncLock();checkout.scrollTop=0;
}
function closeCheckout(){checkout.classList.remove('open');syncLock();}
$('#goCheckout').addEventListener('click',openCheckout);
$('#coBack').addEventListener('click',closeCheckout);
$('#placeOrder').addEventListener('click',()=>{
  if(!cartItems.length){showToast('Your cart is empty');return;}
  const bad=validate();
  if(bad){$('#coErr').classList.add('show');showToast('Please fill in all required fields');
    const inp=bad.querySelector('input,select');const y=bad.getBoundingClientRect().top+checkout.scrollTop-110;
    checkout.scrollTo({top:Math.max(0,y),behavior:'smooth'});if(inp)setTimeout(()=>inp.focus({preventScroll:true}),450);return;}
  $('#coErr').classList.remove('show');
  $('#ordNo').textContent='ORDER #TBX-'+Math.floor(10000+Math.random()*89999);
  coWrap.style.display='none';coSuccess.classList.add('on');checkout.scrollTop=0;
  cartItems=[];discount=0;saveCart();updateCount();renderDrawer();
});
$('#coDone').addEventListener('click',closeCheckout);

/* ---------- MENU ---------- */
function openMenu(){menu.classList.add('open');menu.setAttribute('aria-hidden','false');menuOpen=true;syncLock();}
function closeMenu(){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');menuOpen=false;syncLock();}
$('#burger').addEventListener('click',openMenu);
$('#menuClose').addEventListener('click',closeMenu);
menu.addEventListener('click',e=>{
  if(e.target===menu){closeMenu();return;}
  const link=e.target.closest('.mlink');if(!link)return;
  // cart opens the drawer
  if(link.dataset.nav==='cart'){e.preventDefault();closeMenu();setTimeout(openDrawer,360);return;}
  const href=link.getAttribute('href')||'';
  closeMenu();
  if(href.includes('#')){
    const hash=href.split('#')[1];
    const path=href.split('#')[0].split('/').pop();
    const here=location.pathname.split('/').pop()||'TBX.html';
    if(!path||path===here){
      // same page: release scroll lock, then smooth-scroll to the section
      e.preventDefault();
      setTimeout(()=>{const el=document.getElementById(hash);if(el)window.scrollTo({top:el.getBoundingClientRect().top+window.scrollY-70,behavior:'smooth'});},380);
      return;
    }
  }
  // cross-page links navigate normally (menu is closing)
});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(menuOpen)closeMenu();else if(drawer.classList.contains('open'))closeDrawer();else if(checkout.classList.contains('open')&&!coSuccess.classList.contains('on'))closeCheckout();}});

/* ---------- FAQ ACCORDION (generic) ---------- */
function wireAccordion(itemSel,qSel,aSel){
  $$(itemSel).forEach(it=>{const q=it.querySelector(qSel),a=it.querySelector(aSel);if(!q||!a)return;
    q.addEventListener('click',()=>{const open=it.classList.contains('open');
      // close siblings within same list
      const parent=it.parentElement;parent.querySelectorAll(itemSel).forEach(o=>{o.classList.remove('open');const oa=o.querySelector(aSel);if(oa)oa.style.maxHeight='';});
      if(!open){it.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}});});
}
window.tbxWireAccordion=wireAccordion;
wireAccordion('.faqitem','.faqq','.faqa');
wireAccordion('.pdpacc .ai','.aq','.aa');

/* ---------- NEWSLETTER (footer) ---------- */
const fform=$('#fform');if(fform)fform.addEventListener('submit',()=>{const em=$('#femail');if(em.value&&em.value.includes('@')){showToast('Subscribed — welcome to TBX');em.value='';}else em.focus();});

/* ---------- INIT ---------- */
updateCount();renderDrawer();renderSummary();

/* ---------- PUBLIC API ---------- */
window.TBX={TONES,toneByKey,money,addItem,openCart:openDrawer,showToast,renderProductCard,PRICE,WAS};

/* ---------- SHARED RENDERERS ---------- */
function renderProductCard(t,opts){
  opts=opts||{};
  const href='product.html?product='+t.key;
  return `<a class="pcard" href="${href}" data-cur>
    <div class="pimg">
      ${t.badge?`<span class="badge">${t.badge}</span>`:`<span class="badge">$${PRICE}</span>`}
      <span class="swatchdot" style="background:${t.hex}"></span>
      <img class="front" src="${t.front}" alt="${t.name} hoodie front" />
      <img class="back" src="${t.back}" alt="${t.name} hoodie back" />
      <img class="mtight" src="${t.tight}" alt="${t.name} hoodie" />
    </div>
    <div class="pbody">
      <div class="ptop"><h3>${t.name}</h3><span class="code">${t.code.split('—')[0].trim()}</span></div>
      <p class="desc">${t.sdesc}</p>
      <div class="price"><span class="now">$${PRICE}</span><span class="was">$${WAS}</span><span class="save">Save $10</span></div>
      <span class="viewbtn">View Product <svg><use href="#i-arr"/></svg></span>
    </div>
  </a>`;
}

})();
