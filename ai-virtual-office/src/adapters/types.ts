import type { Activity, AgentId, AgentState, Lang, Message, Project, Task, TimelineEvent } from "../types";

/** Everything the office shows comes in through these events. The UI and the 3D scene never care
 *  whether a simulation or real Claude Code agents are behind them. */
export interface AgentEventSink {
  agent(id: AgentId, patch: Partial<AgentState>): void;
  task(task: Task): void;                       // insert or replace by id
  message(msg: Message): void;
  activity(entry: Activity): void;
  project(project: Project | null): void;
  timeline(ev: TimelineEvent): void;
  reset(): void;
}

export interface AgentAdapter {
  readonly kind: "simulation" | "claude-code";
  /** shown in the UI, so viewers always know what they are looking at */
  readonly label: string;
  connect(sink: AgentEventSink, initial: Record<AgentId, AgentState>): void;
  disconnect(): void;
  /** seconds on the adapter's clock (the 3D scene plays walks back on it) */
  now(): number;
  startProject(brief: string): void;
  assignTask(agent: AgentId, title: string): void;
  setPaused(agent: AgentId, paused: boolean): void;
  ask(agent: AgentId, text: string): Promise<string>;
  setSpeed(x: number): void;
  setLang(lang: Lang): void;
}
