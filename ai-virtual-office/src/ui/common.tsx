import type { ReactNode } from "react";
import { AGENTS, STATUS_COLOR, STATUS_LABEL } from "../data/agents";
import { useOffice } from "../store/useOffice";
import type { AgentId, AgentStatus } from "../types";

export function Panel({ title, right, children, className = "" }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/[.08] bg-ink-900/80 shadow-[0_20px_60px_rgba(0,0,0,.45)] backdrop-blur-xl ${className}`}>
      {title && <header className="flex items-center justify-between px-4 pb-2 pt-3"><h2 className="text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">{title}</h2>{right}</header>}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: AgentStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: c + "22", color: c }}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "working" || status === "thinking" ? "animate-pulse" : ""}`} style={{ background: c }} />{STATUS_LABEL[status]}
    </span>
  );
}

export function AgentDot({ id, size = 28 }: { id: AgentId | "user" | "system"; size?: number }) {
  if (id === "user") return <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900" style={{ width: size, height: size }}>YOU</span>;
  if (id === "system") return <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold" style={{ width: size, height: size }}>SYS</span>;
  const a = AGENTS[id];
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink-950" style={{ width: size, height: size, background: a.color, fontSize: size * .42 }}>{a.name[0]}</span>;
}

export function Progress({ value, color = "#f08a5d", h = 6 }: { value: number; color?: string; h?: number }) {
  return <div className="w-full overflow-hidden rounded-full bg-white/[.07]" style={{ height: h }}><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.round(value * 100)}%`, background: color }} /></div>;
}

/** mm:ss on the adapter clock, from the project start */
export function useClockLabel() {
  const start = useOffice(s => s.project?.startedAt ?? 0);
  return (t: number) => { const s = Math.max(0, Math.floor(t - start)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
}

export const Icon = {
  play: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>,
  pause: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>,
  chat: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>,
  list: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  pulse: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>,
  plus: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>,
  mic: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>,
  speaker: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>,
  x: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  send: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 20.5 21 12 3 3.5l3 8.5-3 8.5zM6 12h7" /></svg>,
  side: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>,
  sideR: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></svg>,
};
