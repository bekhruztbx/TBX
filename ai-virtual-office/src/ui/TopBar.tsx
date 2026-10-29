import { useOffice } from "../store/useOffice";
import { useShallow } from "zustand/react/shallow";
import { Icon } from "./common";

function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-ink-850/80 p-0.5">
      {options.map(([v, l]) => (
        <button key={String(v)} onClick={() => onChange(v)} className={`rounded-[10px] px-2.5 py-1 text-[12px] font-semibold transition ${v === value ? "bg-white text-ink-950 shadow" : "text-slate-300 hover:text-white"}`}>{l}</button>
      ))}
    </div>
  );
}

export function TopBar() {
  const s = useOffice(useShallow(st => ({ adapter: st.adapter, mode: st.mode, cam: st.cam, speed: st.speed, lang: st.lang, leftOpen: st.leftOpen, rightOpen: st.rightOpen, setMode: st.setMode, setCam: st.setCam, setSpeed: st.setSpeed, setLang: st.setLang, setLeft: st.setLeft, setRight: st.setRight })));
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-white/[.08] bg-ink-900/80 px-3 py-2 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-2 pr-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#f08a5d] to-[#e0577a] text-[13px] font-black text-ink-950">AI</span>
        <div className="leading-tight"><div className="text-[14px] font-bold">AI Virtual Office</div><div className="text-[10px] text-slate-400">{s.adapter?.label ?? "…"}</div></div>
      </div>
      {s.adapter?.kind === "simulation" && (
        <span title="Agents here are simulated. Nothing on screen is real Claude activity." className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />Demo Mode · simulated agents
        </span>
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Seg value={s.mode} options={[["overview", "Overview"], ["life", "Virtual Life"]]} onChange={m => s.setMode(m)} />
        {s.mode === "life" && <Seg value={s.cam} options={[["third", "3rd person"], ["first", "1st person"]]} onChange={c => s.setCam(c)} />}
        <Seg value={s.speed} options={[[1, "1×"], [2, "2×"], [4, "4×"]]} onChange={x => s.setSpeed(x)} />
        <Seg value={s.lang} options={[["uz", "UZ"], ["en", "EN"]]} onChange={l => s.setLang(l)} />
        <button title="Left panel" onClick={() => s.setLeft(!s.leftOpen)} className={`rounded-lg p-2 ${s.leftOpen ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}>{Icon.side}</button>
        <button title="Right panel" onClick={() => s.setRight(!s.rightOpen)} className={`rounded-lg p-2 ${s.rightOpen ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}>{Icon.sideR}</button>
      </div>
    </div>
  );
}
