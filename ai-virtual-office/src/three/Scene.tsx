import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AGENT_IDS } from "../data/agents";
import { BOUNDS, WALL_H } from "../data/layout";
import { useOffice } from "../store/useOffice";
import { AgentActor } from "./AgentActor";
import { Office } from "./Office";
import { StaticMerge } from "./StaticMerge";
import { agentPos, Player, player } from "./Player";

const ease = (u: number) => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const OVERVIEW = { pos: new THREE.Vector3(11, 13.5, 15.5), target: new THREE.Vector3(-.5, 0, -1.8) };

/** overview: orbit camera (focuses on a selected agent). life: third- or first-person behind the player.
 *  Switching modes flies the camera between the two over 1.2 s. */
function CameraRig() {
  const { camera, scene, gl } = useThree();
  const mode = useOffice(s => s.mode), focus = useOffice(s => s.focus);
  // ?debug exposes the scene for automated browser tests
  useEffect(() => { if (location.search.includes("debug")) (window as unknown as { __debug: object }).__debug = { camera, scene, player, gl, store: useOffice }; }, [camera, scene, gl]);
  const controls = useRef<OrbitControlsImpl>(null);
  const [orbit, setOrbit] = useState(true);
  const saved = useRef({ pos: OVERVIEW.pos.clone(), target: OVERVIEW.target.clone() });
  const fly = useRef<{ t0: number; fromPos: THREE.Vector3; fromTarget: THREE.Vector3; to: "life" | "overview" } | null>(null);
  const look = useRef(OVERVIEW.target.clone());
  const fAnim = useRef<{ t0: number; fromT: THREE.Vector3; fromP: THREE.Vector3; id: string } | null>(null);

  useEffect(() => {
    const from = camera.position.clone(), fromTarget = (controls.current?.target ?? look.current).clone();
    if (mode === "life") { if (controls.current) saved.current = { pos: camera.position.clone(), target: controls.current.target.clone() }; setOrbit(false); }
    fly.current = { t0: performance.now(), fromPos: from, fromTarget, to: mode };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!focus || !controls.current || useOffice.getState().mode !== "overview") return;
    fAnim.current = { t0: performance.now(), fromT: controls.current.target.clone(), fromP: camera.position.clone(), id: focus.id };
  }, [focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const s = useOffice.getState();
    const want = new THREE.Vector3(), wantLook = new THREE.Vector3();
    if (s.mode === "life") {
      const head = player.pos.clone().add(new THREE.Vector3(0, 1.62, 0));
      if (s.cam === "first") {
        want.copy(head);
        wantLook.copy(head).add(new THREE.Vector3(Math.sin(player.yaw) * Math.cos(player.pitch), Math.sin(player.pitch), Math.cos(player.yaw) * Math.cos(player.pitch)));
      } else {
        const dist = 4.2, el = .35 - player.pitch * .9;
        want.set(player.pos.x - Math.sin(player.yaw) * dist * Math.cos(el), player.pos.y + 1.5 + Math.sin(el) * dist, player.pos.z - Math.cos(player.yaw) * dist * Math.cos(el));
        wantLook.copy(player.pos).add(new THREE.Vector3(0, 1.35, 0));
        // keep the camera inside the office walls
        want.x = Math.min(BOUNDS.maxX - .4, Math.max(BOUNDS.minX + .4, want.x)); want.z = Math.min(BOUNDS.maxZ - .4, Math.max(BOUNDS.minZ + .4, want.z)); want.y = Math.min(WALL_H + 1.2, want.y);
      }
    }
    const f = fly.current;
    if (f) {
      const u = Math.min(1, (performance.now() - f.t0) / 1200), e = ease(u);
      const toPos = f.to === "life" ? want : saved.current.pos, toTarget = f.to === "life" ? wantLook : saved.current.target;
      camera.position.lerpVectors(f.fromPos, toPos, e); look.current.lerpVectors(f.fromTarget, toTarget, e); camera.lookAt(look.current);
      if (u >= 1) { fly.current = null; if (f.to === "overview") setOrbit(true); }
      return;
    }
    if (s.mode === "life") {
      const k = s.cam === "first" ? 1 : 1 - Math.pow(.0001, dt);
      camera.position.lerp(want, k); look.current.lerp(wantLook, s.cam === "first" ? 1 : k); camera.lookAt(look.current);
      return;
    }
    const fa = fAnim.current, c = controls.current;
    if (fa && c) {
      const u = Math.min(1, (performance.now() - fa.t0) / 900), e = ease(u), ap = agentPos(fa.id as (typeof AGENT_IDS)[number]);
      const to = new THREE.Vector3(ap.x, .8, ap.z), dir = fa.fromP.clone().sub(fa.fromT); const d = Math.min(14, Math.max(7, dir.length())); dir.setLength(d);
      c.target.lerpVectors(fa.fromT, to, e); camera.position.lerpVectors(fa.fromP, to.clone().add(dir), e);
      if (u >= 1) fAnim.current = null;
    }
  });

  return orbit ? <OrbitControls ref={controls} makeDefault target={saved.current.target} maxPolarAngle={1.36} minDistance={4} maxDistance={44} enableDamping dampingFactor={.08} /> : null;
}

export function Scene() {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: OVERVIEW.pos.toArray(), fov: 45, near: .1, far: 200 }} gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.25 }}
      onPointerMissed={() => { if (useOffice.getState().mode === "overview") useOffice.getState().select(null); }}>
      <color attach="background" args={["#090b12"]} />
      <fog attach="fog" args={["#090b12", 38, 75]} />
      <hemisphereLight args={["#d4ddff", "#2a2336", 1.15]} />
      <ambientLight intensity={.35} />
      <directionalLight position={[10, 20, 9]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-.0004}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-camera-near={1} shadow-camera-far={60} />
      <pointLight position={[11.5, 2.7, -6.5]} intensity={14} distance={10} color="#ffd9b0" />
      <pointLight position={[-12, 2.7, -7]} intensity={10} distance={9} color="#ffe2c0" />
      <pointLight position={[11.6, 2.6, 6.4]} intensity={12} distance={10} color="#ff9e7a" />
      <pointLight position={[-1.5, 2.9, .8]} intensity={16} distance={13} color="#dfe6ff" />
      <StaticMerge><Office /></StaticMerge>
      {AGENT_IDS.map(id => <AgentActor key={id} id={id} />)}
      <Player />
      <CameraRig />
    </Canvas>
  );
}
