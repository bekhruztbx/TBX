import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { AGENT_IDS } from "../data/agents";
import { COLLIDERS, ENTRANCE, INTERACTABLES, NODES, placeNode } from "../data/layout";
import { pathLength, pointAt } from "../sim/nav";
import { simNow, useOffice } from "../store/useOffice";
import { Avatar, newPose } from "./Avatar";
import { touch } from "./touch";

/** shared with the camera rig and the HUD */
export const player = { pos: new THREE.Vector3(ENTRANCE.x, 0, ENTRANCE.z), vel: new THREE.Vector3(), yaw: Math.PI, pitch: -.12, grounded: true };
const keys = new Set<string>();
let jumpPressed = false;   // a quick tap of Space can fall between two frames, so the press itself is remembered
const R = .32, GRAV = -20, JUMP = 6.4;
const typing = () => { const el = document.activeElement as HTMLElement | null; return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); };

/** where each agent is this frame (the actors compute the same thing for drawing) */
export function agentPos(id: (typeof AGENT_IDS)[number]) {
  const a = useOffice.getState().agents[id];
  if (a.move) { const u = Math.min(1, Math.max(0, (simNow() - a.move.startT) / a.move.duration)); return pointAt(a.move.path, u * pathLength(a.move.path)).pos; }
  return NODES[placeNode(a.place)];
}

function collide(p: THREE.Vector3) {
  for (let it = 0; it < 2; it++) for (const b of COLLIDERS) {
    if (b.h !== undefined && b.h < .9 && p.y > b.h - .05) continue;           // low furniture: you can jump over it
    const cx = Math.max(b.minX, Math.min(p.x, b.maxX)), cz = Math.max(b.minZ, Math.min(p.z, b.maxZ)), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < R * R) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2), push = R - d; p.x += (dx / d) * push; p.z += (dz / d) * push; }
      else { const l = p.x - b.minX, r = b.maxX - p.x, f = p.z - b.minZ, k = b.maxZ - p.z, m = Math.min(l, r, f, k); if (m === l) p.x = b.minX - R; else if (m === r) p.x = b.maxX + R; else if (m === f) p.z = b.minZ - R; else p.z = b.maxZ + R; }
    }
  }
}

export function Player() {
  const mode = useOffice(s => s.mode), cam = useOffice(s => s.cam);
  const group = useRef<THREE.Group>(null!), pose = useRef(newPose());
  const { gl } = useThree();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = useOffice.getState();
      // Esc closes whatever window is open, in either mode (even while typing in it)
      if (e.code === "Escape" && (s.assignFor || s.chatWith || s.modal)) {
        if (s.assignFor) s.setAssignFor(null); else if (s.chatWith) s.openChat(null); else s.openModal(null);
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }
      if (typing()) return;
      if (s.mode !== "life") return;
      keys.add(e.code);
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) jumpPressed = true; }
      if (e.code === "KeyE") useAct();
      if (e.code === "KeyV") s.setCam(s.cam === "third" ? "first" : "third");
      if (e.code === "Escape" && !document.pointerLockElement && !s.chatWith && !s.modal && !s.assignFor) s.setMenu(!s.menuOpen);
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const move = (e: MouseEvent) => {
      const s = useOffice.getState();
      if (s.mode !== "life") return;
      if (document.pointerLockElement === gl.domElement || (e.buttons & 1 && !document.pointerLockElement && dragging)) {
        player.yaw -= e.movementX * .0024; player.pitch = Math.max(-1.1, Math.min(.7, player.pitch - e.movementY * .002));
      }
    };
    let dragging = false;
    const md = (e: MouseEvent) => {
      const s = useOffice.getState();
      if (s.mode !== "life" || e.target !== gl.domElement) return;
      dragging = true;
      if (!document.pointerLockElement && !s.chatWith && !s.menuOpen) { try { const r = gl.domElement.requestPointerLock() as unknown as Promise<void> | undefined; r?.catch?.(() => {}); } catch { /* not available: drag to look */ } }
    };
    const mu = () => { dragging = false; };
    const lockChange = () => { const s = useOffice.getState(); if (!document.pointerLockElement && s.mode === "life" && !s.chatWith && !s.modal && !s.assignFor) s.setMenu(true); if (document.pointerLockElement) s.setMenu(false); };
    const blur = () => keys.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", md); window.addEventListener("mouseup", mu); window.addEventListener("blur", blur); document.addEventListener("pointerlockchange", lockChange);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("mousemove", move); window.removeEventListener("mousedown", md); window.removeEventListener("mouseup", mu); window.removeEventListener("blur", blur); document.removeEventListener("pointerlockchange", lockChange); };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(.1, dtRaw), s = useOffice.getState(), p = pose.current;
    if (s.mode === "life" && !s.chatWith && !s.modal && !s.menuOpen && !s.assignFor) {
      const f = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) + touch.y;
      const r = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + touch.x;
      player.yaw -= touch.lookX; player.pitch = Math.max(-1.1, Math.min(.7, player.pitch - touch.lookY)); touch.lookX = touch.lookY = 0;
      const run = keys.has("ShiftLeft") || keys.has("ShiftRight") || touch.run, speed = run ? 5.6 : 2.8;
      const len = Math.hypot(f, r), fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
      let vx = 0, vz = 0;
      if (len > .05) { const nf = f / Math.max(1, len), nr = r / Math.max(1, len); vx = (fx * nf - fz * nr) * speed; vz = (fz * nf + fx * nr) * speed; }
      player.vel.x += (vx - player.vel.x) * Math.min(1, dt * 12); player.vel.z += (vz - player.vel.z) * Math.min(1, dt * 12);
      if ((jumpPressed || keys.has("Space") || touch.jump) && player.grounded) { player.vel.y = JUMP; player.grounded = false; }
      jumpPressed = false; touch.jump = false;
      if (touch.act) { touch.act = false; useAct(); }
    } else { player.vel.x *= .8; player.vel.z *= .8; jumpPressed = false; }
    player.vel.y += GRAV * dt;
    player.pos.addScaledVector(player.vel, dt);
    if (player.pos.y <= 0) { player.pos.y = 0; player.vel.y = 0; player.grounded = true; }
    // agents are solid too (walls win, so this runs first)
    for (const id of AGENT_IDS) {
      const a = agentPos(id), dx = player.pos.x - a.x, dz = player.pos.z - a.z, d = Math.hypot(dx, dz), min = R + .3;
      if (d < min && d > 1e-4) { player.pos.x += (dx / d) * (min - d); player.pos.z += (dz / d) * (min - d); }
    }
    collide(player.pos);
    group.current.position.copy(player.pos);
    const hs = Math.hypot(player.vel.x, player.vel.z);
    if (hs > .2) group.current.rotation.y = Math.atan2(player.vel.x, player.vel.z);
    else if (s.mode === "life" && s.cam === "first") group.current.rotation.y = player.yaw;
    p.speed = hs / 2.8; p.phase += hs * dt * 3.4; p.air = !player.grounded; p.act = "idle"; p.seated = false;

    // who or what is close enough to use
    if (s.mode === "life") {
      let best: ReturnType<typeof useOffice.getState>["nearby"] = null, bd = 2.1;
      for (const id of AGENT_IDS) { const a = agentPos(id), d = Math.hypot(a.x - player.pos.x, a.z - player.pos.z); if (d < bd) { bd = d; best = { kind: "agent", id }; } }
      if (!best) { let id2 = 1.7; for (const it of INTERACTABLES) { const d = Math.hypot(it.at.x - player.pos.x, it.at.z - player.pos.z); if (d < id2) { id2 = d; best = { kind: it.kind, id: it.id, agent: it.agent }; } } }
      s.setNearby(best);
    }
  });

  return (
    <group ref={group} visible={mode === "life"} rotation-y={player.yaw}>
      <Avatar pose={pose} color="#e8e8ee" hair="#1d1d22" skin="#d6a582" pants="#30364a" hidden={mode === "life" && cam === "first"} />
      {mode === "life" && cam === "third" && (
        <Html position={[0, 2.15, 0]} center distanceFactor={6} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
          <div className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-900 shadow">YOU</div>
        </Html>
      )}
    </group>
  );
}

/** E: talk to the agent in front of you, or use the thing you stand at */
export function useAct() {
  const s = useOffice.getState(), n = s.nearby;
  if (!n) return;
  if (n.kind === "agent") { s.openChat(n.id); return; }
  if (n.kind === "computer" && n.agent) { s.select(n.agent, "tasks"); if (document.pointerLockElement) document.exitPointerLock(); return; }
  if (n.kind === "whiteboard") s.openModal("whiteboard");
  if (n.kind === "meeting") s.openModal("meeting");
  if (n.kind === "manager") s.openModal("manager");
}
