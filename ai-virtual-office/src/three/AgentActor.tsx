import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AGENTS, STATUS_COLOR, STATUS_LABEL } from "../data/agents";
import { isSeated, NODES, placeNode, placeYaw } from "../data/layout";
import { pathLength, pointAt } from "../sim/nav";
import { simNow, useOffice } from "../store/useOffice";
import type { AgentId } from "../types";
import { Avatar, newPose } from "./Avatar";

const angleLerp = (a: number, b: number, k: number) => { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

/** one agent in the office: plays back its walks on the adapter clock and picks a pose from its status */
export function AgentActor({ id }: { id: AgentId }) {
  const prof = AGENTS[id];
  const group = useRef<THREE.Group>(null!), ring = useRef<THREE.Mesh>(null!), pose = useRef(newPose());
  const status = useOffice(s => s.agents[id].status), action = useOffice(s => s.agents[id].action), progress = useOffice(s => s.agents[id].progress);
  const selected = useOffice(s => s.selected === id), near = useOffice(s => s.nearby?.kind === "agent" && s.nearby.id === id), mode = useOffice(s => s.mode);
  const last = useOffice(s => { for (let i = s.messages.length - 1; i >= Math.max(0, s.messages.length - 12); i--) if (s.messages[i].from === id) return s.messages[i]; return null; });
  const [hover, setHover] = useState(false);
  const yaw = useRef(Math.PI), lenCache = useRef<{ key: number; len: number }>({ key: -1, len: 0 });
  const doneAt = useRef(-1), prevStatus = useRef(status);
  if (prevStatus.current !== status) { if (status === "completed") doneAt.current = performance.now(); prevStatus.current = status; }
  const [bubble, setBubble] = useState<string | null>(null);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: STATUS_COLOR.idle, transparent: true, opacity: .85, depthWrite: false }), []);

  useFrame((_, dt) => {
    const a = useOffice.getState().agents[id], now = simNow(), p = pose.current;
    let x: number, z: number, targetYaw: number, moving = false;
    if (a.move) {
      if (lenCache.current.key !== a.move.startT) lenCache.current = { key: a.move.startT, len: pathLength(a.move.path) };
      const u = Math.min(1, Math.max(0, (now - a.move.startT) / a.move.duration)), d = u * lenCache.current.len, pt = pointAt(a.move.path, d);
      x = pt.pos.x; z = pt.pos.z; targetYaw = pt.yaw; moving = u < 1; p.phase = d * 3.4;
    } else { const n = NODES[placeNode(a.place)]; x = n.x; z = n.z; targetYaw = placeYaw(a.place); }
    group.current.position.set(x, 0, z);
    yaw.current = angleLerp(yaw.current, targetYaw, 1 - Math.pow(.002, dt)); group.current.rotation.y = yaw.current;
    p.speed = moving ? 1 : 0; p.seated = !moving && isSeated(a.place);
    const talking = !!last && now - last.t < 3.2;
    p.act = a.status === "error" ? "error" : a.status === "paused" ? "paused" : a.status === "completed" && performance.now() - doneAt.current < 3500 ? "celebrate"
      : talking && !p.seated ? "talk" : a.status === "thinking" && !moving ? "think" : a.status === "working" && p.seated && a.place.kind !== "meeting" ? "type" : talking ? "talk" : "idle";
    ringMat.color.set(STATUS_COLOR[a.status]); ringMat.opacity = .55 + .3 * Math.sin(performance.now() / 260);
    ring.current.scale.setScalar(selected ? 1.18 : 1);
    const b = talking ? last!.text : null; if (b !== bubble) setBubble(b);
  });

  const showDetail = selected || hover || near;
  return (
    <group ref={group} onClick={e => { e.stopPropagation(); useOffice.getState().select(id, "overview"); }}
      onPointerOver={e => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
      <Avatar pose={pose} color={prof.color} hair={prof.hair} skin={prof.skin} />
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={.025} material={ringMat}><ringGeometry args={[.42, .52, 40]} /></mesh>
      <mesh visible={false} position-y={1}><boxGeometry args={[.8, 2, .8]} /></mesh>
      <Html position={[0, 2.18, 0]} center distanceFactor={mode === "life" ? 6 : 13} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div className={`whitespace-nowrap rounded-full border px-3 py-1 text-[13px] font-semibold shadow-lg backdrop-blur-md transition ${selected ? "border-white/60 bg-ink-900/90" : "border-white/10 bg-ink-900/75"}`}>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: STATUS_COLOR[status], boxShadow: `0 0 8px ${STATUS_COLOR[status]}` }} />
          <span className="text-white">{prof.name}</span>
          <span className="ml-1.5 text-[11px] font-medium text-slate-400">{prof.title.replace(" Agent", "")}</span>
          {status === "error" && <span className="ml-1.5 rounded bg-red-500/90 px-1 text-[10px] text-white">!</span>}
        </div>
        {showDetail && (
          <div className="mx-auto mt-1 w-56 rounded-xl border border-white/10 bg-ink-900/85 px-3 py-2 text-[11px] text-slate-300 shadow-xl backdrop-blur-md">
            <div className="flex justify-between"><span style={{ color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</span>{progress > 0 && <span className="font-mono">{Math.round(progress * 100)}%</span>}</div>
            <div className="mt-0.5 line-clamp-2 text-slate-200">{action}</div>
            {progress > 0 && <div className="mt-1.5 h-1 rounded bg-white/10"><div className="h-1 rounded" style={{ width: `${progress * 100}%`, background: STATUS_COLOR[status] }} /></div>}
          </div>
        )}
      </Html>
      {bubble && (
        <Html position={[0, showDetail ? 3.15 : 2.7, 0]} center distanceFactor={mode === "life" ? 6 : 13} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
          <div className="relative max-w-[260px] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[12px] font-medium leading-snug text-slate-900 shadow-2xl" style={{ width: "max-content" }}>
            {bubble.length > 110 ? bubble.slice(0, 107) + "…" : bubble}
          </div>
        </Html>
      )}
    </group>
  );
}
