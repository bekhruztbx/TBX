import { EDGES, NODES, placeNode } from "../data/layout";
import type { Place, Vec2 } from "../types";

export const WALK_SPEED = 1.6; // m per sim second

const d = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);

/** shortest node path (Dijkstra on a tiny graph) */
export function nodePath(from: string, to: string): string[] {
  if (from === to) return [from];
  const dist: Record<string, number> = { [from]: 0 }, prev: Record<string, string> = {}, open = new Set(Object.keys(NODES));
  while (open.size) {
    let u = "", best = Infinity;
    for (const n of open) if ((dist[n] ?? Infinity) < best) { best = dist[n]; u = n; }
    if (!u || u === to) break;
    open.delete(u);
    for (const v of EDGES[u] ?? []) { const alt = best + d(NODES[u], NODES[v]); if (alt < (dist[v] ?? Infinity)) { dist[v] = alt; prev[v] = u; } }
  }
  const out = [to]; let c = to;
  while (c !== from) { c = prev[c]; if (!c) return [from, to]; out.unshift(c); }
  return out;
}
export function placePath(from: Place, to: Place): Vec2[] { return nodePath(placeNode(from), placeNode(to)).map(n => NODES[n]); }
export function pathLength(p: Vec2[]): number { let s = 0; for (let i = 1; i < p.length; i++) s += d(p[i - 1], p[i]); return s; }

/** where along a path we are after walking `dist` metres, and which way we face */
export function pointAt(p: Vec2[], dist: number): { pos: Vec2; yaw: number } {
  for (let i = 1; i < p.length; i++) {
    const seg = d(p[i - 1], p[i]);
    if (dist <= seg || i === p.length - 1) {
      const u = seg ? Math.min(1, Math.max(0, dist / seg)) : 1, a = p[i - 1], b = p[i];
      return { pos: { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
    }
    dist -= seg;
  }
  return { pos: p[p.length - 1], yaw: 0 };
}
