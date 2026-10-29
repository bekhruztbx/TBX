import type { AgentId, Place, Vec2 } from "../types";

/** The office floor plan, in metres. x runs west -> east, z runs north (back, -) -> south (front, +).
 *  The same numbers drive the 3D scene, the agents' walking paths and the player's collisions. */
export const BOUNDS = { minX: -16, maxX: 16, minZ: -11, maxZ: 11 };
export const WALL_H = 3.2;

export const ROOMS = {
  manager: { minX: -16, maxX: -8, minZ: -11, maxZ: -3.5, doorX: [-10.4, -9.2] as const },
  meeting: { minX: 7, maxX: 16, minZ: -11, maxZ: -2.5, doorX: [8.2, 9.4] as const },
  lounge: { minX: 8, maxX: 15.6, minZ: 3, maxZ: 9.5 },
};

export const DESKS: Record<Exclude<AgentId, "manager">, { x: number; z: number }> = {
  research: { x: -6, z: 0 }, designer: { x: -3, z: 0 }, developer: { x: 0, z: 0 }, qa: { x: 3, z: 0 },
};
export const MANAGER_DESK = { x: -12, z: -7.6 };
export const MEETING_TABLE = { x: 11.5, z: -6.5, w: 4.2, d: 1.6 };
export const WHITEBOARD = { x: 12.5, z: -2.32, w: 3.2 };
export const ENTRANCE: Vec2 = { x: 0, z: 6.6 };

/** axis-aligned boxes the player cannot walk through */
export interface Box { minX: number; maxX: number; minZ: number; maxZ: number; h?: number }
const T = 0.12;
const wall = (x0: number, x1: number, z0: number, z1: number): Box => ({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1), h: WALL_H });
export const COLLIDERS: Box[] = [
  // outer walls (front wall has the glass entrance doors in the middle)
  wall(BOUNDS.minX, BOUNDS.maxX, BOUNDS.minZ - T, BOUNDS.minZ + T), wall(BOUNDS.minX - T, BOUNDS.minX + T, BOUNDS.minZ, BOUNDS.maxZ),
  wall(BOUNDS.maxX - T, BOUNDS.maxX + T, BOUNDS.minZ, BOUNDS.maxZ), wall(BOUNDS.minX, -1.6, BOUNDS.maxZ - T, BOUNDS.maxZ + T), wall(1.6, BOUNDS.maxX, BOUNDS.maxZ - T, BOUNDS.maxZ + T),
  wall(-1.6, 1.6, BOUNDS.maxZ + 1.2, BOUNDS.maxZ + 1.4),
  // manager office: glass east wall, south wall with a door
  wall(-8 - T / 2, -8 + T / 2, -11, -3.5), wall(-16, ROOMS.manager.doorX[0], -3.5 - T / 2, -3.5 + T / 2), wall(ROOMS.manager.doorX[1], -8, -3.5 - T / 2, -3.5 + T / 2),
  // meeting room: glass west wall, south wall with a door
  wall(7 - T / 2, 7 + T / 2, -11, -2.5), wall(7, ROOMS.meeting.doorX[0], -2.5 - T / 2, -2.5 + T / 2), wall(ROOMS.meeting.doorX[1], 16, -2.5 - T / 2, -2.5 + T / 2),
  // furniture
  ...Object.values(DESKS).map(d => ({ minX: d.x - .95, maxX: d.x + .95, minZ: d.z - .45, maxZ: d.z + .45, h: .78 })),
  { minX: MANAGER_DESK.x - 1.1, maxX: MANAGER_DESK.x + 1.1, minZ: MANAGER_DESK.z - .5, maxZ: MANAGER_DESK.z + .5, h: .78 },
  { minX: MEETING_TABLE.x - MEETING_TABLE.w / 2, maxX: MEETING_TABLE.x + MEETING_TABLE.w / 2, minZ: MEETING_TABLE.z - MEETING_TABLE.d / 2, maxZ: MEETING_TABLE.z + MEETING_TABLE.d / 2, h: .76 },
  { minX: 9, maxX: 13.4, minZ: 7.9, maxZ: 9.1, h: .8 },            // sofa
  { minX: 13.9, maxX: 15.1, minZ: 4.6, maxZ: 7.9, h: .8 },         // side sofa
  { minX: 10.3, maxX: 12.3, minZ: 5.7, maxZ: 6.7, h: .45 },        // coffee table
  { minX: 15.3, maxX: 15.9, minZ: 3.4, maxZ: 4.4, h: 1.6 },        // coffee machine
  { minX: -15.9, maxX: -12.5, minZ: 7.6, maxZ: 9.2, h: 1 },        // reception desk
];

/** walking graph for the agents */
export const NODES: Record<string, Vec2> = {
  c0: { x: -9.8, z: 2.2 }, a_research: { x: -6, z: 2.2 }, a_designer: { x: -3, z: 2.2 }, a_developer: { x: 0, z: 2.2 }, a_qa: { x: 3, z: 2.2 }, c5: { x: 6, z: 2.2 }, c6: { x: 8.8, z: 2.2 },
  desk_research: { x: -6, z: .95 }, desk_designer: { x: -3, z: .95 }, desk_developer: { x: 0, z: .95 }, desk_qa: { x: 3, z: .95 },
  md_out: { x: -9.8, z: -2.6 }, md_in: { x: -9.8, z: -4.6 }, m_app: { x: -12, z: -5.6 }, m_seat: { x: -12, z: -6.7 },
  mt_out: { x: 8.8, z: -1.6 }, mt_in: { x: 8.8, z: -3.6 }, mt_sw: { x: 8.6, z: -4.6 }, mt_w: { x: 8.6, z: -6.5 }, mt_nw: { x: 8.6, z: -8.6 },
  mt_n: { x: 11.5, z: -8.6 }, mt_ne: { x: 14.9, z: -8.6 }, mt_e: { x: 14.9, z: -6.5 }, mt_se: { x: 14.9, z: -4.6 }, mt_s: { x: 11.5, z: -4.6 },
  seat0: { x: 14.25, z: -6.5 }, seat1: { x: 10.1, z: -5.2 }, seat2: { x: 11.5, z: -5.2 }, seat3: { x: 12.9, z: -5.2 }, seat4: { x: 10.1, z: -7.8 }, seat5: { x: 11.5, z: -7.8 }, seat6: { x: 12.9, z: -7.8 },
  wb: { x: 12.5, z: -1.3 }, lh: { x: 10, z: 2.8 }, l0: { x: 10.4, z: 4.9 }, l1: { x: 12.6, z: 4.6 }, l2: { x: 9.3, z: 6.4 },
};
const E: [string, string][] = [
  ["c0", "a_research"], ["a_research", "a_designer"], ["a_designer", "a_developer"], ["a_developer", "a_qa"], ["a_qa", "c5"], ["c5", "c6"],
  ["a_research", "desk_research"], ["a_designer", "desk_designer"], ["a_developer", "desk_developer"], ["a_qa", "desk_qa"],
  ["c0", "md_out"], ["md_out", "md_in"], ["md_in", "m_app"], ["m_app", "m_seat"],
  ["c6", "mt_out"], ["mt_out", "mt_in"], ["mt_in", "mt_sw"], ["mt_sw", "mt_w"], ["mt_w", "mt_nw"], ["mt_nw", "mt_n"], ["mt_n", "mt_ne"], ["mt_ne", "mt_e"], ["mt_e", "mt_se"], ["mt_se", "mt_s"], ["mt_s", "mt_sw"],
  ["mt_e", "seat0"], ["mt_s", "seat1"], ["mt_s", "seat2"], ["mt_s", "seat3"], ["mt_n", "seat4"], ["mt_n", "seat5"], ["mt_n", "seat6"],
  ["mt_out", "wb"], ["c6", "wb"], ["c6", "lh"], ["lh", "l0"], ["lh", "l1"], ["lh", "l2"],
];
export const EDGES: Record<string, string[]> = {};
for (const [a, b] of E) { (EDGES[a] ??= []).push(b); (EDGES[b] ??= []).push(a); }

export function placeNode(p: Place): string {
  switch (p.kind) {
    case "desk": return p.agent === "manager" ? "m_seat" : "desk_" + p.agent;
    case "meeting": return "seat" + p.seat;
    case "manager-office": return "m_seat";
    case "whiteboard": return "wb";
    case "lounge": return "l" + (p.spot % 3);
  }
}
/** which way an agent faces when it arrives (radians around y; 0 faces +z) */
export function placeYaw(p: Place): number {
  switch (p.kind) {
    case "desk": case "manager-office": return Math.PI;
    case "whiteboard": return Math.PI;
    case "meeting": { const s = NODES["seat" + p.seat]; return Math.atan2(MEETING_TABLE.x - s.x, MEETING_TABLE.z - s.z); }
    case "lounge": return [Math.PI * .75, -Math.PI * .6, Math.PI * .35][p.spot % 3];
  }
}
export const isSeated = (p: Place) => p.kind === "desk" || p.kind === "meeting" || p.kind === "manager-office";

/** things the player and the mouse can use */
export type InteractableKind = "computer" | "whiteboard" | "meeting" | "manager";
export interface Interactable { id: string; kind: InteractableKind; label: string; at: Vec2; agent?: AgentId }
export const INTERACTABLES: Interactable[] = [
  ...(Object.entries(DESKS) as [AgentId, { x: number; z: number }][]).map(([a, d]) => ({ id: "pc_" + a, kind: "computer" as const, label: "Computer", at: { x: d.x, z: d.z + 1.4 }, agent: a })),
  { id: "pc_manager", kind: "computer", label: "Computer", at: { x: MANAGER_DESK.x, z: MANAGER_DESK.z + 1.5 }, agent: "manager" },
  { id: "whiteboard", kind: "whiteboard", label: "Whiteboard", at: { x: WHITEBOARD.x, z: WHITEBOARD.z + 1.2 } },
  { id: "meeting", kind: "meeting", label: "Meeting room", at: { x: 8.8, z: -3.2 } },
  { id: "manager", kind: "manager", label: "Manager office", at: { x: -9.8, z: -3.1 } },
];
