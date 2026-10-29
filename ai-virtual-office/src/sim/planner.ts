import type { AgentId, Lang } from "../types";

/** One work package the Manager hands out. `key` is local to a plan; deps refer to other keys. */
export interface PlanItem {
  key: string;
  role: Exclude<AgentId, "manager">;
  title: { uz: string; en: string };
  duration: number;                 // sim seconds
  steps: string[];                  // activity log lines, one per step
  result: string;
  deps: string[];
  failAt?: { at: number; log: string; uz: string; en: string };         // the agent hits an error and fixes it
  bugAt?: { at: number; title: { uz: string; en: string }; log: string; result: string };   // QA finds a bug -> a fix task for the Developer
}

type Plan = { kind: string; items: PlanItem[] };
const has = (s: string, ws: string[]) => ws.some(w => s.includes(w));

export function makePlan(brief: string): Plan {
  const b = brief.toLowerCase();
  if (has(b, ["e-commerce", "ecommerce", "shop", "store", "magazin", "do'kon", "dokon", "market"])) return { kind: "ecommerce", items: ECOMMERCE };
  if (has(b, ["login", "auth", "sign in", "sign-in", "signup", "kirish", "ro'yxat", "royxat"])) return { kind: "login", items: LOGIN };
  if (has(b, ["dashboard", "admin", "analytics", "panel", "crm", "app", "ilova"])) return { kind: "dashboard", items: DASHBOARD };
  if (has(b, ["landing", "website", "site", "sayt", "portfolio", "page", "sahifa"])) return { kind: "landing", items: LANDING };
  return { kind: "generic", items: GENERIC };
}
export const tt = (lang: Lang, t: { uz: string; en: string }) => t[lang];

const ECOMMERCE: PlanItem[] = [
  { key: "R1", role: "research", title: { uz: "Bozor va raqobatchilar tahlili", en: "Market & competitor research" }, duration: 10,
    steps: ["Scanning 6 competitor stores", "Comparing checkout flows", "Collecting must-have features", "Writing requirements.md"], result: "requirements.md — 14 features, 3 user personas", deps: [] },
  { key: "Q1", role: "qa", title: { uz: "Test rejasi", en: "Test plan" }, duration: 7, steps: ["Listing critical user flows", "Writing test cases"], result: "test-plan.md — 26 test cases", deps: ["R1"] },
  { key: "D1", role: "designer", title: { uz: "Wireframe: bosh sahifa, mahsulot, savatcha", en: "Wireframes: home, product, cart" }, duration: 11,
    steps: ["Sketching the home page layout", "Product page wireframe", "Cart & checkout wireframe", "Review with the Manager"], result: "6 wireframes in /design/wireframes", deps: ["R1"] },
  { key: "D2", role: "designer", title: { uz: "UI kit va vizual uslub", en: "UI kit & visual style" }, duration: 9,
    steps: ["Picking the color palette", "Type scale & spacing", "Buttons, inputs, cards", "Exporting design tokens"], result: "UI kit — 42 components, tokens.json", deps: ["D1"] },
  { key: "V1", role: "developer", title: { uz: "Loyiha va mahsulot katalogi", en: "Project setup & product catalog" }, duration: 12,
    steps: ["Scaffolding React + TypeScript", "Product data model", "Catalog grid with filters", "Product detail page"], result: "/src/pages — Home, Catalog, Product", deps: ["D1"] },
  { key: "V2", role: "developer", title: { uz: "Savatcha, to'lov va login", en: "Cart, checkout & login" }, duration: 14,
    steps: ["Cart state & totals", "Checkout form & validation", "Login & sign-up pages", "Auth session handling"], result: "Cart, Checkout, Login, Sign-up — working", deps: ["V1", "D2"],
    failAt: { at: .62, log: "Build failed: auth token refresh breaks on page reload", uz: "Authentication qismida xatolik chiqdi (token yangilanmayapti). Tuzatyapman.", en: "Hit an error in authentication: the token doesn't refresh on reload. Fixing it." } },
  { key: "Q2", role: "qa", title: { uz: "Funksional va checkout testlari", en: "Functional & checkout tests" }, duration: 10,
    steps: ["Running catalog tests", "Testing cart totals", "End-to-end checkout", "Accessibility & Lighthouse"], result: "26/26 tests passed · Lighthouse 96", deps: ["V2"],
    bugAt: { at: .45, title: { uz: "Tuzatish: savatcha summasi yaxlitlanishi", en: "Fix: cart total rounding" }, log: "Bug: cart total shows 19.989 instead of 19.99", result: "Rounding fixed, regression test added" } },
];
const LOGIN: PlanItem[] = [
  { key: "R1", role: "research", title: { uz: "Autentifikatsiya talablari", en: "Auth requirements & best practices" }, duration: 8,
    steps: ["Reviewing OAuth & password rules", "Checking rate limiting needs", "Writing auth-requirements.md"], result: "auth-requirements.md — 9 rules", deps: [] },
  { key: "D1", role: "designer", title: { uz: "Login sahifa UI dizayni", en: "Login page UI design" }, duration: 9,
    steps: ["Layout & form fields", "Error and loading states", "Dark & light variants"], result: "Login UI — 4 states, 2 themes", deps: ["R1"] },
  { key: "V1", role: "developer", title: { uz: "Login sahifa va auth API", en: "Login page & auth API" }, duration: 13,
    steps: ["Login form component", "Validation rules", "POST /api/login endpoint", "Session & remember me"], result: "Login page + /api/login + sessions", deps: ["D1"],
    failAt: { at: .6, log: "Error: session cookie not set on Safari", uz: "Authentication qismida xatolik bor: Safari'da cookie saqlanmayapti. Hozir tuzatyapman.", en: "Found an error in authentication: the session cookie isn't saved on Safari. Fixing it now." } },
  { key: "Q1", role: "qa", title: { uz: "Login testlari", en: "Login tests" }, duration: 9,
    steps: ["Happy path tests", "Wrong password & lockout", "Accessibility check"], result: "14/14 tests passed", deps: ["V1"],
    bugAt: { at: .5, title: { uz: "Tuzatish: noto'g'ri parolda xabar chiqmayapti", en: "Fix: no message on wrong password" }, log: "Bug: wrong password shows no error message", result: "Error message added" } },
];
const DASHBOARD: PlanItem[] = [
  { key: "R1", role: "research", title: { uz: "Foydalanuvchilar va metrikalar tahlili", en: "Users & key metrics research" }, duration: 9,
    steps: ["Interviewing 3 personas (simulated)", "Choosing 8 key metrics", "Writing the spec"], result: "spec.md — 8 metrics, 5 screens", deps: [] },
  { key: "D1", role: "designer", title: { uz: "Dashboard ekranlari dizayni", en: "Dashboard screens design" }, duration: 11,
    steps: ["Information architecture", "Chart styles", "Overview screen", "Detail screens"], result: "5 screens + chart kit", deps: ["R1"] },
  { key: "V1", role: "developer", title: { uz: "API va ma'lumotlar qatlami", en: "API & data layer" }, duration: 10,
    steps: ["Data models", "REST endpoints", "Caching"], result: "/api — 12 endpoints", deps: ["R1"] },
  { key: "V2", role: "developer", title: { uz: "Grafiklar va ekranlar", en: "Charts & screens" }, duration: 13,
    steps: ["Layout & navigation", "Chart components", "Filters & date ranges", "Responsive pass"], result: "Dashboard UI — 5 screens", deps: ["V1", "D1"],
    failAt: { at: .55, log: "Error: chart crashes on empty data", uz: "Grafikda xatolik: bo'sh ma'lumotda yiqilyapti. Tuzatyapman.", en: "Chart crashes on empty data. Fixing it." } },
  { key: "Q1", role: "qa", title: { uz: "Ekranlar va API testlari", en: "Screens & API tests" }, duration: 9,
    steps: ["API contract tests", "Visual regression", "Performance check"], result: "31/31 tests passed", deps: ["V2"],
    bugAt: { at: .5, title: { uz: "Tuzatish: sana filtri vaqt zonasini hisoblamayapti", en: "Fix: date filter ignores time zone" }, log: "Bug: date filter ignores the user's time zone", result: "Time zone handled" } },
];
const LANDING: PlanItem[] = [
  { key: "R1", role: "research", title: { uz: "Auditoriya va raqobatchilar", en: "Audience & competitor scan" }, duration: 8,
    steps: ["Scanning 5 competitor sites", "Picking the main message", "Writing the content brief"], result: "content-brief.md", deps: [] },
  { key: "D1", role: "designer", title: { uz: "Landing sahifa dizayni", en: "Landing page design" }, duration: 10,
    steps: ["Hero section", "Features & social proof", "Mobile layout"], result: "Landing design — desktop + mobile", deps: ["R1"] },
  { key: "V1", role: "developer", title: { uz: "Sahifani kodlash", en: "Build the page" }, duration: 11,
    steps: ["Sections & components", "Animations", "Contact form", "SEO meta"], result: "Landing page — 7 sections", deps: ["D1"],
    failAt: { at: .6, log: "Error: contact form returns 500", uz: "Kontakt formasida xatolik (500). Tuzatyapman.", en: "Contact form returns 500. Fixing it." } },
  { key: "Q1", role: "qa", title: { uz: "Brauzer va tezlik testlari", en: "Browser & speed tests" }, duration: 8,
    steps: ["Chrome, Safari, Firefox", "Lighthouse run", "Form test"], result: "All browsers OK · Lighthouse 98", deps: ["V1"],
    bugAt: { at: .5, title: { uz: "Tuzatish: mobil menyu yopilmayapti", en: "Fix: mobile menu won't close" }, log: "Bug: mobile menu doesn't close after a tap", result: "Menu closes on tap" } },
];
const GENERIC: PlanItem[] = [
  { key: "R1", role: "research", title: { uz: "Talablarni yig'ish", en: "Gather requirements" }, duration: 8,
    steps: ["Reading the brief", "Researching similar products", "Writing requirements"], result: "requirements.md", deps: [] },
  { key: "D1", role: "designer", title: { uz: "Interfeys dizayni", en: "Interface design" }, duration: 10,
    steps: ["User flow", "Wireframes", "Visual design"], result: "Designs for 4 screens", deps: ["R1"] },
  { key: "V1", role: "developer", title: { uz: "Asosiy funksiyalarni yozish", en: "Build the core features" }, duration: 12,
    steps: ["Project setup", "Core logic", "UI components", "Wiring it together"], result: "Working first version", deps: ["D1"],
    failAt: { at: .6, log: "Error: build fails on a missing type", uz: "Build'da xatolik: tip topilmadi. Tuzatyapman.", en: "Build fails on a missing type. Fixing it." } },
  { key: "Q1", role: "qa", title: { uz: "Test va tekshiruv", en: "Test & review" }, duration: 8,
    steps: ["Unit tests", "Manual walkthrough", "Final report"], result: "All checks passed", deps: ["V1"],
    bugAt: { at: .5, title: { uz: "Tuzatish: kiritish validatsiyasi", en: "Fix: input validation" }, log: "Bug: empty input is accepted", result: "Validation added" } },
];

/** generic steps for a task the user assigns by hand */
export const USER_STEPS: Record<Exclude<AgentId, "manager">, string[]> = {
  research: ["Searching sources", "Comparing findings", "Writing a summary"],
  designer: ["Sketching options", "Refining the chosen one", "Exporting assets"],
  developer: ["Reading the code", "Implementing", "Running the build"],
  qa: ["Preparing test cases", "Running tests", "Writing the report"],
};
