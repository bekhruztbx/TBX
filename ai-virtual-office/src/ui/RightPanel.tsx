import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AGENTS, STATUS_COLOR } from "../data/agents";
import { useOffice, type PanelTab } from "../store/useOffice";
import type { AgentId, Message, Task } from "../types";
import { AgentDot, Icon, Panel, Progress, StatusPill, useClockLabel } from "./common";

const KIND: Record<Message["kind"], [string, string]> = { meeting: ["Meeting", "#c084fc"], alert: ["Alert", "#f87171"], handoff: ["Handoff", "#38bdf8"], status: ["Status", "#94a3b8"], chat: ["", ""], system: ["System", "#94a3b8"] };
const who = (id: Message["from"] | Message["to"]) => (!id ? "" : id === "user" ? "You" : id === "system" ? "System" : id === "all" ? "Team" : AGENTS[id].name);

export function MessageRow({ m }: { m: Message }) {
  const label = useClockLabel(), [k, c] = KIND[m.kind];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }} className="flex gap-2.5 py-1.5">
      <AgentDot id={m.from} size={26} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-white">{who(m.from)}</span>{m.to && <span className="text-slate-500">→ {who(m.to)}</span>}
          {k && <span className="rounded px-1 text-[9px] font-bold uppercase" style={{ color: c, background: c + "1f" }}>{k}</span>}
          <span className="ml-auto font-mono text-[10px] text-slate-600">{label(m.t)}</span>
        </div>
        <p className={`mt-0.5 text-[12.5px] leading-snug ${m.kind === "alert" ? "text-red-200" : "text-slate-200"}`}>{m.text}</p>
      </div>
    </motion.div>
  );
}

function Comms({ grow }: { grow: boolean }) {
  const msgs = useOffice(s => s.messages), [f, setF] = useState<"all" | "meeting" | "alert">("all"), box = useRef<HTMLDivElement>(null);
  const list = msgs.filter(m => f === "all" || m.kind === f || (f === "alert" && m.kind === "handoff"));
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [list.length]);
  return (
    <Panel title="Agent communication" className={`flex min-h-0 flex-col ${grow ? "flex-1" : "h-[38%] min-h-[220px]"}`}
      right={<div className="flex gap-1">{(["all", "meeting", "alert"] as const).map(x => <button key={x} onClick={() => setF(x)} className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${f === x ? "bg-white/15 text-white" : "text-slate-500 hover:text-slate-200"}`}>{x === "all" ? "All" : x === "meeting" ? "Meeting" : "Alerts"}</button>)}</div>}>
      <div ref={box} className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {!list.length && <p className="py-2 text-[12px] text-slate-500">Conversations between agents show up here in real time.</p>}
        {list.map(m => <MessageRow key={m.id} m={m} />)}
      </div>
    </Panel>
  );
}

function TaskRow({ t }: { t: Task }) {
  const tasks = useOffice(s => s.tasks);
  const deps = t.dependsOn.map(d => tasks.find(x => x.id === d)).filter((x): x is Task => !!x && x.status !== "done");
  const col = t.status === "done" ? STATUS_COLOR.completed : t.status === "running" ? STATUS_COLOR.working : t.status === "blocked" ? STATUS_COLOR.thinking : STATUS_COLOR.idle;
  return (
    <div className="rounded-xl border border-white/[.06] bg-ink-950/50 p-2.5">
      <div className="flex items-start justify-between gap-2"><span className="text-[12.5px] font-medium text-slate-100">{t.title}</span><span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ color: col, background: col + "1f" }}>{t.status}</span></div>
      <div className="mt-2"><Progress value={t.progress} color={col} h={4} /></div>
      <div className="mt-1 flex justify-between text-[10.5px] text-slate-500">
        <span>{t.origin === "user" ? "from you" : t.origin === "fix" ? "bug fix" : "planned"}{deps.length ? ` · waits for ${deps.map(d => AGENTS[d.assignee].name).join(", ")}` : ""}</span><span className="font-mono">{Math.round(t.progress * 100)}%</span>
      </div>
    </div>
  );
}

function AgentPanel({ id }: { id: AgentId }) {
  const s = useOffice(), a = s.agents[id], p = AGENTS[id], label = useClockLabel();
  const tasks = s.tasks.filter(t => t.assignee === id), cur = tasks.find(t => t.id === a.taskId);
  const acts = s.activity.filter(x => x.agent === id), msgs = s.messages.filter(m => m.from === id || m.to === id);
  const tabs: [PanelTab, string][] = [["overview", "Overview"], ["tasks", `Tasks ${tasks.length}`], ["activity", "Activity"], ["comms", "Comms"], ["results", "Results"]];
  const lvl = { info: "text-slate-300", success: "text-emerald-300", warn: "text-amber-300", error: "text-red-300" };
  const act = (icon: JSX.Element, text: string, on: () => void, hot = false) => <button onClick={on} className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[12px] font-semibold transition ${hot ? "border-transparent bg-white text-ink-950 hover:bg-slate-200" : "border-white/10 text-slate-200 hover:border-white/30 hover:text-white"}`}>{icon}{text}</button>;
  return (
    <Panel className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 px-4 pt-4">
        <AgentDot id={id} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="text-[16px] font-bold">{p.name}</h3><StatusPill status={a.status} /></div>
          <div className="text-[12px] text-slate-400">{p.title}</div>
        </div>
        <button onClick={() => s.select(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">{Icon.x}</button>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto px-3">{tabs.map(([k, l]) => <button key={k} onClick={() => s.select(id, k)} className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ${s.tab === k ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        {s.tab === "overview" && (
          <div className="space-y-3">
            <p className="text-[12.5px] text-slate-400">{p.bio[s.lang]}</p>
            <div className="rounded-xl border border-white/[.06] bg-ink-950/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current task</div>
              <div className="mt-1 text-[13.5px] font-semibold">{cur?.title ?? (id === "manager" && s.project ? s.project.title : "—")}</div>
              <div className="mt-1 text-[12px] text-slate-400">{a.action}</div>
              <div className="mt-2 flex items-center gap-2"><Progress value={id === "manager" ? s.project?.progress ?? 0 : a.progress} color={STATUS_COLOR[a.status]} /><span className="w-10 text-right font-mono text-[12px]">{Math.round((id === "manager" ? s.project?.progress ?? 0 : a.progress) * 100)}%</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {act(Icon.chat, "Talk", () => s.openChat(id), true)}
              {act(Icon.plus, "Assign Task", () => s.setAssignFor(id))}
              {act(Icon.list, "View Tasks", () => s.select(id, "tasks"))}
              {act(Icon.pulse, "View Activity", () => s.select(id, "activity"))}
              <div className="col-span-2">{act(a.paused ? Icon.play : Icon.pause, a.paused ? "Resume" : "Pause", () => s.togglePause(id))}</div>
            </div>
          </div>
        )}
        {s.tab === "tasks" && <div className="space-y-2">{tasks.length ? tasks.map(t => <TaskRow key={t.id} t={t} />) : <p className="text-[12px] text-slate-500">{id === "manager" ? "The Manager plans and coordinates; give it a task to start a project." : "No tasks yet."}</p>}<button onClick={() => s.setAssignFor(id)} className="w-full rounded-xl border border-dashed border-white/15 py-2 text-[12px] text-slate-400 hover:text-white">+ Assign task</button></div>}
        {s.tab === "activity" && <ul className="space-y-1.5 font-mono text-[11.5px]">{acts.length ? acts.slice().reverse().map(x => <li key={x.id} className="flex gap-2"><span className="text-slate-600">{label(x.t)}</span><span className={lvl[x.level]}>{x.text}</span></li>) : <li className="text-slate-500">No activity yet.</li>}</ul>}
        {s.tab === "comms" && <div>{msgs.length ? msgs.map(m => <MessageRow key={m.id} m={m} />) : <p className="text-[12px] text-slate-500">No messages yet.</p>}</div>}
        {s.tab === "results" && <div className="space-y-2">{tasks.filter(t => t.status === "done").length ? tasks.filter(t => t.status === "done").map(t => <div key={t.id} className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-2.5"><div className="text-[12.5px] font-semibold">{t.title}</div><div className="mt-0.5 font-mono text-[11.5px] text-sky-200">{t.result}</div></div>) : <p className="text-[12px] text-slate-500">Finished work and its results land here.</p>}</div>}
      </div>
    </Panel>
  );
}

export function RightPanel() {
  const selected = useOffice(s => s.selected);
  return (
    <div className="pointer-events-auto flex h-full w-[360px] max-w-[calc(100vw-24px)] flex-col gap-3">
      <AnimatePresence mode="wait">{selected && <motion.div key={selected} className="flex min-h-0 shrink-0 flex-col" style={{ maxHeight: "66%" }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}><AgentPanel id={selected} /></motion.div>}</AnimatePresence>
      <Comms grow={!selected} />
    </div>
  );
}
