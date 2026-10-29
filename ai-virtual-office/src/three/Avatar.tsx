import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/** what the avatar is doing; written every frame by its owner, read here (no React re-renders) */
export interface Pose {
  speed: number;            // 0 standing … 1 walking … 2 running
  phase: number;            // walk cycle phase (advances with distance)
  seated: boolean;
  act: "idle" | "type" | "think" | "talk" | "celebrate" | "error" | "paused";
  air: boolean;             // in a jump
}
export const newPose = (): Pose => ({ speed: 0, phase: 0, seated: false, act: "idle", air: false });

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** A stylised, procedurally built person (about 1.75 m). It faces +z. */
export function Avatar({ pose, color, hair, skin, pants = "#262b3a", hidden = false }: { pose: MutableRefObject<Pose>; color: string; hair: string; skin: string; pants?: string; hidden?: boolean }) {
  const body = useRef<THREE.Group>(null!), torso = useRef<THREE.Group>(null!), head = useRef<THREE.Group>(null!);
  const lT = useRef<THREE.Group>(null!), lS = useRef<THREE.Group>(null!), rT = useRef<THREE.Group>(null!), rS = useRef<THREE.Group>(null!);
  const lU = useRef<THREE.Group>(null!), lF = useRef<THREE.Group>(null!), rU = useRef<THREE.Group>(null!), rF = useRef<THREE.Group>(null!);

  useFrame((st, dt) => {
    const p = pose.current, t = st.clock.elapsedTime, k = 1 - Math.pow(.0005, dt);           // frame-rate independent smoothing
    const target = { by: 0, tx: 0, tz: 0, hx: 0, hy: 0, lt: 0, ls: 0, rt: 0, rs: 0, lu: 0, luz: .08, lf: 0, ru: 0, ruz: -.08, rf: 0 };
    const sw = Math.sin(p.phase), amp = Math.min(1, p.speed) * .62 + Math.max(0, p.speed - 1) * .3;
    if (p.seated) {
      Object.assign(target, { by: -.38, lt: -Math.PI / 2, rt: -Math.PI / 2, ls: Math.PI / 2, rs: Math.PI / 2 });
    } else if (p.air) {
      Object.assign(target, { lt: -.9, rt: -.5, ls: 1.2, rs: .9, lu: -2.4, ru: -2.4 });
    } else if (p.speed > .05) {
      Object.assign(target, { lt: sw * amp, rt: -sw * amp, ls: Math.max(0, -sw) * amp * 1.1, rs: Math.max(0, sw) * amp * 1.1, lu: -sw * amp * .8, ru: sw * amp * .8, lf: -.3 - p.speed * .25, rf: -.3 - p.speed * .25, by: Math.abs(Math.cos(p.phase)) * .04 * p.speed, tx: .05 * p.speed });
    }
    switch (p.act) {
      case "type": Object.assign(target, { lu: -.75 + Math.sin(t * 11) * .04, ru: -.75 + Math.sin(t * 13 + 1) * .04, lf: -.75, rf: -.75, luz: .22, ruz: -.22, hx: .12 + Math.sin(t * 2) * .03, tx: .08 }); break;
      case "think": Object.assign(target, { ru: -1.25, rf: -2.1, ruz: -.35, lu: -.55, lf: -1.5, luz: .55, hx: -.08, hy: Math.sin(t * .8) * .25 }); break;
      case "talk": Object.assign(target, { lu: -.5 + Math.sin(t * 3) * .25, lf: -.9, ru: -.4 + Math.sin(t * 2.4 + 1) * .3, rf: -1, hy: Math.sin(t * 1.6) * .2 }); break;
      case "celebrate": Object.assign(target, { lu: -2.9, ru: -2.9, luz: .35 + Math.sin(t * 9) * .2, ruz: -.35 - Math.sin(t * 9) * .2, lf: -.3, rf: -.3, by: target.by + (p.seated ? 0 : Math.abs(Math.sin(t * 5)) * .12) }); break;
      case "error": Object.assign(target, { lu: -2.2, ru: -2.2, lf: -2.2, rf: -2.2, luz: .5, ruz: -.5, hx: .1 }); break;
      case "paused": Object.assign(target, { hx: .45, tx: .12, lu: .05, ru: .05 }); break;
      default: if (p.speed <= .05 && !p.seated) Object.assign(target, { lu: Math.sin(t * 1.2) * .03, ru: -Math.sin(t * 1.2) * .03 });
    }
    body.current.position.y = lerp(body.current.position.y, target.by, k);
    torso.current.rotation.x = lerp(torso.current.rotation.x, target.tx, k);
    torso.current.rotation.z = p.act === "error" ? Math.sin(t * 34) * .05 : lerp(torso.current.rotation.z, 0, k);
    torso.current.scale.y = 1 + Math.sin(t * 2.1) * .012;
    head.current.rotation.x = lerp(head.current.rotation.x, target.hx, k); head.current.rotation.y = lerp(head.current.rotation.y, target.hy, k);
    const kk = p.speed > .05 && !p.seated ? Math.min(1, k * 2.5) : k;
    lT.current.rotation.x = lerp(lT.current.rotation.x, target.lt, kk); rT.current.rotation.x = lerp(rT.current.rotation.x, target.rt, kk);
    lS.current.rotation.x = lerp(lS.current.rotation.x, target.ls, kk); rS.current.rotation.x = lerp(rS.current.rotation.x, target.rs, kk);
    lU.current.rotation.x = lerp(lU.current.rotation.x, target.lu, kk); rU.current.rotation.x = lerp(rU.current.rotation.x, target.ru, kk);
    lU.current.rotation.z = lerp(lU.current.rotation.z, target.luz, k); rU.current.rotation.z = lerp(rU.current.rotation.z, target.ruz, k);
    lF.current.rotation.x = lerp(lF.current.rotation.x, target.lf, kk); rF.current.rotation.x = lerp(rF.current.rotation.x, target.rf, kk);
  });

  const skinM = <meshStandardMaterial color={skin} roughness={.6} />;
  const shirt = <meshStandardMaterial color={color} roughness={.55} />;
  const pantsM = <meshStandardMaterial color={pants} roughness={.8} />;
  const shoe = <meshStandardMaterial color="#e9e9ee" roughness={.5} />;
  const leg = (side: number, thigh: React.RefObject<THREE.Group>, shin: React.RefObject<THREE.Group>) => (
    <group ref={thigh} position={[side * .11, .88, 0]}>
      <mesh position={[0, -.21, 0]} castShadow><capsuleGeometry args={[.085, .3, 4, 10]} />{pantsM}</mesh>
      <group ref={shin} position={[0, -.42, 0]}>
        <mesh position={[0, -.2, 0]} castShadow><capsuleGeometry args={[.075, .3, 4, 10]} />{pantsM}</mesh>
        <mesh position={[0, -.43, .05]} castShadow><boxGeometry args={[.13, .08, .26]} />{shoe}</mesh>
      </group>
    </group>
  );
  const arm = (side: number, up: React.RefObject<THREE.Group>, fore: React.RefObject<THREE.Group>) => (
    <group ref={up} position={[side * .29, .5, 0]}>
      <mesh position={[0, -.14, 0]} castShadow><capsuleGeometry args={[.065, .2, 4, 10]} />{shirt}</mesh>
      <group ref={fore} position={[0, -.3, 0]}>
        <mesh position={[0, -.12, 0]} castShadow><capsuleGeometry args={[.055, .18, 4, 10]} />{skinM}</mesh>
        <mesh position={[0, -.26, 0]} castShadow><sphereGeometry args={[.06, 12, 10]} />{skinM}</mesh>
      </group>
    </group>
  );
  return (
    <group visible={!hidden}>
      <group ref={body}>
        {leg(-1, lT, lS)}{leg(1, rT, rS)}
        <group ref={torso} position={[0, .88, 0]}>
          <RoundedBox args={[.5, .56, .28]} radius={.1} smoothness={3} position={[0, .3, 0]} castShadow>{shirt}</RoundedBox>
          <mesh position={[0, .02, 0]} castShadow><boxGeometry args={[.46, .1, .26]} />{pantsM}</mesh>
          {arm(-1, lU, lF)}{arm(1, rU, rF)}
          <group ref={head} position={[0, .64, 0]}>
            <mesh position={[0, .06, 0]} castShadow><cylinderGeometry args={[.06, .07, .1, 10]} />{skinM}</mesh>
            <mesh position={[0, .25, 0]} castShadow><sphereGeometry args={[.19, 24, 20]} />{skinM}</mesh>
            <mesh position={[0, .3, -.015]} castShadow><sphereGeometry args={[.205, 24, 16, 0, Math.PI * 2, 0, Math.PI * .52]} /><meshStandardMaterial color={hair} roughness={.9} /></mesh>
            {[-1, 1].map(s => <mesh key={s} position={[s * .068, .26, .172]}><sphereGeometry args={[.024, 10, 8]} /><meshStandardMaterial color="#141418" roughness={.3} /></mesh>)}
            <mesh position={[0, .19, .176]} rotation={[0, 0, Math.PI]}><torusGeometry args={[.04, .009, 6, 12, Math.PI]} /><meshStandardMaterial color="#7a3b2e" /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
