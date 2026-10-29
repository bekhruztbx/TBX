import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AGENTS } from "../data/agents";
import { BOUNDS, DESKS, MANAGER_DESK, MEETING_TABLE, NODES, ROOMS, WALL_H, WHITEBOARD, placeYaw } from "../data/layout";
import { useOffice } from "../store/useOffice";
import type { AgentId } from "../types";
import { canvasTexture, carpetTexture, drawBoard, drawScreen, floorTexture, signTexture, skylineTexture } from "./textures";

const M = {
  wall: new THREE.MeshStandardMaterial({ color: "#20242f", roughness: .9 }),
  wallLight: new THREE.MeshStandardMaterial({ color: "#2a303d", roughness: .85 }),
  frame: new THREE.MeshStandardMaterial({ color: "#0e1016", roughness: .4, metalness: .6 }),
  glass: new THREE.MeshStandardMaterial({ color: "#9fd0ff", transparent: true, opacity: .14, roughness: .05, metalness: .1, depthWrite: false, side: THREE.DoubleSide }),
  deskTop: new THREE.MeshStandardMaterial({ color: "#e9e4dc", roughness: .45 }),
  wood: new THREE.MeshStandardMaterial({ color: "#8a6a4f", roughness: .6 }),
  metal: new THREE.MeshStandardMaterial({ color: "#3a3f4b", roughness: .35, metalness: .8 }),
  dark: new THREE.MeshStandardMaterial({ color: "#16181f", roughness: .5 }),
  chair: new THREE.MeshStandardMaterial({ color: "#2b2f3a", roughness: .7 }),
  sofa: new THREE.MeshStandardMaterial({ color: "#3d4a6b", roughness: .9 }),
  cushion: new THREE.MeshStandardMaterial({ color: "#f08a5d", roughness: .9 }),
  pot: new THREE.MeshStandardMaterial({ color: "#d9d4ca", roughness: .7 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#3f8f5a", roughness: .8 }),
  led: new THREE.MeshBasicMaterial({ color: "#f08a5d" }),
  ledBlue: new THREE.MeshBasicMaterial({ color: "#6c8cff" }),
};

const cursor = (on: boolean) => () => { document.body.style.cursor = on ? "pointer" : ""; };
const click = (fn: () => void) => (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (useOffice.getState().mode === "overview") fn(); };

function Box({ p, s, m, cast = true, onClick }: { p: [number, number, number]; s: [number, number, number]; m: THREE.Material; cast?: boolean; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  return <mesh position={p} material={m} castShadow={cast} receiveShadow onClick={onClick} onPointerOver={onClick ? cursor(true) : undefined} onPointerOut={onClick ? cursor(false) : undefined}><boxGeometry args={s} /></mesh>;
}

export function Chair({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={yaw}>
      <Box p={[0, .46, 0]} s={[.5, .08, .5]} m={M.chair} />
      <Box p={[0, .8, -.24]} s={[.48, .6, .07]} m={M.chair} />
      <Box p={[0, .24, 0]} s={[.06, .4, .06]} m={M.metal} />
      <mesh position={[0, .04, 0]} material={M.metal}><cylinderGeometry args={[.3, .3, .04, 5]} /></mesh>
    </group>
  );
}

function Plant({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, .25, 0]} material={M.pot} castShadow><cylinderGeometry args={[.22, .17, .5, 16]} /></mesh>
      <mesh position={[0, .78, 0]} material={M.leaf} castShadow><icosahedronGeometry args={[.42, 1]} /></mesh>
      <mesh position={[.15, 1.05, .05]} material={M.leaf} castShadow><icosahedronGeometry args={[.28, 1]} /></mesh>
    </group>
  );
}

/** a desk with a live monitor showing the agent's status and task */
function Desk({ agent, x, z, w = 1.8 }: { agent: AgentId; x: number; z: number; w?: number }) {
  const a = useOffice(s => s.agents[agent]);
  const task = useOffice(s => s.tasks.find(t => t.id === s.agents[agent].taskId) ?? null);
  const { tex, ctx } = useMemo(() => { const t = canvasTexture(512, 300, () => {}); return { tex: t, ctx: (t.image as HTMLCanvasElement).getContext("2d")! }; }, []);
  const key = `${a.status}|${Math.round(a.progress * 20)}|${task?.id}|${a.action}`;
  useEffect(() => { drawScreen(ctx, a, task); tex.needsUpdate = true; }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = click(() => useOffice.getState().select(agent, "tasks"));
  const mugMat = useMemo(() => new THREE.MeshStandardMaterial({ color: AGENTS[agent].color }), [agent]);
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, .74, 0]} s={[w, .05, .8]} m={M.deskTop} />
      {[-1, 1].map(sx => <Box key={sx} p={[sx * (w / 2 - .06), .37, 0]} s={[.05, .74, .7]} m={M.metal} />)}
      <Box p={[0, .79, -.05]} s={[.55, .015, .18]} m={M.dark} />
      <group position={[0, 1.13, -.24]}>
        <Box p={[0, 0, 0]} s={[.92, .56, .04]} m={M.dark} onClick={open} />
        <mesh position={[0, 0, .021]} onClick={open} onPointerOver={cursor(true)} onPointerOut={cursor(false)}><planeGeometry args={[.86, .5]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <Box p={[0, -.34, -.02]} s={[.06, .14, .06]} m={M.metal} />
      </group>
      <mesh position={[w / 2 - .25, .82, .12]} material={mugMat} castShadow><cylinderGeometry args={[.045, .04, .11, 12]} /></mesh>
    </group>
  );
}

function Whiteboard() {
  const project = useOffice(s => s.project), tasks = useOffice(s => s.tasks);
  const { tex, ctx } = useMemo(() => { const t = canvasTexture(1024, 512, () => {}); return { tex: t, ctx: (t.image as HTMLCanvasElement).getContext("2d")! }; }, []);
  const key = `${project?.status}|${Math.round((project?.progress ?? 0) * 20)}|${tasks.map(t => t.status).join("")}`;
  useEffect(() => { drawBoard(ctx, project, tasks); tex.needsUpdate = true; }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = click(() => useOffice.getState().openModal("whiteboard"));
  return (
    <group position={[WHITEBOARD.x, 0, WHITEBOARD.z]}>
      <Box p={[0, 1.55, 0]} s={[WHITEBOARD.w + .1, 1.7, .05]} m={M.frame} onClick={open} />
      <mesh position={[0, 1.55, .03]} onClick={open} onPointerOver={cursor(true)} onPointerOut={cursor(false)}><planeGeometry args={[WHITEBOARD.w, 1.6]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
}

function MeetingTv() {
  const project = useOffice(s => s.project);
  const tex = useMemo(() => canvasTexture(1024, 512, () => {}), []);
  useEffect(() => {
    const c = (tex.image as HTMLCanvasElement).getContext("2d")!;
    const g = c.createLinearGradient(0, 0, 1024, 512); g.addColorStop(0, "#151a2e"); g.addColorStop(1, "#2a1a24"); c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
    c.fillStyle = "#f08a5d"; c.font = "700 34px Inter, sans-serif"; c.fillText("KICKOFF", 60, 110);
    c.fillStyle = "#f4f1ea"; c.font = "800 64px Inter, sans-serif"; c.fillText((project?.title ?? "No active project").slice(0, 26), 60, 210);
    c.fillStyle = "#8b93a7"; c.font = "500 34px Inter, sans-serif"; c.fillText(project ? `Status: ${project.status} · ${Math.round(project.progress * 100)}%` : "Type a task and press Start", 60, 290);
    tex.needsUpdate = true;
  }, [project?.title, project?.status, Math.round((project?.progress ?? 0) * 20)]); // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh position={[15.86, 1.75, -6.5]} rotation-y={-Math.PI / 2}><planeGeometry args={[3.2, 1.6]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
}

function GlassWall({ x0, z0, x1, z1 }: { x0: number; z0: number; x1: number; z1: number }) {
  const len = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, yaw = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
  return (
    <group position={[cx, 0, cz]} rotation-y={yaw}>
      <mesh position={[0, WALL_H / 2, 0]} material={M.glass}><boxGeometry args={[len, WALL_H, .04]} /></mesh>
      <Box p={[0, .03, 0]} s={[len, .06, .1]} m={M.frame} cast={false} />
      <Box p={[0, WALL_H, 0]} s={[len, .08, .12]} m={M.frame} cast={false} />
      {Array.from({ length: Math.max(1, Math.floor(len / 2)) + 1 }, (_, i) => <Box key={i} p={[-len / 2 + (i * len) / Math.max(1, Math.floor(len / 2)), WALL_H / 2, 0]} s={[.05, WALL_H, .08]} m={M.frame} cast={false} />)}
    </group>
  );
}

export function Office() {
  const tex = useMemo(() => ({ floor: floorTexture(), meet: carpetTexture("#22314f"), lounge: carpetTexture("#3b2a33"), mgr: carpetTexture("#2b2f24"), sky: skylineTexture(), sign: signTexture("VIRTUAL OFFICE", "AI agents at work") }), []);
  const W = BOUNDS.maxX - BOUNDS.minX, D = BOUNDS.maxZ - BOUNDS.minZ;
  const openMeeting = click(() => useOffice.getState().openModal("meeting")), openManager = click(() => useOffice.getState().openModal("manager"));
  return (
    <group>
      {/* floor and rugs */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[W, D]} /><meshStandardMaterial map={tex.floor} roughness={.75} metalness={.05} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(ROOMS.meeting.minX + ROOMS.meeting.maxX) / 2, .005, (ROOMS.meeting.minZ + ROOMS.meeting.maxZ) / 2]} receiveShadow onClick={openMeeting}><planeGeometry args={[ROOMS.meeting.maxX - ROOMS.meeting.minX - .2, ROOMS.meeting.maxZ - ROOMS.meeting.minZ - .2]} /><meshStandardMaterial map={tex.meet} roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[(ROOMS.manager.minX + ROOMS.manager.maxX) / 2, .005, (ROOMS.manager.minZ + ROOMS.manager.maxZ) / 2]} receiveShadow onClick={openManager}><planeGeometry args={[7.8, 7.3]} /><meshStandardMaterial map={tex.mgr} roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[11.6, .005, 6.4]} receiveShadow><circleGeometry args={[3, 48]} /><meshStandardMaterial map={tex.lounge} roughness={1} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-1.5, .004, .6]} receiveShadow><planeGeometry args={[11.4, 3.6]} /><meshStandardMaterial color="#232838" roughness={1} /></mesh>

      {/* outer walls: windows onto a night skyline at the back, LED strips on the sides */}
      <mesh position={[0, WALL_H / 2, BOUNDS.minZ - .13]} material={M.wall}><boxGeometry args={[W + .3, WALL_H, .25]} /></mesh>
      <mesh position={[0, 1.7, BOUNDS.minZ + .01]}><planeGeometry args={[W - .2, 2.6]} /><meshBasicMaterial map={tex.sky} toneMapped={false} /></mesh>
      {Array.from({ length: 17 }, (_, i) => <Box key={i} p={[BOUNDS.minX + i * 2, 1.7, BOUNDS.minZ + .04]} s={[.08, 2.7, .06]} m={M.frame} cast={false} />)}
      <Box p={[0, .36, BOUNDS.minZ + .06]} s={[W, .12, .1]} m={M.frame} cast={false} /><Box p={[0, 3.02, BOUNDS.minZ + .06]} s={[W, .1, .1]} m={M.frame} cast={false} />
      {[BOUNDS.minX, BOUNDS.maxX].map(x => (
        <group key={x}>
          <mesh position={[x + (x < 0 ? -.13 : .13), WALL_H / 2, 0]} material={M.wallLight} receiveShadow><boxGeometry args={[.25, WALL_H, D]} /></mesh>
          <mesh position={[x + (x < 0 ? .02 : -.02), 2.9, 0]} material={x < 0 ? M.led : M.ledBlue}><boxGeometry args={[.02, .04, D - .4]} /></mesh>
        </group>
      ))}
      <mesh position={[-8.8, WALL_H / 2, BOUNDS.maxZ + .13]} material={M.wallLight} receiveShadow><boxGeometry args={[14.4, WALL_H, .25]} /></mesh>
      <mesh position={[8.8, WALL_H / 2, BOUNDS.maxZ + .13]} material={M.wallLight} receiveShadow><boxGeometry args={[14.4, WALL_H, .25]} /></mesh>
      <GlassWall x0={-1.6} z0={BOUNDS.maxZ + 1.3} x1={1.6} z1={BOUNDS.maxZ + 1.3} />
      <Box p={[0, WALL_H, BOUNDS.maxZ + .13]} s={[3.2, .3, .3]} m={M.frame} cast={false} />

      {/* manager office */}
      <GlassWall x0={-8} z0={-11} x1={-8} z1={-3.5} />
      <GlassWall x0={-16} z0={-3.5} x1={ROOMS.manager.doorX[0]} z1={-3.5} />
      <GlassWall x0={ROOMS.manager.doorX[1]} z0={-3.5} x1={-8} z1={-3.5} />
      <group onClick={openManager} onPointerOver={cursor(true)} onPointerOut={cursor(false)}>
        <Desk agent="manager" x={MANAGER_DESK.x} z={MANAGER_DESK.z} w={2.2} />
      </group>
      <Chair x={NODES.m_seat.x} z={NODES.m_seat.z} yaw={Math.PI} />
      <Chair x={-13} z={-5} yaw={0} /><Chair x={-11} z={-5} yaw={0} />
      <group position={[-15.7, 0, -7.5]}>
        <Box p={[0, 1.1, 0]} s={[.4, 2.2, 3.2]} m={M.wood} />
        {[.5, 1.1, 1.7].map(y => <Box key={y} p={[.12, y, 0]} s={[.22, .3, 2.8]} m={M.dark} cast={false} />)}
      </group>
      <Plant x={-15.2} z={-10.3} s={1.2} /><Plant x={-8.6} z={-10.3} />

      {/* meeting room */}
      <GlassWall x0={7} z0={-11} x1={7} z1={-2.5} />
      <GlassWall x0={7} z0={-2.5} x1={ROOMS.meeting.doorX[0]} z1={-2.5} />
      <GlassWall x0={ROOMS.meeting.doorX[1]} z0={-2.5} x1={16} z1={-2.5} />
      <group onClick={openMeeting} onPointerOver={cursor(true)} onPointerOut={cursor(false)}>
        <RoundedBox args={[MEETING_TABLE.w, .07, MEETING_TABLE.d]} radius={.03} position={[MEETING_TABLE.x, .75, MEETING_TABLE.z]} castShadow receiveShadow><meshStandardMaterial color="#2c2f3a" roughness={.3} /></RoundedBox>
        <Box p={[MEETING_TABLE.x - 1.4, .37, MEETING_TABLE.z]} s={[.1, .72, .9]} m={M.metal} /><Box p={[MEETING_TABLE.x + 1.4, .37, MEETING_TABLE.z]} s={[.1, .72, .9]} m={M.metal} />
      </group>
      {[0, 1, 2, 3, 4, 5, 6].map(i => { const n = NODES["seat" + i]; return <Chair key={i} x={n.x} z={n.z} yaw={placeYaw({ kind: "meeting", seat: i }) + Math.PI} />; })}
      <MeetingTv />
      <Plant x={7.6} z={-10.3} /><Plant x={15.3} z={-3.1} s={.9} />
      <Whiteboard />

      {/* open office: four desks */}
      {(Object.entries(DESKS) as [AgentId, { x: number; z: number }][]).map(([a, d]) => (
        <group key={a}>
          <Desk agent={a} x={d.x} z={d.z} />
          <Chair x={d.x} z={NODES["desk_" + a].z} yaw={Math.PI} />
        </group>
      ))}
      <Plant x={-7.6} z={-.2} /><Plant x={4.7} z={-.2} s={.9} /><Plant x={-7.4} z={5.6} s={1.1} /><Plant x={5.6} z={9.6} />

      {/* lounge */}
      <group>
        <Box p={[11.2, .3, 8.5]} s={[4.4, .5, 1.2]} m={M.sofa} /><Box p={[11.2, .75, 9.0]} s={[4.4, .6, .3]} m={M.sofa} />
        <Box p={[14.5, .3, 6.25]} s={[1.2, .5, 3.3]} m={M.sofa} /><Box p={[15, .75, 6.25]} s={[.3, .6, 3.3]} m={M.sofa} />
        {[10, 11.4, 12.6].map(x => <Box key={x} p={[x, .62, 8.45]} s={[.6, .3, .5]} m={M.cushion} />)}
        <RoundedBox args={[2, .1, 1]} radius={.04} position={[11.3, .42, 6.2]} castShadow><meshStandardMaterial color="#d8d2c6" roughness={.4} /></RoundedBox>
        <Box p={[11.3, .2, 6.2]} s={[1.6, .36, .6]} m={M.dark} />
        <group position={[15.6, 0, 3.9]}>
          <Box p={[0, .45, 0]} s={[.6, .9, 1]} m={M.wood} /><Box p={[-.05, 1.2, 0]} s={[.45, .6, .4]} m={M.dark} />
          <mesh position={[-.29, 1.25, 0]}><planeGeometry args={[.01, .01]} /></mesh>
        </group>
        <Plant x={15.2} z={9.4} s={1.3} /><Plant x={8.6} z={9.4} />
      </group>

      {/* reception + sign */}
      <RoundedBox args={[3.4, 1, 1.6]} radius={.15} position={[-14.2, .5, 8.4]} castShadow receiveShadow><meshStandardMaterial color="#e9e4dc" roughness={.5} /></RoundedBox>
      <mesh position={[-14.2, 2.1, BOUNDS.maxZ - .02]} rotation-y={Math.PI}><planeGeometry args={[3.6, .9]} /><meshBasicMaterial map={tex.sign} toneMapped={false} /></mesh>
      <mesh position={[0, 2.35, BOUNDS.minZ + .12]}><planeGeometry args={[4.8, 1.2]} /><meshBasicMaterial map={tex.sign} toneMapped={false} transparent opacity={.92} /></mesh>
    </group>
  );
}
