import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type R3FObject = THREE.Object3D & { __r3f?: { eventCount?: number } };

/**
 * Merges the static meshes below it into one mesh per material once, after mount, so the office costs a few dozen
 * draw calls instead of hundreds. Meshes that are clickable (or sit under something clickable) stay untouched, and
 * materials are shared, so live canvas textures keep updating. The originals stay in the React tree, just hidden.
 */
export function StaticMerge({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useLayoutEffect(() => {
    const root = ref.current; root.updateMatrixWorld(true);
    const inv = root.matrixWorld.clone().invert();
    const interactive = (o: THREE.Object3D) => { for (let x: THREE.Object3D | null = o; x && x !== root; x = x.parent) if ((x as R3FObject).__r3f?.eventCount) return true; return false; };
    const buckets = new Map<string, { mat: THREE.Material; cast: boolean; recv: boolean; geos: THREE.BufferGeometry[] }>();
    const merged: THREE.Mesh[] = [];
    root.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material) || !m.visible || interactive(m)) return;
      let g = m.geometry.clone(); g.applyMatrix4(inv.clone().multiply(m.matrixWorld));
      if (g.index) g = g.toNonIndexed();
      for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      const key = m.material.uuid + "|" + m.castShadow + "|" + m.receiveShadow;
      if (!buckets.has(key)) buckets.set(key, { mat: m.material, cast: m.castShadow, recv: m.receiveShadow, geos: [] });
      buckets.get(key)!.geos.push(g); merged.push(m);
    });
    const added: THREE.Mesh[] = [];
    for (const b of buckets.values()) {
      const geo = mergeGeometries(b.geos, false); b.geos.forEach(g => g.dispose());
      if (!geo) continue;
      const mesh = new THREE.Mesh(geo, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = b.recv; mesh.raycast = () => {};   // never a click target
      root.add(mesh); added.push(mesh);
    }
    merged.forEach(m => (m.visible = false));
    return () => { added.forEach(m => { root.remove(m); m.geometry.dispose(); }); merged.forEach(m => (m.visible = true)); };
  }, []);
  return <group ref={ref}>{children}</group>;
}
