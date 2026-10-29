import { create } from "zustand";
import { ClaudeCodeAdapter } from "../adapters/ClaudeCodeAdapter";
import { initialAgents, SimulationAdapter } from "../adapters/SimulationAdapter";
import type { AgentAdapter, AgentEventSink } from "../adapters/types";
import type { Activity, AgentId, AgentState, ChatLine, Lang, Message, Project, Task, TimelineEvent } from "../types";

export type Mode = "overview" | "life";
export type CamMode = "third" | "first";
export type PanelTab = "overview" | "tasks" | "activity" | "comms" | "results";
export type Modal = "whiteboard" | "meeting" | "manager" | null;
export type Nearby = { kind: "agent"; id: AgentId } | { kind: "computer" | "whiteboard" | "meeting" | "manager"; id: string; agent?: AgentId } | null;

interface OfficeState {
  adapter: AgentAdapter | null;
  agents: Record<AgentId, AgentState>;
  tasks: Task[];
  messages: Message[];
  activity: Activity[];
  project: Project | null;
  timeline: TimelineEvent[];
  lang: Lang; speed: number;
  // ui
  selected: AgentId | null; tab: PanelTab; mode: Mode; cam: CamMode; modeChangedAt: number;
  chatWith: AgentId | null; chats: Partial<Record<AgentId, ChatLine[]>>; typing: AgentId | null; speaking: AgentId | null; tts: boolean;
  nearby: Nearby; modal: Modal; menuOpen: boolean; leftOpen: boolean; rightOpen: boolean; assignFor: AgentId | null;
  focus: { id: AgentId; n: number } | null;
  // actions
  init(): void;
  startProject(brief: string): void;
  assign(agent: AgentId, title: string): void;
  togglePause(agent: AgentId): void;
  ask(agent: AgentId, text: string): Promise<void>;
  select(agent: AgentId | null, tab?: PanelTab): void;
  setMode(m: Mode): void; setCam(c: CamMode): void; setSpeed(x: number): void; setLang(l: Lang): void;
  openChat(a: AgentId | null): void; setSpeaking(a: AgentId | null): void; setTts(on: boolean): void;
  setNearby(n: Nearby): void; openModal(m: Modal): void; setMenu(open: boolean): void;
  setLeft(open: boolean): void; setRight(open: boolean): void; setAssignFor(a: AgentId | null): void;
}

const cap = <T,>(arr: T[], n: number) => (arr.length > n ? arr.slice(arr.length - n) : arr);
let lineN = 0;

export const useOffice = create<OfficeState>()((set, get) => ({
  adapter: null,
  agents: initialAgents("uz"),
  tasks: [], messages: [], activity: [], project: null, timeline: [],
  lang: "uz", speed: 1,
  selected: null, tab: "overview", mode: "overview", cam: "third", modeChangedAt: 0,
  chatWith: null, chats: {}, typing: null, speaking: null, tts: true,
  nearby: null, modal: null, menuOpen: false,
  leftOpen: typeof window === "undefined" || window.innerWidth >= 1100, rightOpen: typeof window === "undefined" || window.innerWidth >= 1100,
  assignFor: null, focus: null,

  init() {
    if (get().adapter) return;
    const qs = new URLSearchParams(location.search);
    const adapter: AgentAdapter = qs.get("adapter") === "claude" ? new ClaudeCodeAdapter(qs.get("ws") ?? "ws://localhost:8787") : new SimulationAdapter();
    // An adapter emits many events per tick; they are queued and applied in one store update (one React render).
    type Data = Pick<OfficeState, "agents" | "tasks" | "messages" | "activity" | "project" | "timeline">;
    const queue: ((d: Data) => Data)[] = []; let scheduled = false;
    const flush = () => { scheduled = false; const fns = queue.splice(0); set(s => fns.reduce((d, f) => f(d), { agents: s.agents, tasks: s.tasks, messages: s.messages, activity: s.activity, project: s.project, timeline: s.timeline } as Data)); };
    const q = (f: (d: Data) => Data) => { queue.push(f); if (!scheduled) { scheduled = true; queueMicrotask(flush); } };
    const sink: AgentEventSink = {
      agent: (id, patch) => q(d => ({ ...d, agents: { ...d.agents, [id]: { ...d.agents[id], ...patch } } })),
      task: task => q(d => { const i = d.tasks.findIndex(x => x.id === task.id); if (i < 0) return { ...d, tasks: [...d.tasks, task] }; const tasks = d.tasks.slice(); tasks[i] = task; return { ...d, tasks }; }),
      message: m => q(d => ({ ...d, messages: cap([...d.messages, m], 300) })),
      activity: a => q(d => ({ ...d, activity: cap([...d.activity, a], 500) })),
      project: p => q(d => ({ ...d, project: p })),
      timeline: e => q(d => ({ ...d, timeline: cap([...d.timeline, e], 200) })),
      reset: () => q(d => ({ ...d, tasks: [], messages: [], activity: [], timeline: [], project: null })),
    };
    adapter.setLang(get().lang);
    adapter.connect(sink, get().agents);
    set({ adapter });
  },
  startProject(brief) { get().adapter?.startProject(brief); },
  assign(agent, title) { get().adapter?.assignTask(agent, title); },
  togglePause(agent) { const a = get().agents[agent]; get().adapter?.setPaused(agent, !a.paused); },
  async ask(agent, text) {
    const add = (from: ChatLine["from"], t: string) => set(s => ({ chats: { ...s.chats, [agent]: [...(s.chats[agent] ?? []), { id: "c" + ++lineN, from, text: t, t: Date.now() }] } }));
    add("user", text); set({ typing: agent });
    const answer = (await get().adapter?.ask(agent, text)) ?? "";
    set({ typing: null }); add(agent, answer);
  },
  select(agent, tab) { set({ selected: agent, tab: tab ?? get().tab, ...(agent ? { rightOpen: true, focus: { id: agent, n: (get().focus?.n ?? 0) + 1 } } : {}) }); },
  setMode(m) { if (m !== get().mode) set({ mode: m, modeChangedAt: performance.now(), menuOpen: false, nearby: null, ...(m === "life" ? { leftOpen: false } : {}) }); },
  setCam(c) { set({ cam: c }); },
  setSpeed(x) { get().adapter?.setSpeed(x); set({ speed: x }); },
  setLang(l) { get().adapter?.setLang(l); set({ lang: l }); },
  openChat(a) { set({ chatWith: a }); if (a && document.pointerLockElement) document.exitPointerLock(); },
  setSpeaking(a) { set({ speaking: a }); },
  setTts(on) { set({ tts: on }); if (!on) window.speechSynthesis?.cancel(); },
  setNearby(n) { const c = get().nearby; if ((c?.kind ?? null) !== (n?.kind ?? null) || c?.id !== n?.id) set({ nearby: n }); },
  openModal(m) { set({ modal: m }); if (m && document.pointerLockElement) document.exitPointerLock(); },
  setMenu(open) { set({ menuOpen: open }); },
  setLeft(open) { set({ leftOpen: open }); }, setRight(open) { set({ rightOpen: open }); },
  setAssignFor(a) { set({ assignFor: a }); if (a && document.pointerLockElement) document.exitPointerLock(); },
}));

/** the adapter clock, read every frame by the 3D scene (not React state) */
export const simNow = () => useOffice.getState().adapter?.now() ?? 0;
