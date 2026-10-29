# AI Virtual Office

A 3D virtual office where AI agents take a big task, split it up, talk to each other and work at their desks, and where you can walk in and talk to them.

> **Demo Mode.** This first version runs a built-in simulation. The UI always says so: there's a "Demo Mode · simulated agents" badge and a notice in every chat. Nothing on screen is real Claude activity. The adapter layer is ready for a live Claude Code connection (see below).

## Run it

```bash
cd ai-virtual-office
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the build on http://localhost:4173
```

You need Node 18+ and a browser with WebGL.

## What you can do

**Overview mode**
- Drag to orbit, scroll to zoom, right-drag to pan.
- Click an agent to open its panel. The camera flies to it.
- Click a monitor to see that agent's tasks.
- Click the whiteboard for the project board, the meeting room for the kickoff transcript, and the manager office for the task list.

**Start a project**
- Type a task, for example *Create a modern e-commerce website.*, and press **Start**.
- What happens next:
  1. The Manager reads the brief and breaks it into work packages.
  2. Everyone walks to the meeting room for a kickoff, where the Manager assigns the work.
  3. The agents go back to their desks and work in dependency order.
  4. Along the way, an agent hits an error and fixes it, and QA finds a bug and hands it to the Developer.
  5. The Manager runs a final review and the project ends as **Completed**.
- Speed: 1× / 2× / 4×. Language of the agents' messages: UZ / EN.

**Agent panel**
- Tabs: Overview, Tasks, Activity, Comms, Results.
- Actions:
  - **Talk**;
  - **View Tasks**;
  - **View Activity**;
  - **Assign Task**: the task shows up in the dashboard and in the 3D office at the same time;
  - **Pause / Resume**.

**Virtual Life mode**
- Click **Virtual Life**. The camera flies down behind your avatar.

| Key | Action |
|---|---|
| W A S D | walk |
| Shift | run |
| Space | jump |
| Mouse | look (click the scene to capture the mouse) |
| E | talk to the agent in front of you, or use a computer, the whiteboard, the meeting room or the manager office |
| V | switch between 3rd and 1st person |
| Esc | menu |

- Walls and furniture block you. You can jump over low furniture.
- On touch screens you get a joystick, a look area, and Run, Jump and E buttons.

**Chat and voice**
- You can type freely. Replies come from the agent's actual simulated state: current task, progress, errors, bugs found, queue and dependencies.
- Replies follow your language. Uzbek and English are detected.
- Orders such as *"Developer, pricing sahifasini yarat."* or *"create a pricing page"* become real tasks in the agent's queue.
- **Mic button:** uses the browser's Speech Recognition where it is available. If it's unsupported or the microphone permission is refused, a note appears and text chat keeps working.
- **Speaker toggle:** reads replies aloud with the browser's text-to-speech. For Uzbek it uses an Uzbek voice if there is one, otherwise Turkish, otherwise English.

## Architecture

```
src/
  types.ts                 shared types (agents, tasks, messages, activity, project, timeline)
  data/agents.ts           the five agents (Sardor, Malika, Nilufar, Jasur, Bobur), status colors
  data/layout.ts           floor plan in metres: rooms, desks, colliders, walking graph, interactables
  adapters/types.ts        AgentAdapter + AgentEventSink: the only contract between "agents" and the UI
  adapters/SimulationAdapter.ts   the demo engine (tick-based; plans, meetings, walks, errors, bugs, review)
  adapters/ClaudeCodeAdapter.ts   live adapter skeleton (WebSocket bridge, see below)
  sim/planner.ts           brief -> work packages with dependencies (e-commerce, login, dashboard, landing, generic)
  sim/dialogue.ts          rule-based replies that read the simulated state (uz / en)
  sim/nav.ts               shortest paths on the walking graph, position along a path
  store/useOffice.ts       Zustand store; adapter events are batched into one update per tick
  three/                   React Three Fiber scene
    Scene.tsx              canvas, lights, camera rig (overview orbit, 3rd/1st person, fly-between transitions)
    Office.tsx             the office: desks with live monitors, glass rooms, whiteboard, lounge, skyline
    AgentActor.tsx         plays back an agent's walk on the adapter clock, picks a pose from its status, label + speech bubble
    Avatar.tsx             procedural low-poly person with walk / sit / type / think / talk / celebrate / error poses
    Player.tsx             your avatar: movement, jump, collisions, "Press E" detection
    StaticMerge.tsx        merges static furniture into a few draw calls
  ui/                      top bar, dashboard, panels, chat with voice, modals, HUD, touch controls
```

**One source of truth.** The adapter owns the agent model. Walks are sent as a path plus a start time, and the 3D scene plays them back on the adapter's clock. Statuses, positions, chat, the dashboard and the whiteboard can never disagree.

**Connecting real Claude Code agents.** Implement `AgentAdapter` and keep everything else as it is. `ClaudeCodeAdapter` already maps a simple JSON protocol to the office:
- `agent`, `task`, `message`, `activity`, `project` and `timeline` events come in;
- `start`, `assign`, `ask`, `pause` and `resume` commands go out.

It talks to a small local bridge over WebSocket. Open the app with `?adapter=claude&ws=ws://localhost:8787` to use it. **The bridge isn't built yet.** The plan:
- Claude Code hooks (`SubagentStart` / `SubagentStop`, `PreToolUse` / `PostToolUse`, `Notification`) or `claude -p --output-format stream-json` feed it;
- it maps each sub-agent to an office role.

## Known limits of the demo
- Agent replies are rules over the simulated state, not a language model.
- Agents walk through each other (there is no crowd avoidance), and you walk through agents.
- Voice input depends on the browser: Chrome and Edge support it, Firefox does not. Embedded previews may block the microphone.
