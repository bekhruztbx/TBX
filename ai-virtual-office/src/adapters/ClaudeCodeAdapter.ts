import type { Activity, AgentId, AgentState, Lang, Message, Project, Task, TimelineEvent } from "../types";
import type { AgentAdapter, AgentEventSink } from "./types";

/**
 * Live adapter (not used by the demo). It listens to a small local "bridge" over WebSocket and forwards
 * its events into the office unchanged, so the 3D scene and panels work the same as in the simulation.
 *
 * The bridge is not part of this repo yet. The plan for it:
 *  - Claude Code hooks (SubagentStart / SubagentStop / PreToolUse / PostToolUse / Notification) POST
 *    JSON to the bridge; or the bridge runs `claude -p --output-format stream-json` itself.
 *  - The bridge maps each sub-agent to one of the office roles and sends lines like
 *      {"type":"agent","id":"developer","patch":{"status":"working","action":"Editing src/Login.tsx"}}
 *      {"type":"task","task":{...Task}}   {"type":"message","message":{...Message}}
 *      {"type":"activity","activity":{...Activity}}   {"type":"project","project":{...Project}}
 *  - Commands go back the same socket: {"cmd":"start","brief":"..."}, {"cmd":"assign",...}, {"cmd":"ask",...}.
 * Open the app with ?adapter=claude&ws=ws://localhost:8787 to use it.
 */
type Inbound =
  | { type: "agent"; id: AgentId; patch: Partial<AgentState> } | { type: "task"; task: Task } | { type: "message"; message: Message }
  | { type: "activity"; activity: Activity } | { type: "project"; project: Project | null } | { type: "timeline"; event: TimelineEvent }
  | { type: "reply"; requestId: string; text: string } | { type: "reset" };

export class ClaudeCodeAdapter implements AgentAdapter {
  readonly kind = "claude-code" as const;
  readonly label = "Claude Code (live bridge)";
  private ws: WebSocket | null = null; private t0 = performance.now();
  private waiting = new Map<string, (s: string) => void>();
  constructor(private url: string) {}

  connect(sink: AgentEventSink, initial: Record<AgentId, AgentState>) {
    for (const [id, a] of Object.entries(initial)) sink.agent(id as AgentId, a);
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = ev => {
      let m: Inbound; try { m = JSON.parse(String(ev.data)); } catch { return; }
      switch (m.type) {
        case "agent": sink.agent(m.id, m.patch); break;
        case "task": sink.task(m.task); break;
        case "message": sink.message(m.message); break;
        case "activity": sink.activity(m.activity); break;
        case "project": sink.project(m.project); break;
        case "timeline": sink.timeline(m.event); break;
        case "reset": sink.reset(); break;
        case "reply": this.waiting.get(m.requestId)?.(m.text); this.waiting.delete(m.requestId); break;
      }
    };
  }
  disconnect() { this.ws?.close(); this.ws = null; }
  now() { return (performance.now() - this.t0) / 1000; }
  private send(o: object) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(o)); }
  startProject(brief: string) { this.send({ cmd: "start", brief }); }
  assignTask(agent: AgentId, title: string) { this.send({ cmd: "assign", agent, title }); }
  setPaused(agent: AgentId, paused: boolean) { this.send({ cmd: paused ? "pause" : "resume", agent }); }
  setSpeed() { /* real agents run in real time */ }
  setLang(lang: Lang) { this.send({ cmd: "lang", lang }); }
  ask(agent: AgentId, text: string): Promise<string> {
    const requestId = Math.random().toString(36).slice(2);
    this.send({ cmd: "ask", agent, text, requestId });
    return new Promise(res => { this.waiting.set(requestId, res); setTimeout(() => { if (this.waiting.delete(requestId)) res("(no answer from the bridge)"); }, 30000); });
  }
}
