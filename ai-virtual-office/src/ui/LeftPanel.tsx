import { motion } from "framer-motion";
import { useState } from "react";
import { AGENT_IDS, AGENTS, STATUS_COLOR } from "../data/agents";
import { useOffice } from "../store/useOffice";
import { AgentDot, Icon, Panel, Progress, StatusPill, useClockLabel } from "./common";

const EXAMPLES = ["Create a modern e-commerce website.", "Login sahifasini yarat", "Build an analytics dashboard", "Make a landing page for a coffee shop"];

function TaskInput() {
  const [text, setText] = useState(""), project = useOffice(s => s.project), start = useOffice(s => s.startProject), lang = useOffice(s => s.lang);
  const busy = !!project && project.status !== "completed";
  const go = () => { if (text.trim()) { start(text); setText(""); } };
  return (
    <Panel title={lang === "uz" ? "Yangi vazifa" : "New task"} right={busy ? <span className="text-[11px] text-amber-300">{lang === "uz" ? "Loyiha davom etmoqda" : "Project running"}</span> : undefined}>
      <div className="px-4 pb-4">
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); } }} rows={2}
          placeholder={lang === "uz" ? "Masalan: Create a modern e-commerce website." : "e.g. Create a modern e-commerce website."}
          className="w-full resize-none rounded-xl border border-white/10 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white placeholder:text-slate-500 focus:border-[#f08a5d]/70 focus:outline-none" />
        <div className="mt-2 flex flex-wrap gap-1.5">{EXAMPLES.map(e => <button key={e} onClick={() => setText(e)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:border-white/30 hover:text-white">{e}</button>)}</div>
        <button onClick={go} disabled={!text.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f08a5d] to-[#e8607e] py-2.5 text-[13px] font-bold text-ink-950 shadow-lg transition enabled:hover:brightness-110 disabled:opacity-40">
          {Icon.play}{busy ? (lang === "uz" ? "Qaytadan boshlash" : "Restart with this task") : "Start"}
        </button>
      </div>
    </Panel>
  );
}

function Stats() {
  const agents = useOffice(s => s.agents), tasks = useOffice(s => s.tasks), project = useOffice(s => s.project);
  const active = Object.values(agents).filter(a => a.status === "working" || a.status === "thinking" || a.status === "error").length;
  const running = tasks.filter(t => t.status === "running" || t.status === "blocked").length, done = tasks.filter(t => t.status === "done").length;
  const cards: [string, string | number, string][] = [["Active Agents", `${active}/5`, "#4ade80"], ["Running Tasks", running, "#facc15"], ["Completed Tasks", `${done}/${tasks.length}`, "#38bdf8"], ["Project Progress", `${Math.round((project?.progress ?? 0) * 100)}%`, "#f08a5d"]];
  return (
    <Panel title="Dashboard" right={project && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-200">{project.status}</span>}>
      <div className="grid grid-cols-2 gap-2 px-4">
        {cards.map(([l, v, c]) => (
          <div key={l} className="rounded-xl border border-white/[.06] bg-ink-950/50 px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{l}</div>
            <div className="mt-0.5 font-mono text-[22px] font-semibold tabular-nums" style={{ color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className="mb-1 flex justify-between text-[11px] text-slate-400"><span className="truncate pr-2">{project?.title ?? "No project yet"}</span><span className="font-mono">{Math.round((project?.progress ?? 0) * 100)}%</span></div>
        <Progress value={project?.progress ?? 0} />
      </div>
    </Panel>
  );
}

function AgentsList() {
  const agents = useOffice(s => s.agents), select = useOffice(s => s.select), selected = useOffice(s => s.selected);
  const maxBusy = Math.max(1, ...Object.values(agents).map(a => a.busySeconds));
  return (
    <Panel title="Agents · activity">
      <div className="space-y-1 px-2 pb-3">
        {AGENT_IDS.map(id => { const a = agents[id], p = AGENTS[id]; return (
          <button key={id} onClick={() => select(id, "overview")} className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition ${selected === id ? "bg-white/10" : "hover:bg-white/5"}`}>
            <AgentDot id={id} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate text-[13px] font-semibold">{p.name} <span className="font-normal text-slate-500">· {p.title.replace(" Agent", "")}</span></span><StatusPill status={a.status} /></div>
              <div className="mt-1 flex items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded bg-white/[.06]"><div className="h-1 rounded bg-white/40" style={{ width: `${(a.busySeconds / maxBusy) * 100}%`, background: p.color }} /></div><span className="w-14 truncate text-right text-[10px] text-slate-500">{a.doneCount} done</span></div>
            </div>
          </button>
        ); })}
      </div>
    </Panel>
  );
}

function Timeline() {
  const tl = useOffice(s => s.timeline), label = useClockLabel();
  return (
    <Panel title="Task timeline" className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
        {!tl.length && <p className="py-2 text-[12px] text-slate-500">Events appear here once a task starts.</p>}
        <ol className="relative ml-1 border-l border-white/10">
          {tl.slice().reverse().map(e => (
            <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mb-2 ml-3">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900" style={{ background: e.agent ? AGENTS[e.agent].color : e.kind === "complete" ? STATUS_COLOR.completed : e.kind === "error" ? STATUS_COLOR.error : "#f08a5d" }} />
              <div className="flex gap-2 text-[12px]"><span className="font-mono text-slate-500">{label(e.t)}</span><span className={e.kind === "error" ? "text-red-300" : e.kind === "complete" ? "text-sky-300" : "text-slate-200"}>{e.label}</span></div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

export function LeftPanel() {
  return (
    <div className="pointer-events-auto flex h-full w-[340px] max-w-[calc(100vw-24px)] flex-col gap-3 overflow-y-auto pb-1">
      <TaskInput /><Stats /><AgentsList /><Timeline />
    </div>
  );
}
