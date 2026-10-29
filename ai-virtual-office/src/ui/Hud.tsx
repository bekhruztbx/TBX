import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { useRef } from "react";
import { AGENTS } from "../data/agents";
import { useOffice } from "../store/useOffice";
import { touch } from "../three/touch";

const LABEL: Record<string, string> = { computer: "use the computer", whiteboard: "look at the whiteboard", meeting: "enter the meeting room view", manager: "open the manager office" };

/** the ESC menu's dimmed layer; it lets clicks through as soon as it starts fading out */
function MenuLayer({ children }: { children: React.ReactNode }) {
  const present = useIsPresent();
  return <motion.div className={`${present ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-sm`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{children}</motion.div>;
}

/** Virtual Life overlay: the "Press E" prompt, crosshair, controls, ESC menu and touch controls */
export function Hud() {
  const s = useOffice(), n = s.nearby, isTouch = typeof window !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (s.mode !== "life") return null;
  const busy = !!(s.chatWith || s.modal || s.assignFor);
  return (
    <>
      {s.cam === "first" && !busy && <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow" />}
      <AnimatePresence>
        {n && !busy && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pointer-events-none fixed bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/15 bg-ink-900/85 px-4 py-2.5 text-[14px] shadow-xl backdrop-blur-xl">
            <kbd className="mr-2 rounded-md border border-white/30 bg-white/10 px-2 py-0.5 font-mono text-[12px] font-bold">E</kbd>
            {n.kind === "agent" ? <>Press E to Talk to <b style={{ color: AGENTS[n.id].color }}>{AGENTS[n.id].name}</b> <span className="text-slate-400">({AGENTS[n.id].title})</span></> : <>Press E to {LABEL[n.kind]}{n.kind === "computer" && n.agent ? <> of <b>{AGENTS[n.agent].name}</b></> : null}</>}
          </motion.div>
        )}
      </AnimatePresence>
      {!isTouch && !busy && !s.menuOpen && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-ink-900/70 px-3 py-1.5 text-[11.5px] text-slate-300 backdrop-blur">
          <b>WASD</b> walk · <b>Shift</b> run · <b>Space</b> jump · <b>Mouse</b> look (click to capture) · <b>E</b> talk / use · <b>V</b> camera · <b>Esc</b> menu
        </div>
      )}
      <AnimatePresence>
        {s.menuOpen && !busy && (
          <MenuLayer>
            <div className="w-[300px] rounded-3xl border border-white/10 bg-ink-900/95 p-5 shadow-2xl">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-400">Menu</div>
              {[["Resume", () => s.setMenu(false)], [s.cam === "third" ? "Switch to 1st person" : "Switch to 3rd person", () => s.setCam(s.cam === "third" ? "first" : "third")], ["Back to Overview", () => s.setMode("overview")]].map(([l, f]) => (
                <button key={l as string} onClick={f as () => void} className="mb-2 w-full rounded-xl bg-white/[.06] px-4 py-2.5 text-left text-[13.5px] font-semibold hover:bg-white/[.12]">{l as string}</button>
              ))}
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Walk up to an agent and press E to talk. Use computers, the whiteboard, the meeting room and the manager office with E too.</p>
            </div>
          </MenuLayer>
        )}
      </AnimatePresence>
      {isTouch && !busy && <TouchControls />}
    </>
  );
}

function TouchControls() {
  const base = useRef<{ x: number; y: number } | null>(null), look = useRef<{ x: number; y: number } | null>(null), knob = useRef<HTMLDivElement>(null);
  const btn = (label: string, on: () => void, cls = "") => <button onTouchStart={e => { e.preventDefault(); on(); }} className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-ink-900/70 text-[12px] font-bold backdrop-blur ${cls}`}>{label}</button>;
  return (
    <>
      <div className="pointer-events-auto fixed bottom-6 left-6 z-20 h-32 w-32 rounded-full border border-white/15 bg-ink-900/40 backdrop-blur"
        onTouchStart={e => { const t = e.touches[0]; base.current = { x: t.clientX, y: t.clientY }; }}
        onTouchMove={e => { if (!base.current) return; const t = e.touches[0], dx = (t.clientX - base.current.x) / 50, dy = (t.clientY - base.current.y) / 50; touch.x = Math.max(-1, Math.min(1, dx)); touch.y = Math.max(-1, Math.min(1, -dy)); if (knob.current) knob.current.style.transform = `translate(${touch.x * 36}px, ${-touch.y * 36}px)`; }}
        onTouchEnd={() => { base.current = null; touch.x = touch.y = 0; if (knob.current) knob.current.style.transform = ""; }}>
        <div ref={knob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full bg-white/70" />
      </div>
      <div className="pointer-events-auto fixed right-0 top-24 z-10 h-[50vh] w-1/2"
        onTouchStart={e => { const t = e.touches[0]; look.current = { x: t.clientX, y: t.clientY }; }}
        onTouchMove={e => { if (!look.current) return; const t = e.touches[0]; touch.lookX += (t.clientX - look.current.x) * .006; touch.lookY += (t.clientY - look.current.y) * .005; look.current = { x: t.clientX, y: t.clientY }; }}
        onTouchEnd={() => { look.current = null; }} />
      <div className="fixed bottom-8 right-6 z-20 flex gap-3">
        {btn("RUN", () => { touch.run = !touch.run; })}{btn("JUMP", () => { touch.jump = true; })}{btn("E", () => { touch.act = true; }, "bg-white text-ink-950")}
      </div>
    </>
  );
}
