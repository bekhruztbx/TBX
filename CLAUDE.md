# TBX — Claude Ish Qoidalari

## 1. Branch Workflow

- Barcha o'zgarishlarni **`main` da emas**, alohida branchda amalga oshir.
- Branch nomi o'zgarishni tavsiflasin: `feature/cart-fix`, `upgrade/shopify`, va h.k.
- O'zgarishlarni birinchi **localhost da ko'rsat** — foydalanuvchi tasdiqlagunicha push qilma.

## 2. Tasdiqlash va Deploy

- Foydalanuvchi localhost da ko'rib **tasdiqlaganidan keyin**:
  1. Branchdagi o'zgarishlarni `main` ga **merge** qil
  2. `main` ni GitHub ga **push** qil
  3. Vercel GitHub bilan ulangan bo'lsa — **avtomatik redeploy** bo'ladi
  4. Ulanmagan bo'lsa — `vercel --prod` bilan qo'lda deploy qil

## 3. Localhost

- Server: `python3 -m http.server 3000` — TBX papkasidan ishga tushiriladi
- URL: `http://localhost:3000/TBX.html`
- Har bir o'zgarishdan keyin brauzerda `Cmd+Shift+R` bilan yangilash

## 4. Umumiy

- Shopify sozlamalari: `tbx-shopify.js` — `SHOPIFY_DOMAIN` va `SHOPIFY_TOKEN`
- Live sayt: https://tbx-site.vercel.app
- GitHub repo: https://github.com/bekhruztbx/TBX
