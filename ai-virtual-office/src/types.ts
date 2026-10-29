export type AgentId = "manager" | "research" | "developer" | "designer" | "qa";
export type AgentRole = AgentId;
export type AgentStatus = "working" | "thinking" | "idle" | "completed" | "error" | "paused";
export type Lang = "uz" | "en";

/** where an agent is (or is heading) in the office */
export type Place =
  | { kind: "desk"; agent: AgentId }
  | { kind: "meeting"; seat: number }
  | { kind: "manager-office" }
  | { kind: "whiteboard" }
  | { kind: "lounge"; spot: number };

export interface Vec2 { x: number; z: number }

export interface AgentProfile {
  id: AgentId;
  name: string;
  title: string;
  color: string;      // hoodie / accent
  hair: string;
  skin: string;
  bio: { uz: string; en: string };
}

/** a walk the 3D layer plays back on the sim clock */
export interface Movement { path: Vec2[]; startT: number; duration: number; to: Place }

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  place: Place;
  move: Movement | null;
  taskId: string | null;
  progress: number;            // 0..1 of the current task
  action: string;              // what it is doing right now, one line
  paused: boolean;
  busySeconds: number;         // time spent working (for the activity chart)
  doneCount: number;
}

export type TaskStatus = "queued" | "running" | "blocked" | "done" | "error";
export interface Task {
  id: string;
  title: string;
  assignee: AgentId;
  status: TaskStatus;
  progress: number;
  dependsOn: string[];
  steps: string[];
  duration: number;            // sim seconds of work
  result?: string;
  origin: "plan" | "user" | "fix";
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
}

export type MessageKind = "chat" | "handoff" | "status" | "alert" | "meeting" | "system";
export interface Message {
  id: string;
  t: number;
  from: AgentId | "user" | "system";
  to?: AgentId | "all" | "user";
  text: string;
  kind: MessageKind;
}

export type ActivityLevel = "info" | "success" | "warn" | "error";
export interface Activity { id: string; t: number; agent: AgentId; text: string; level: ActivityLevel }

export type ProjectStatus = "idle" | "planning" | "meeting" | "running" | "review" | "completed";
export interface Project { id: string; title: string; status: ProjectStatus; startedAt: number; finishedAt?: number; progress: number }

export interface TimelineEvent { id: string; t: number; label: string; agent?: AgentId; kind: "start" | "plan" | "meeting" | "task" | "done" | "error" | "complete" | "user" }

export interface ChatLine { id: string; from: "user" | AgentId; text: string; t: number }
