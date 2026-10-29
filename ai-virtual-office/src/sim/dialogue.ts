import { AGENTS, STATUS_LABEL } from "../data/agents";
import type { AgentId, AgentState, Lang, Project, Task } from "../types";

/** Rule-based replies for the demo: they read the agent's real simulated state, so answers match
 *  what you see in the office. A real adapter would send the same context to a model instead. */
export interface DialogueCtx {
  agent: AgentState; task: Task | null; tasks: Task[]; allAgents: Record<AgentId, AgentState>; allTasks: Task[];
  project: Project | null; lastError: string | null; bugs: string[]; speed: number; lastStep: string;
}
export interface Reply { text: string; lang: Lang; assign?: string; pause?: boolean; resume?: boolean }

const UZ_WORDS = ["nima", "qanday", "hozir", "qachon", "qancha", "salom", "assalom", "rahmat", "muammo", "xato", "yordam", "sen ", "men ", "yo'q", "tayyor", "kimsan", "nega", "iltimos", "vazifa", "foiz", "natija", "qilyapsan", "ishlayapsan", "bormi", "qil", "yarat", "jamoa", "reja"];
export function detectLang(text: string): Lang {
  const t = " " + text.toLowerCase() + " ";
  if (/[а-яёўқғҳ]/.test(t)) return "uz";
  return UZ_WORDS.some(w => t.includes(w)) ? "uz" : "en";
}
const any = (t: string, ws: string[]) => ws.some(w => t.includes(w));
const pct = (x: number) => Math.round(x * 100);

export function reply(text: string, c: DialogueCtx): Reply {
  const lang = detectLang(text), t = text.toLowerCase().trim(), U = (uz: string, en: string) => (lang === "uz" ? uz : en);
  const me = AGENTS[c.agent.id], title = c.task ? c.task.title : "";
  const queued = c.tasks.filter(x => x.status === "queued" || x.status === "blocked");
  const doneTasks = c.tasks.filter(x => x.status === "done");
  const remaining = c.task ? Math.max(1, Math.round((1 - c.task.progress) * c.task.duration / Math.max(.25, c.speed))) : 0;

  // giving work: "Developer, login page yarat." / "please create a pricing page"
  const stripped = text.replace(/^\s*[\w']+\s*,\s*/u, "").trim();
  const uzOrder = /(yarat|yoz|qil|tekshir|tuzat|qo'sh|chiz|tayyorla|izla|top|tahlil qil)(gin|ing|ib ?ber(ing)?|ib ?qo'y)?[.!]?\s*$/.test(t) && !/(yapsan|yapti|yapsiz|dingmi|dimi)\b/.test(t);
  const enOrder = /^(please\s+)?(can you\s+|could you\s+)?(create|make|build|write|add|fix|test|design|research|check|prepare|draft|implement)\b/.test(stripped.toLowerCase());
  if ((uzOrder || enOrder) && c.agent.id !== "manager" && stripped.length > 6)
    return { lang, assign: stripped.replace(/[.!?]+$/, ""), text: U(`Qabul qildim: "${stripped.replace(/[.!?]+$/, "")}". Navbatga qo'ydim${c.task ? `, "${title}" tugagach boshlayman` : ", hozir boshlayman"}.`, `Got it: "${stripped.replace(/[.!?]+$/, "")}". It's in my queue${c.task ? ` — I'll start right after "${title}"` : " — starting now"}.`) };
  if (any(t, ["to'xta", "toxta", "pauza", "pause", "stop"])) return { lang, pause: true, text: U("Mayli, ishni pauzaga qo'ydim. Davom ettirish kerak bo'lsa ayting.", "Okay, I've paused my work. Tell me when to resume.") };
  if (any(t, ["davom", "resume", "continue"])) return { lang, resume: true, text: U("Davom ettiryapman.", "Resuming.") };
  if (/^(salom|assalom|hi\b|hello|hey)/.test(t)) return { lang, text: U(`Salom! Men ${me.name}, ${me.title}. ${statusLine("uz")}`, `Hi! I'm ${me.name}, the ${me.title}. ${statusLine("en")}`) };
  if (any(t, ["rahmat", "thank"])) return { lang, text: U("Arzimaydi! Yana savol bo'lsa, shu yerdaman.", "Anytime! I'm right here if you need anything.") };
  if (any(t, ["kimsan", "sen kim", "who are you", "your role", "vazifang nima", "nima ish qilasan"])) return { lang, text: U(`Men ${me.name} — ${me.title}. ${me.bio.uz}`, `I'm ${me.name}, the ${me.title}. ${me.bio.en}`) };
  if (any(t, ["muammo", "xato", "qiyin", "problem", "issue", "bug", "error", "blocker", "stuck"])) return { lang, text: problems() };
  if (any(t, ["natija", "bajarding", "tugatding", "nima qilding", "result", "finished", "what did you", "done so far"])) return { lang, text: results() };
  if (any(t, ["qachon", "qancha", "necha foiz", "foiz", "progress", "how long", "eta", "when will", "how much"])) return { lang, text: eta() };
  if (any(t, ["jamoa", "reja", "boshqalar", "team", "plan", "everyone"])) return { lang, text: team() };
  if (any(t, ["yordam", "nima qila olasan", "help", "what can you"])) return { lang, text: U(`Mendan holatimni, muammolarni, natijalarni so'rashingiz yoki yangi vazifa berishingiz mumkin (masalan: "pricing sahifasini yarat").`, `Ask me about my status, problems or results, or give me a task (for example: "create a pricing page").`) };
  return { lang, text: statusLine(lang) };

  function statusLine(l: Lang): string {
    const V = (uz: string, en: string) => (l === "uz" ? uz : en);
    if (c.agent.id === "manager") return team(l);
    if (c.agent.paused) return V(`Hozir pauzadaman${c.task ? ` ("${title}", ${pct(c.task.progress)}%)` : ""}.`, `I'm paused right now${c.task ? ` ("${title}", ${pct(c.task.progress)}%)` : ""}.`);
    if (c.agent.status === "error") return V(`Hozir xatoni tuzatyapman: ${c.lastError ?? "build xatosi"}. "${title}" — ${pct(c.task?.progress ?? 0)}% tayyor.`, `I'm fixing an error right now: ${c.lastError ?? "a build error"}. "${title}" is ${pct(c.task?.progress ?? 0)}% done.`);
    if (c.task) return V(`Men hozir "${title}" ustida ishlayapman. Taxminan ${pct(c.task.progress)}% tayyor. Hozirgi qadam: ${c.lastStep || c.agent.action}.`, `I'm working on "${title}" right now — about ${pct(c.task.progress)}% done. Current step: ${c.lastStep || c.agent.action}.`);
    if (queued.length) return V(`Navbatimda "${queued[0].title}" bor, ${depsWaiting(queued[0]) ? `uni boshlash uchun ${depsWaiting(queued[0])} kutyapman` : "tez orada boshlayman"}.`, `Next in my queue is "${queued[0].title}" — ${depsWaiting(queued[0]) ? `waiting for ${depsWaiting(queued[0])}` : "starting soon"}.`);
    if (c.agent.status === "completed") return V(`Mening barcha vazifalarim tayyor (${doneTasks.length} ta). Yangi vazifa bersangiz bo'ladi.`, `All my tasks are done (${doneTasks.length}). Happy to take a new one.`);
    return V("Hozir bo'shman. Vazifa bersangiz, darhol boshlayman.", "I'm free right now. Give me a task and I'll start right away.");
  }
  function depsWaiting(task: Task): string {
    const open = task.dependsOn.map(id => c.allTasks.find(x => x.id === id)).filter((x): x is Task => !!x && x.status !== "done");
    return open.map(x => `${AGENTS[x.assignee].name} ("${x.title}")`).join(", ");
  }
  function problems(): string {
    if (c.agent.id === "qa" && c.bugs.length) return U(`Testlarda ${c.bugs.length} ta xato topdim: ${c.bugs.join("; ")}. Jasurga tuzatish uchun berdim.`, `I found ${c.bugs.length} bug(s) in testing: ${c.bugs.join("; ")}. Sent to Jasur to fix.`);
    if (c.agent.status === "error") return U(`Ha, hozir xatolik bor: ${c.lastError}. Uni tuzatyapman, bir necha soniyada davom etaman.`, `Yes — there's an error right now: ${c.lastError}. I'm fixing it and will continue in a few seconds.`);
    if (c.lastError) return U(`Oldinroq xatolik bo'lgan edi (${c.lastError}), uni tuzatdim. Hozir hammasi joyida.`, `Earlier I hit an error (${c.lastError}) and fixed it. All good now.`);
    const w = c.task ? depsWaiting(c.task) : queued[0] ? depsWaiting(queued[0]) : "";
    if (w) return U(`Jiddiy muammo yo'q, faqat ${w} tugashini kutyapman.`, `No real problems — I'm just waiting for ${w}.`);
    return U("Hozircha muammo yo'q, hammasi reja bo'yicha ketyapti.", "No problems so far — everything is on track.");
  }
  function results(): string {
    if (!doneTasks.length) return U(`Hali tugagan vazifam yo'q${c.task ? `, "${title}" ${pct(c.task.progress)}% tayyor` : ""}.`, `Nothing finished yet${c.task ? ` — "${title}" is ${pct(c.task.progress)}% done` : ""}.`);
    return U(`Tayyor: ${doneTasks.map(x => `"${x.title}" → ${x.result}`).join("; ")}.`, `Done: ${doneTasks.map(x => `"${x.title}" → ${x.result}`).join("; ")}.`);
  }
  function eta(): string {
    if (c.agent.id === "manager") return team();
    if (!c.task) return queued.length ? U(`Hozir ishlamayapman, navbatda ${queued.length} ta vazifa bor.`, `Not working right now; ${queued.length} task(s) queued.`) : U("Hozir hech narsa ustida ishlamayapman.", "I'm not working on anything right now.");
    return U(`"${title}" — ${pct(c.task.progress)}% tayyor, taxminan ${remaining} soniya qoldi (demo vaqti).`, `"${title}" is ${pct(c.task.progress)}% done — about ${remaining}s left (demo time).`);
  }
  function team(l: Lang = lang): string {
    const V = (uz: string, en: string) => (l === "uz" ? uz : en);
    if (!c.project) return V("Hozir faol loyiha yo'q. Pastdagi panelga vazifa yozib, Start bosing — men uni jamoaga taqsimlayman.", "There's no active project. Type a task in the panel and press Start — I'll split it across the team.");
    const done = c.allTasks.filter(x => x.status === "done").length, all = c.allTasks.length;
    const lines = (Object.values(c.allAgents) as AgentState[]).filter(a => a.id !== "manager").map(a => {
      const tk = c.allTasks.find(x => x.id === a.taskId);
      return `${AGENTS[a.id].name} — ${tk ? `${tk.title} (${pct(a.progress)}%)` : STATUS_LABEL[a.status].toLowerCase()}`;
    });
    return V(`Loyiha "${c.project.title}": ${done}/${all} vazifa tayyor, umumiy progress ${pct(c.project.progress)}%. ${lines.join("; ")}.`, `Project "${c.project.title}": ${done}/${all} tasks done, overall ${pct(c.project.progress)}%. ${lines.join("; ")}.`);
  }
}
