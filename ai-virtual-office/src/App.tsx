import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { useEffect } from "react";
import { useOffice } from "./store/useOffice";
import { Scene } from "./three/Scene";
import { Hud } from "./ui/Hud";
import { LeftPanel } from "./ui/LeftPanel";
import { Overlays } from "./ui/Overlays";
import { RightPanel } from "./ui/RightPanel";
import { TopBar } from "./ui/TopBar";

/** a side panel slot; once it starts sliding out, clicks go through to the office */
function Side({ dx, children }: { dx: number; children: React.ReactNode }) {
  const present = useIsPresent();
  return <motion.div className={`h-full ${present ? "" : "[&>*]:!pointer-events-none"}`} initial={{ opacity: 0, x: dx }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dx }}>{children}</motion.div>;
}

export default function App() {
  const init = useOffice(s => s.init), leftOpen = useOffice(s => s.leftOpen), rightOpen = useOffice(s => s.rightOpen), mode = useOffice(s => s.mode), project = useOffice(s => s.project), lang = useOffice(s => s.lang);
  useEffect(() => { init(); }, [init]);
  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 isolate"><Scene /></div>
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3">
        <TopBar />
        <div className="relative flex min-h-0 flex-1 justify-between gap-3">
          <AnimatePresence>{leftOpen && <Side key="l" dx={-24}><LeftPanel /></Side>}</AnimatePresence>
          <div className="flex-1" />
          <AnimatePresence>{rightOpen && <Side key="r" dx={24}><RightPanel /></Side>}</AnimatePresence>
        </div>
        {mode === "overview" && !project && !leftOpen && (
          <div className="pointer-events-auto mx-auto mb-2 rounded-2xl border border-white/10 bg-ink-900/85 px-4 py-2.5 text-[13px] text-slate-200 backdrop-blur-xl">
            {lang === "uz" ? "Boshlash uchun chap panelni oching va vazifa yozing." : "Open the left panel and type a task to start."} <button className="ml-2 font-semibold text-[#f08a5d]" onClick={() => useOffice.getState().setLeft(true)}>{lang === "uz" ? "Ochish" : "Open"}</button>
          </div>
        )}
      </div>
      <Hud />
      <Overlays />
    </div>
  );
}
