import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AGENT_IDS, AGENTS, STATUS_COLOR } from "../data/agents";
import { detectLang } from "../sim/dialogue";
import { useOffice } from "../store/useOffice";
import type { AgentId } from "../types";
import { AgentDot, Icon, Progress, StatusPill } from "./common";
import { MessageRow } from "./RightPanel";
import { canListen, canSpeak, listen, speak } from "./voice";

const Backdrop = ({ onClose, children }: { onClose: () => void; children: React.ReactNode }) => (
  <motion.div className="pointer-events-auto fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <motion.div initial={{ y: 30, scale: .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: .97 }} transition={{ type: "spring", damping: 24, stiffness: 300 }} className="w-full">{children}</motion.div>
  </motion.div>
);

/** talk to an agent: text always works; voice when the browser allows it */
function ChatWindow({ id }: { id: AgentId }) {
  const s = useOffice(), lines = s.chats[id] ?? [], a = s.agents[id], p = AGENTS[id];
  const [text, setText] = useState(""), [rec, setRec] = useState(false), [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), stop = useRef<() => void>(() => {});
  const spokenN = useRef(lines.length);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [lines.length, s.typing]);
  useEffect(() => {                                          // read new replies out loud
    if (lines.length > spokenN.current) { const last = lines[lines.length - 1]; if (last.from !== "user" && s.tts) speak(last.text, detectLang(last.text), id, () => s.setSpeaking(id), () => s.setSpeaking(null)); }
    spokenN.current = lines.length;
  }, [lines.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stop.current(); window.speechSynthesis?.cancel(); s.setSpeaking(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const send = (t = text) => { if (!t.trim()) return; s.ask(id, t.trim()); setText(""); };
  const mic = () => {
    if (rec) { stop.current(); return; }
    if (!canListen()) { setNote(s.lang === "uz" ? "Bu brauzerda ovozni tanish yo'q. Matn bilan yozing." : "Voice input isn't available in this browser. Type instead."); return; }
    setNote(null); setRec(true);
    stop.current = listen(s.lang, (t, final) => { setText(t); if (final) { send(t); } }, err => { setRec(false); if (err && err !== "no-speech" && err !== "aborted") setNote(err === "not-allowed" || err === "service-not-allowed" ? (s.lang === "uz" ? "Mikrofonga ruxsat berilmadi. Matn bilan yozing." : "Microphone permission was denied. Type instead.") : `Voice: ${err}`); });
  };
  const suggestions = s.lang === "uz" ? [`${p.title.split(" ")[0]}, hozir nima qilyapsan?`, "Qanday muammolar bor?", "Qachon tayyor bo'ladi?", "Natijalaring qani?"] : ["What are you working on?", "Any problems?", "When will it be done?", "What have you finished?"];
  const speakingNow = s.speaking === id || s.typing === id;
  return (
    <Backdrop onClose={() => s.openChat(null)}>
      <div className="mx-auto flex h-[min(640px,82vh)] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900/95 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/[.06] px-4 py-3">
          <div className="relative"><AgentDot id={id} size={42} />{speakingNow && <span className="absolute -inset-1 animate-ping rounded-full border-2" style={{ borderColor: p.color }} />}</div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-bold">{p.name}</span><StatusPill status={a.status} /></div><div className="truncate text-[11.5px] text-slate-400">{a.action}</div></div>
          {canSpeak() && <button title="Read replies aloud" onClick={() => s.setTts(!s.tts)} className={`rounded-lg p-2 ${s.tts ? "bg-white/15 text-white" : "text-slate-500"}`}>{Icon.speaker}</button>}
          <button onClick={() => s.openChat(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">{Icon.x}</button>
        </div>
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-[11px] text-amber-200">Demo Mode: replies come from the simulation and its current state, not from a live AI model.</div>
        <div ref={box} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {!lines.length && <p className="text-[12.5px] text-slate-400">{s.lang === "uz" ? `${p.name} bilan gaplashing: holati, muammolari yoki yangi vazifa haqida so'rang.` : `Talk to ${p.name}: ask about status, problems, or give a new task.`}</p>}
          {lines.map(l => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${l.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${l.from === "user" ? "rounded-br-sm bg-white text-ink-950" : "rounded-bl-sm bg-ink-700 text-slate-100"}`}>{l.text}</div>
            </motion.div>
          ))}
          {s.typing === id && <div className="flex gap-1 px-2 py-1">{[0, 1, 2].map(i => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * .12}s` }} />)}</div>}
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">{suggestions.map(q => <button key={q} onClick={() => send(q)} className="whitespace-nowrap rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white">{q}</button>)}</div>
        {note && <div className="px-4 pb-1 text-[11px] text-amber-300">{note}</div>}
        <form className="flex items-center gap-2 border-t border-white/[.06] p-3" onSubmit={e => { e.preventDefault(); send(); }}>
          <button type="button" onClick={mic} title="Voice" className={`relative rounded-xl p-2.5 ${rec ? "bg-red-500 text-white" : "bg-white/10 text-slate-200 hover:bg-white/15"}`}>{Icon.mic}{rec && <span className="absolute inset-0 animate-ping rounded-xl bg-red-500/40" />}</button>
          <input ref={input} value={text} onChange={e => setText(e.target.value)} placeholder={rec ? (s.lang === "uz" ? "Tinglayapman…" : "Listening…") : s.lang === "uz" ? "Xabar yozing…" : "Type a message…"} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none" />
          <button type="submit" className="rounded-xl bg-white p-2.5 text-ink-950 hover:bg-slate-200">{Icon.send}</button>
        </form>
      </div>
    </Backdrop>
  );
}

function AssignDialog({ id }: { id: AgentId }) {
  const s = useOffice(), [text, setText] = useState(""), p = AGENTS[id];
  const ideas: Record<AgentId, string[]> = { manager: ["Create a modern e-commerce website.", "Build a booking app"], research: ["Find 5 competitors' prices", "Summarise user reviews"], designer: ["Design a pricing page", "Make a dark mode palette"], developer: ["Create a pricing page", "Add password reset"], qa: ["Test the checkout flow", "Run an accessibility audit"] };
  const go = () => { if (text.trim()) { s.assign(id, text.trim()); s.setAssignFor(null); s.select(id, "tasks"); } };
  return (
    <Backdrop onClose={() => s.setAssignFor(null)}>
      <div className="mx-auto w-full max-w-[460px] rounded-3xl border border-white/10 bg-ink-900/95 p-5 shadow-2xl">
        <div className="flex items-center gap-3"><AgentDot id={id} size={36} /><div><div className="font-bold">Assign a task to {p.name}</div><div className="text-[12px] text-slate-400">{id === "manager" ? "The Manager turns it into a new project for the whole team." : "It joins the agent's queue and shows up in the 3D office."}</div></div></div>
        <input autoFocus value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="Task title" className="mt-4 w-full rounded-xl border border-white/10 bg-ink-950/70 px-3 py-2.5 text-[13px] text-white focus:border-white/30 focus:outline-none" />
        <div className="mt-2 flex flex-wrap gap-1.5">{ideas[id].map(i => <button key={i} onClick={() => setText(i)} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white">{i}</button>)}</div>
        <div className="mt-4 flex justify-end gap-2"><button onClick={() => s.setAssignFor(null)} className="rounded-xl px-4 py-2 text-[13px] text-slate-300 hover:text-white">Cancel</button><button onClick={go} disabled={!text.trim()} className="rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-ink-950 disabled:opacity-40">Assign</button></div>
      </div>
    </Backdrop>
  );
}

function RoomModal({ kind }: { kind: "whiteboard" | "meeting" | "manager" }) {
  const s = useOffice(), project = s.project, tasks = s.tasks;
  const cols: [string, typeof tasks][] = [["To do", tasks.filter(t => t.status === "queued")], ["Doing", tasks.filter(t => t.status === "running" || t.status === "blocked" || t.status === "error")], ["Done", tasks.filter(t => t.status === "done")]];
  const meeting = s.messages.filter(m => m.kind === "meeting");
  return (
    <Backdrop onClose={() => s.openModal(null)}>
      <div className="mx-auto flex max-h-[84vh] w-full max-w-[860px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-3.5">
          <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{kind === "whiteboard" ? "Whiteboard" : kind === "meeting" ? "Meeting room" : "Manager office"}</div><div className="text-[16px] font-bold">{project?.title ?? "No active project"}</div></div>
          <button onClick={() => s.openModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">{Icon.x}</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {kind === "whiteboard" && (<>
            <div className="mb-4 flex items-center gap-3"><Progress value={project?.progress ?? 0} h={8} /><span className="font-mono text-[13px]">{Math.round((project?.progress ?? 0) * 100)}%</span></div>
            <div className="grid gap-3 sm:grid-cols-3">{cols.map(([n, list]) => (
              <div key={n} className="rounded-2xl bg-ink-950/60 p-3"><div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{n} · {list.length}</div>
                <div className="space-y-2">{list.map(t => <div key={t.id} className="rounded-xl p-2.5 text-[12.5px] font-medium text-ink-950" style={{ background: AGENTS[t.assignee].color }}><div>{t.title}</div><div className="mt-1 flex justify-between text-[10.5px] opacity-75"><span>{AGENTS[t.assignee].name}</span><span>{Math.round(t.progress * 100)}%</span></div></div>)}{!list.length && <div className="text-[12px] text-slate-600">—</div>}</div></div>
            ))}</div>
          </>)}
          {kind === "meeting" && (<>
            <p className="mb-3 text-[12.5px] text-slate-400">{project?.status === "meeting" ? "The kickoff is happening right now." : meeting.length ? "Transcript of the kickoff meeting." : "The team meets here after the Manager makes a plan. Start a task to see the kickoff."}</p>
            <div className="divide-y divide-white/[.04]">{meeting.map(m => <MessageRow key={m.id} m={m} />)}</div>
          </>)}
          {kind === "manager" && (<>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{AGENT_IDS.map(id => { const a = s.agents[id]; return (
              <button key={id} onClick={() => { s.openModal(null); s.select(id, "overview"); }} className="rounded-2xl bg-ink-950/60 p-3 text-left hover:bg-ink-800"><div className="flex items-center gap-2"><AgentDot id={id} size={24} /><span className="text-[13px] font-semibold">{AGENTS[id].name}</span></div><div className="mt-2"><StatusPill status={a.status} /></div><div className="mt-1.5 line-clamp-2 text-[11px] text-slate-400">{a.action}</div></button>
            ); })}</div>
            <table className="w-full text-left text-[12.5px]"><thead className="text-[10.5px] uppercase tracking-wider text-slate-500"><tr><th className="py-1.5">Task</th><th>Agent</th><th>Status</th><th className="w-28">Progress</th><th /></tr></thead>
              <tbody>{tasks.map(t => <tr key={t.id} className="border-t border-white/[.05]"><td className="py-2 pr-2">{t.title}</td><td>{AGENTS[t.assignee].name}</td><td className="uppercase" style={{ color: t.status === "done" ? STATUS_COLOR.completed : t.status === "running" ? STATUS_COLOR.working : STATUS_COLOR.idle }}>{t.status}</td><td><Progress value={t.progress} h={4} /></td>
                <td className="text-right"><button onClick={() => s.togglePause(t.assignee)} className="rounded-md px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10">{s.agents[t.assignee].paused ? "Resume" : "Pause"}</button></td></tr>)}</tbody></table>
            {!tasks.length && <p className="text-[12px] text-slate-500">No tasks yet.</p>}
            <div className="mt-4 flex flex-wrap gap-2">{AGENT_IDS.map(id => <button key={id} onClick={() => { s.openModal(null); s.setAssignFor(id); }} className="rounded-xl border border-white/10 px-3 py-1.5 text-[12px] text-slate-300 hover:text-white">+ Task for {AGENTS[id].name}</button>)}</div>
          </>)}
        </div>
      </div>
    </Backdrop>
  );
}

export function Overlays() {
  const chatWith = useOffice(s => s.chatWith), assignFor = useOffice(s => s.assignFor), modal = useOffice(s => s.modal);
  return (
    <AnimatePresence>
      {chatWith && <ChatWindow key={"chat" + chatWith} id={chatWith} />}
      {assignFor && <AssignDialog key={"as" + assignFor} id={assignFor} />}
      {modal && <RoomModal key={"m" + modal} kind={modal} />}
    </AnimatePresence>
  );
}
