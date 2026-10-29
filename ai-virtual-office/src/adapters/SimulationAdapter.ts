import { AGENT_IDS, AGENTS } from "../data/agents";
import { placeNode } from "../data/layout";
import { makePlan, tt, USER_STEPS, type PlanItem } from "../sim/planner";
import { reply } from "../sim/dialogue";
import { pathLength, placePath, WALK_SPEED } from "../sim/nav";
import type { ActivityLevel, AgentId, AgentState, Lang, MessageKind, Place, Project, Task, TimelineEvent } from "../types";
import type { AgentAdapter, AgentEventSink } from "./types";

type Worker = Exclude<AgentId, "manager">;
const WORKERS: Worker[] = ["research", "designer", "developer", "qa"];
const SEAT: Record<AgentId, number> = { manager: 0, research: 1, designer: 2, developer: 3, qa: 4 };
const home = (id: AgentId): Place => (id === "manager" ? { kind: "manager-office" } : { kind: "desk", agent: id });

/**
 * DEMO ONLY. A deterministic, tick-based simulation of a manager splitting a brief across four agents.
 * Statuses, walks, chat, errors, bug reports and progress are all derived from one model here, so what the
 * panels say always matches what the avatars do. It never claims to be real Claude activity: the UI labels it.
 */
export class SimulationAdapter implements AgentAdapter {
  readonly kind = "simulation" as const;
  readonly label = "Demo simulation";
  private sink!: AgentEventSink;
  private t = 0; private wall = performance.now(); private speed = 1; private lang: Lang = "uz";
  private timer: ReturnType<typeof setInterval> | null = null;
  private agents = {} as Record<AgentId, AgentState>;
  private tasks: Task[] = []; private items = new Map<string, PlanItem>();
  private project: Project | null = null;
  private q: { at: number; fn: () => void }[] = [];
  private n = 0;
  private pending: Partial<Record<AgentId, Place>> = {};
  private thinkUntil: Partial<Record<AgentId, number>> = {}; private errorUntil: Partial<Record<AgentId, number>> = {};
  private lastError: Partial<Record<AgentId, string>> = {}; private lastStep: Partial<Record<AgentId, string>> = {};
  private stepIdx = new Map<string, number>(); private failed = new Set<string>(); private bugged = new Set<string>(); private bugs: string[] = [];
  private nextWander: Partial<Record<AgentId, number>> = {}; private nextBoard = 0; private nextUpdate = 0; private lastProjPush = 0;

  connect(sink: AgentEventSink, initial: Record<AgentId, AgentState>) {
    this.sink = sink; this.agents = structuredClone(initial);
    AGENT_IDS.forEach((id, i) => (this.nextWander[id] = 6 + i * 3.5));
    this.timer = setInterval(() => { const dt = .1 * this.speed; this.t += dt; this.wall = performance.now(); this.tick(dt); }, 100);
  }
  disconnect() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  now() { return this.t + Math.min(.1, (performance.now() - this.wall) / 1000) * this.speed; }
  setSpeed(x: number) { this.speed = x; }
  setLang(l: Lang) { this.lang = l; }

  // ------------------------------------------------------------------ helpers
  private L(uz: string, en: string) { return this.lang === "uz" ? uz : en; }
  private id(p: string) { return p + (++this.n).toString(36); }
  private at(delay: number, fn: () => void) { this.q.push({ at: this.t + delay, fn }); }
  private say(from: AgentId | "user" | "system", text: string, kind: MessageKind = "chat", to?: AgentId | "all" | "user") { this.sink.message({ id: this.id("m"), t: this.t, from, to, text, kind }); }
  private log(agent: AgentId, text: string, level: ActivityLevel = "info") { this.sink.activity({ id: this.id("a"), t: this.t, agent, text, level }); }
  private tl(label: string, kind: TimelineEvent["kind"], agent?: AgentId) { this.sink.timeline({ id: this.id("e"), t: this.t, label, kind, agent }); }
  private patch(id: AgentId, p: Partial<AgentState>) { Object.assign(this.agents[id], p); this.sink.agent(id, p); }
  private push(task: Task) { this.sink.task({ ...task, dependsOn: [...task.dependsOn], steps: [...task.steps] }); }
  private byId(id: string | null) { return id ? this.tasks.find(x => x.id === id) ?? null : null; }
  private name(id: AgentId) { return AGENTS[id].name; }
  private atHome(id: AgentId) { const a = this.agents[id]; return !a.move && placeNode(a.place) === placeNode(home(id)); }

  private walk(id: AgentId, to: Place): number {
    const a = this.agents[id];
    if (a.move) { this.pending[id] = to; return a.move.startT + a.move.duration; }
    const path = placePath(a.place, to), len = pathLength(path);
    if (len < .05) { this.patch(id, { place: to }); return this.t; }
    const duration = len / WALK_SPEED;
    this.patch(id, { move: { path, startT: this.t, duration, to } });
    return this.t + duration;
  }

  // ------------------------------------------------------------------ the project
  startProject(brief: string) {
    brief = brief.trim(); if (!brief) return;
    this.tasks = []; this.items.clear(); this.q = []; this.bugs = []; this.failed.clear(); this.bugged.clear(); this.stepIdx.clear();
    this.lastError = {}; this.errorUntil = {}; this.thinkUntil = {};
    this.sink.reset();
    for (const id of AGENT_IDS) this.patch(id, { status: "idle", taskId: null, progress: 0, paused: false, action: this.L("Yangi loyihani kutyapti", "Waiting for the new project"), doneCount: 0, busySeconds: 0 });
    this.project = { id: this.id("p"), title: brief, status: "planning", startedAt: this.t, progress: 0 };
    this.sink.project({ ...this.project });
    this.tl(this.L("Vazifa qabul qilindi", "Task received"), "start");
    this.say("user", brief, "chat", "manager");
    this.walk("manager", home("manager"));
    this.patch("manager", { status: "thinking", action: this.L("Vazifani o'qiyapti", "Reading the brief") });
    this.at(.8, () => this.say("manager", this.L(`Vazifani qabul qildim: "${brief}". Uni kichik qismlarga bo'lyapman…`, `Got it: "${brief}". Breaking it into smaller pieces…`), "status", "all"));
    this.log("manager", `Received brief: "${brief}"`);
    this.at(2.2, () => { this.log("manager", "Analysing scope, roles and dependencies"); this.patch("manager", { action: this.L("Bog'liqliklarni tahlil qilyapti", "Mapping dependencies") }); });
    this.at(4, () => this.makeTasks());
  }

  private makeTasks() {
    if (!this.project) return;
    const plan = makePlan(this.project.title), keyToId: Record<string, string> = {};
    for (const it of plan.items) keyToId[it.key] = this.id("t");
    for (const it of plan.items) {
      const task: Task = { id: keyToId[it.key], title: tt(this.lang, it.title), assignee: it.role, status: "queued", progress: 0, dependsOn: it.deps.map(k => keyToId[k]),
        steps: it.steps, duration: it.duration, result: it.result, origin: "plan", createdAt: this.t };
      this.tasks.push(task); this.items.set(task.id, it); this.push(task);
    }
    const n = this.tasks.length;
    this.log("manager", `Plan ready: ${n} tasks across 4 agents (${plan.kind})`, "success");
    this.tl(this.L(`Reja: ${n} ta vazifa`, `Plan: ${n} tasks`), "plan", "manager");
    this.say("manager", this.L(`Reja tayyor: ${n} ta vazifa. Hammani meeting room'ga chaqiraman.`, `Plan ready: ${n} tasks. Calling everyone to the meeting room.`), "status", "all");
    this.project.status = "meeting"; this.sink.project({ ...this.project });
    let ready = this.t;
    for (const id of AGENT_IDS) {
      ready = Math.max(ready, this.walk(id, { kind: "meeting", seat: SEAT[id] }));
      this.patch(id, { status: id === "manager" ? "working" : "thinking", action: this.L("Kickoff uchrashuviga ketyapti", "Heading to the kickoff") });
    }
    this.q.push({ at: ready + .6, fn: () => this.runMeeting() });
  }

  private runMeeting() {
    if (!this.project) return;
    this.tl(this.L("Kickoff uchrashuvi", "Kickoff meeting"), "meeting");
    const lines: [AgentId, string][] = [["manager", this.L(`Hammaga salom! Yangi loyiha: "${this.project.title}". Vazifalarni taqsimlayman.`, `Hi team! New project: "${this.project.title}". Here's who does what.`)]];
    for (const w of WORKERS) {
      const mine = this.tasks.filter(x => x.assignee === w); if (!mine.length) continue;
      lines.push(["manager", this.L(`${this.name(w)}, ${mine.map(x => x.title.toLowerCase()).join(", keyin ")} — sizda.`, `${this.name(w)}, ${mine.map(x => x.title.toLowerCase()).join(", then ")} — that's yours.`)]);
      lines.push([w, this.ack(w, mine[0].title)]);
    }
    lines.push(["manager", this.L("Boshladik! Har biringiz ish joyingizga qayting, men jarayonni kuzatib boraman.", "Let's go! Back to your desks — I'll keep an eye on progress.")]);
    lines.forEach(([who, text], i) => this.at(i * 1.6, () => { this.say(who, text, "meeting", who === "manager" ? "all" : "manager"); this.patch(who, { action: this.L("Uchrashuvda gapiryapti", "Speaking at the kickoff") }); }));
    this.at(lines.length * 1.6 + .4, () => {
      if (!this.project) return;
      this.project.status = "running"; this.sink.project({ ...this.project });
      this.tl(this.L("Ish boshlandi", "Work started"), "task");
      for (const id of AGENT_IDS) { this.walk(id, home(id)); this.patch(id, { status: "idle", action: this.L("Ish joyiga qaytyapti", "Walking back to the desk") }); }
      this.nextUpdate = this.t + 10; this.nextBoard = this.t + 14;
    });
  }
  private ack(w: Worker, title: string) {
    switch (w) {
      case "research": return this.L(`Qabul qildim. "${title}" bilan boshlayman va natijani hammaga yuboraman.`, `On it. Starting with "${title}" and I'll share the findings with everyone.`);
      case "designer": return this.L(`Men "${title}" uchun UI dizayn tayyorlayman.`, `I'll prepare the UI design for "${title}".`);
      case "developer": return this.L(`"${title}" ustida ishlashni boshlayman.`, `I'll start working on "${title}".`);
      case "qa": return this.L("Kod tayyor bo'lgach, test qilaman. Hozircha test rejasini yozaman.", "Once the code is ready I'll test it. Meanwhile I'll write the test plan.");
    }
  }

  // ------------------------------------------------------------------ the clock
  private tick(dt: number) {
    const due = this.q.filter(x => x.at <= this.t); this.q = this.q.filter(x => x.at > this.t); due.forEach(x => x.fn());
    for (const id of AGENT_IDS) {
      const a = this.agents[id];
      if (a.move && this.t >= a.move.startT + a.move.duration) {
        const to = a.move.to; this.patch(id, { place: to, move: null });
        const next = this.pending[id]; if (next) { delete this.pending[id]; this.walk(id, next); }
      }
    }
    const pStatus = this.project?.status;
    const canWork = !this.project || pStatus === "running" || pStatus === "review" || pStatus === "completed";
    for (const id of WORKERS) {
      const a = this.agents[id];
      if (a.paused) continue;
      let task = this.byId(a.taskId);
      if (!task && canWork) { const next = this.nextTask(id); if (next) { this.startTask(id, next); task = next; } }
      if (task) this.work(id, task, dt);
      else if (!a.move && canWork && (pStatus !== "running") && this.t > (this.nextWander[id] ?? 0)) this.wander(id);
    }
    this.manager(dt);
    if (this.project && this.t - this.lastProjPush > .3) this.pushProject();
  }

  private nextTask(id: Worker): Task | null {
    const open = this.tasks.filter(x => x.assignee === id && x.status === "queued" && x.dependsOn.every(d => this.byId(d)?.status === "done"));
    if (!open.length) return null;
    if (open.some(x => x.origin !== "user") && this.project && this.project.status !== "running" && this.project.status !== "review") return open.find(x => x.origin === "user") ?? null;
    return open.sort((a, b) => (a.origin === "fix" ? -1 : 0) - (b.origin === "fix" ? -1 : 0) || a.createdAt - b.createdAt)[0];
  }
  private startTask(id: Worker, task: Task) {
    task.status = "running"; task.startedAt = this.t; this.push(task);
    this.stepIdx.set(task.id, -1); this.thinkUntil[id] = this.t + 1.4;
    if (!this.atHome(id)) this.walk(id, home(id));
    this.patch(id, { taskId: task.id, progress: task.progress, status: "thinking", action: this.L(`Boshlayapti: ${task.title}`, `Starting: ${task.title}`) });
    this.log(id, `Started: ${task.title}`);
    this.say(id, task.origin === "fix" ? this.L(`Xatoni tuzatishni boshladim: ${task.title}.`, `Started on the fix: ${task.title}.`) : this.L(`"${task.title}" ustida ishlashni boshladim.`, `Started working on "${task.title}".`), "status", "all");
    this.tl(`${this.name(id)}: ${task.title}`, "task", id);
  }

  private work(id: Worker, task: Task, dt: number) {
    const a = this.agents[id], it = this.items.get(task.id);
    if (a.move || !this.atHome(id)) return;                              // walking to the desk first
    if (task.status === "blocked") {
      if (task.dependsOn.every(d => this.byId(d)?.status === "done")) {
        task.status = "running"; this.push(task); this.thinkUntil[id] = this.t + 1;
        this.say(id, this.L("Tuzatish keldi, testni davom ettiryapman.", "The fix is in — resuming the tests."), "status", "all"); this.log(id, "Fix verified, resuming tests", "success");
      } else { if (a.status !== "thinking") this.patch(id, { status: "thinking", action: this.L("Tuzatishni kutyapti", "Waiting for the fix") }); return; }
    }
    if (task.status !== "running") return;
    if ((this.errorUntil[id] ?? 0) > this.t) { if (a.status !== "error") this.patch(id, { status: "error" }); return; }
    if (a.status === "error") {
      this.log(id, `Fixed: ${this.lastError[id]}`, "success"); this.say(id, this.L("Xatoni tuzatdim, davom etyapman.", "Fixed it — carrying on."), "status", "all");
      this.patch(id, { status: "working" });
    }
    task.progress = Math.min(1, task.progress + dt / task.duration);
    const step = Math.min(task.steps.length - 1, Math.floor(task.progress * task.steps.length));
    if (step !== this.stepIdx.get(task.id)) {
      this.stepIdx.set(task.id, step); this.lastStep[id] = task.steps[step]; this.log(id, task.steps[step]);
      if (step > 0) this.thinkUntil[id] = this.t + .9;
    }
    const status = this.t < (this.thinkUntil[id] ?? 0) ? "thinking" : "working";
    this.patch(id, { progress: task.progress, status, action: task.steps[step], busySeconds: a.busySeconds + dt });
    this.push(task);
    if (it?.failAt && !this.failed.has(task.id) && task.progress >= it.failAt.at) {
      this.failed.add(task.id); this.errorUntil[id] = this.t + 3.4; this.lastError[id] = it.failAt.log;
      this.log(id, it.failAt.log, "error"); this.say(id, this.L(it.failAt.uz, it.failAt.en), "alert", "all"); this.tl(`${this.name(id)}: error`, "error", id);
      this.patch(id, { status: "error", action: this.L("Xatoni tuzatyapti", "Fixing an error") });
      this.at(1.2, () => this.say("manager", this.L(`Tushunarli, ${this.name(id)}. Tuzatib bo'lgach xabar bering.`, `Understood, ${this.name(id)}. Ping me once it's fixed.`), "chat", id));
    }
    if (it?.bugAt && !this.bugged.has(task.id) && task.progress >= it.bugAt.at) {
      this.bugged.add(task.id); this.bugs.push(it.bugAt.log.replace(/^Bug:\s*/, ""));
      const fix: Task = { id: this.id("t"), title: tt(this.lang, it.bugAt.title), assignee: "developer", status: "queued", progress: 0, dependsOn: [], steps: ["Reproducing the bug", "Patching the code", "Adding a regression test"], duration: 5, result: it.bugAt.result, origin: "fix", createdAt: this.t };
      this.tasks.push(fix); this.push(fix);
      task.status = "blocked"; task.dependsOn.push(fix.id); this.push(task);
      this.log(id, it.bugAt.log, "warn"); this.tl(`${this.name(id)}: bug → ${this.name("developer")}`, "error", id);
      this.say(id, this.L(`${this.name("developer")}, xato topdim: ${it.bugAt.log.replace(/^Bug:\s*/, "")}. Tuzatib bering.`, `${this.name("developer")}, found a bug: ${it.bugAt.log.replace(/^Bug:\s*/, "")}. Please fix it.`), "alert", "developer");
      this.at(1.1, () => this.say("developer", this.L("Ko'rdim, hozir tuzataman.", "Seen it — fixing now."), "chat", "qa"));
      this.patch(id, { status: "thinking", action: this.L("Tuzatishni kutyapti", "Waiting for the fix") });
    }
    if (task.progress >= 1) this.finish(id, task);
  }

  private finish(id: Worker, task: Task) {
    task.status = "done"; task.finishedAt = this.t; task.progress = 1; this.push(task);
    const a = this.agents[id];
    this.log(id, `Done: ${task.title} → ${task.result}`, "success");
    const next = this.tasks.filter(x => x.dependsOn.includes(task.id) && x.assignee !== id && x.status !== "done").map(x => x.assignee);
    const who = [...new Set(next)].map(x => this.name(x));
    this.say(id, who.length ? this.L(`${who.join(", ")}: "${task.title}" tayyor — ${task.result}. Boshlashingiz mumkin.`, `${who.join(", ")}: "${task.title}" is ready — ${task.result}. You can start.`) : this.L(`"${task.title}" tayyor — ${task.result}.`, `"${task.title}" is done — ${task.result}.`), "handoff", who.length ? "all" : "manager");
    this.tl(`${this.name(id)} ✓ ${task.title}`, "done", id);
    const more = this.tasks.some(x => x.assignee === id && x.status !== "done");
    this.patch(id, { taskId: null, progress: 0, doneCount: a.doneCount + 1, status: more ? "idle" : "completed", action: more ? this.L("Keyingi vazifani kutyapti", "Waiting for the next task") : this.L("Vazifalari tayyor", "All tasks done") });
    this.nextWander[id] = this.t + 8;
    if (this.project && this.project.status === "running" && this.tasks.every(x => x.status === "done")) this.review();
  }

  private review() {
    if (!this.project) return;
    this.project.status = "review"; this.pushProject();
    this.walk("manager", { kind: "whiteboard" }); this.patch("manager", { status: "thinking", action: this.L("Yakuniy tekshiruv", "Final review") });
    this.say("manager", this.L("Barcha vazifalar tayyor. Yakuniy tekshiruvni qilyapman…", "All tasks are done. Running the final review…"), "status", "all");
    this.log("manager", "Final review: checking every deliverable");
    this.at(3.4, () => {
      if (!this.project) return;
      this.project.status = "completed"; this.project.finishedAt = this.t; this.project.progress = 1; this.pushProject();
      for (const id of AGENT_IDS) this.patch(id, { status: "completed", action: this.L("Loyiha topshirildi", "Project delivered") });
      this.say("manager", this.L(`Loyiha "${this.project.title}" tayyor! ✅ ${this.tasks.length} ta vazifa bajarildi. Hammaga rahmat!`, `"${this.project.title}" is complete! ✅ ${this.tasks.length} tasks delivered. Great work, team!`), "status", "all");
      this.log("manager", "Project completed", "success"); this.tl(this.L("Loyiha yakunlandi", "Project completed"), "complete");
      this.walk("manager", home("manager"));
      AGENT_IDS.forEach((id, i) => (this.nextWander[id] = this.t + 5 + i * 2));
    });
  }

  private manager(dt: number) {
    const m = this.agents.manager, p = this.project;
    if (!p || p.status !== "running") {
      if (!m.move && !m.paused && (!p || p.status === "completed") && this.t > (this.nextWander.manager ?? 0)) this.wander("manager");
      return;
    }
    const done = this.tasks.filter(x => x.status === "done").length;
    if (!m.paused) this.patch("manager", { status: m.move ? "working" : "working", progress: p.progress, action: this.L(`Jamoani boshqaryapti · ${done}/${this.tasks.length} tayyor`, `Coordinating · ${done}/${this.tasks.length} done`), busySeconds: m.busySeconds + dt });
    if (this.t > this.nextUpdate) {
      this.nextUpdate = this.t + 13;
      const running = this.tasks.filter(x => x.status === "running").map(x => `${this.name(x.assignee)}: ${x.title} ${Math.round(x.progress * 100)}%`);
      this.say("manager", this.L(`Holat: ${done}/${this.tasks.length} vazifa tayyor, umumiy ${Math.round(p.progress * 100)}%.${running.length ? " " + running.join(" · ") : ""}`, `Status: ${done}/${this.tasks.length} tasks done, ${Math.round(p.progress * 100)}% overall.${running.length ? " " + running.join(" · ") : ""}`), "status", "all");
    }
    if (this.t > this.nextBoard && !m.move) {
      this.nextBoard = this.t + 22;
      this.walk("manager", { kind: "whiteboard" }); this.log("manager", "Updating the project board");
      this.at(6, () => { if (this.project?.status === "running") this.walk("manager", home("manager")); });
    }
  }

  private wander(id: AgentId) {
    const a = this.agents[id];
    this.nextWander[id] = this.t + 12 + ((this.n * 7 + id.length * 3) % 10);
    if (a.place.kind === "lounge") this.walk(id, home(id));
    else this.walk(id, { kind: "lounge", spot: (AGENT_IDS.indexOf(id) + this.n) % 3 });
  }

  private pushProject() {
    if (!this.project) return;
    const pt = this.tasks.filter(x => x.origin !== "user");
    const total = pt.reduce((s, x) => s + x.duration, 0);
    if (total && this.project.status !== "completed") this.project.progress = Math.min(.99, pt.reduce((s, x) => s + x.progress * x.duration, 0) / total);
    this.lastProjPush = this.t; this.sink.project({ ...this.project });
  }

  // ------------------------------------------------------------------ user actions
  assignTask(agent: AgentId, title: string) {
    title = title.trim(); if (!title) return;
    if (agent === "manager") { this.startProject(title); return; }
    const task: Task = { id: this.id("t"), title, assignee: agent, status: "queued", progress: 0, dependsOn: [], steps: USER_STEPS[agent], duration: 9, result: this.L(`"${title}" bajarildi`, `"${title}" delivered`), origin: "user", createdAt: this.t };
    this.tasks.push(task); this.push(task);
    this.say("user", title, "chat", agent);
    this.at(.6, () => this.say("manager", this.L(`Qayd etdim: "${title}" — ${this.name(agent)}ga berildi.`, `Noted: "${title}" assigned to ${this.name(agent)}.`), "status", "all"));
    this.at(1.2, () => this.say(agent, this.L("Qabul qildim, navbatimga qo'ydim.", "Got it, it's in my queue."), "chat", "user"));
    this.log(agent, `New task from you: ${title}`); this.tl(this.L(`Siz → ${this.name(agent)}: ${title}`, `You → ${this.name(agent)}: ${title}`), "user", agent);
    if (this.agents[agent].status === "completed") this.patch(agent, { status: "idle" });
  }

  setPaused(agent: AgentId, paused: boolean) {
    const a = this.agents[agent]; if (a.paused === paused) return;
    const task = this.byId(a.taskId);
    this.patch(agent, { paused, status: paused ? "paused" : task ? "working" : "idle", action: paused ? this.L("Pauzada (siz to'xtatdingiz)", "Paused by you") : task ? task.steps[Math.max(0, this.stepIdx.get(task.id) ?? 0)] : this.L("Vazifa kutyapti", "Waiting for a task") });
    this.log(agent, paused ? "Paused by the user" : "Resumed by the user", paused ? "warn" : "info");
    this.say(agent, paused ? this.L("Pauzaga qo'yildim.", "I've been paused.") : this.L("Davom etyapman.", "Resuming work."), "status", "all");
  }

  ask(agent: AgentId, text: string): Promise<string> {
    const a = this.agents[agent];
    const r = reply(text, {
      agent: a, task: this.byId(a.taskId), tasks: this.tasks.filter(x => x.assignee === agent), allAgents: this.agents, allTasks: this.tasks,
      project: this.project, lastError: this.lastError[agent] ?? null, bugs: this.bugs, speed: this.speed, lastStep: this.lastStep[agent] ?? "",
    });
    if (r.assign) this.assignTask(agent, r.assign);
    if (r.pause) this.setPaused(agent, true);
    if (r.resume) this.setPaused(agent, false);
    this.log(agent, "Answered a question from you");
    return new Promise(res => setTimeout(() => res(r.text), 450 + Math.min(1200, r.text.length * 8)));
  }
}

export function initialAgents(lang: Lang): Record<AgentId, AgentState> {
  const out = {} as Record<AgentId, AgentState>;
  for (const id of AGENT_IDS) out[id] = { id, status: "idle", place: home(id), move: null, taskId: null, progress: 0, action: lang === "uz" ? "Vazifa kutyapti" : "Waiting for a task", paused: false, busySeconds: 0, doneCount: 0 };
  return out;
}
