// End-to-end check of every feature with real mouse / keyboard input.
// The app must be running (npm run build && npm run preview). It reads state through the ?debug hook and only
// writes to it to teleport the player and to keep one agent at the desk in Virtual Life.
//   npm i -D playwright && npx playwright install chromium
//   node tests/e2e.cjs            (APP_URL=http://localhost:5173/ node tests/e2e.cjs for the dev server)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const APP = process.env.APP_URL || "http://localhost:4173/";
const OUT = path.join(__dirname, "..", "test-results") + path.sep; fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name, pass, info = "") => { results.push(pass); console.log((pass ? "PASS " : "FAIL ") + name + (info ? "  | " + info : "")); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on("pageerror", e => errs.push("PAGEERROR " + e.message)); p.on("console", m => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });
  const get = expr => p.evaluate(`(() => { const s = window.__debug.store.getState(); return (${expr}); })()`);
  const until = (expr, ms = 60000) => p.waitForFunction(`(() => { const s = window.__debug.store.getState(); return !!(${expr}); })()`, null, { timeout: ms, polling: 250 }).then(() => true, () => false);
  const screen = (x, y, z) => p.evaluate(([x, y, z]) => { const c = window.__debug.camera; const v = c.position.clone().set(x, y, z).project(c); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }, [x, y, z]);
  const click3d = async (x, y, z) => { const s = await screen(x, y, z); if (s.x < 0 || s.y < 0 || s.x > 1440 || s.y > 900) console.log('   (off screen', JSON.stringify(s), ')'); await p.mouse.click(s.x, s.y); await sleep(400); };
  const tp = (x, z, yaw) => p.evaluate(([x, z, yaw]) => { const pl = window.__debug.player; pl.pos.set(x, 0, z); pl.vel.set(0, 0, 0); pl.yaw = yaw; }, [x, z, yaw]);
  const ppos = () => p.evaluate(() => { const q = window.__debug.player.pos; return { x: q.x, y: q.y, z: q.z }; });
  const hold = async (keys, ms) => { for (const k of keys) await p.keyboard.down(k); await sleep(ms); for (const k of [...keys].reverse()) await p.keyboard.up(k); await sleep(300); };
  const shot = n => p.screenshot({ path: OUT + n, timeout: 60000 });

  await p.goto(APP + "?debug");
  await p.waitForFunction(() => window.__debug, null, { timeout: 30000 }); await sleep(2500);
  // record every place each agent visits during the run
  await p.evaluate(() => { window.__seen = {}; setInterval(() => { const a = window.__debug.store.getState().agents; for (const id in a) (window.__seen[id] ??= new Set()).add(a[id].place.kind); }, 200); });

  console.log("\n== 1. Start screen");
  ok("Demo Mode badge visible", await p.getByText("Demo Mode · simulated agents").isVisible());
  ok("simulation adapter active", (await get("s.adapter.kind")) === "simulation");
  for (const n of ["Sardor", "Malika", "Nilufar", "Jasur", "Bobur"]) ok(`agent ${n} listed`, await p.getByText(n, { exact: true }).first().isVisible());
  for (const l of ["Active Agents", "Running Tasks", "Completed Tasks", "Project Progress", "Agents · activity", "Task timeline", "Agent communication"]) ok(`dashboard: ${l}`, await p.getByText(l, { exact: true }).first().isVisible());

  console.log("\n== 2. 3D rooms are clickable (overview, initial camera)");
  for (const t of ["Left panel", "Right panel"]) if (await get(t === "Left panel" ? "s.leftOpen" : "s.rightOpen")) await p.getByTitle(t).click();
  await sleep(600);
  await click3d(12.5, 1.6, -2.28); ok("click the whiteboard -> project board", (await get("s.modal")) === "whiteboard");
  await shot("a2_board.png");
  await p.keyboard.press("Escape"); await sleep(1200); ok("Esc closes the window", (await get("s.modal")) === null);
  await click3d(12, 0, -9); ok("click the meeting room -> transcript", (await get("s.modal")) === "meeting"); await p.keyboard.press("Escape"); await sleep(1200);
  await click3d(-11, 0, -5); ok("click the manager office -> all tasks", (await get("s.modal")) === "manager"); await p.keyboard.press("Escape"); await sleep(1200);

  await p.getByTitle("Left panel").click(); await sleep(400);
  console.log("\n== 2b. Camera orbit / zoom (mouse)");
  const cam = () => p.evaluate(() => { const c = window.__debug.camera.position; return { x: c.x, y: c.y, z: c.z, d: Math.hypot(c.x + .5, c.y, c.z + 1.8) }; });
  let c0 = await cam(); await p.mouse.move(720, 330); await p.mouse.down(); await p.mouse.move(900, 340, { steps: 8 }); await p.mouse.up(); await sleep(2500);
  let c1 = await cam(); ok("drag rotates the camera", Math.hypot(c1.x - c0.x, c1.z - c0.z) > .5, `moved ${Math.hypot(c1.x - c0.x, c1.z - c0.z).toFixed(2)} m`);
  await p.mouse.move(720, 330); await p.mouse.wheel(0, 700); await sleep(3000);
  let c2 = await cam(); ok("wheel zooms the camera", c2.d > c1.d + .5, `distance ${c1.d.toFixed(1)} -> ${c2.d.toFixed(1)}`);

  console.log("\n== 3. Start a project from the input panel");
  await p.getByRole("button", { name: "2×", exact: true }).click();
  await p.locator("textarea").fill("Create a modern e-commerce website.");
  await p.locator('button:has-text("Start")').first().click();
  ok("Manager receives the task (planning)", await until("s.project && s.project.status === 'planning'", 8000), await get("s.project && s.project.title"));
  ok("task split into sub-tasks", await until("s.tasks.length >= 5", 30000), `${await get("s.tasks.length")} tasks: ` + (await get("s.tasks.map(t => t.assignee + ':' + t.title).join(' / ')")));
  ok("team goes to the meeting", await until("s.project.status === 'meeting'", 30000));
  ok("all 5 agents seated in the meeting room", await until("Object.values(s.agents).every(a => a.place.kind === 'meeting' && !a.move)", 60000));
  ok("Manager is at the table when the kickoff starts", await until("s.messages.some(m => m.kind === 'meeting')", 60000) && (await get("s.agents.manager.place.kind === 'meeting' && !s.agents.manager.move")));
  const m0 = await get("s.messages.length"); await sleep(3000); const m1 = await get("s.messages.length");
  ok("messages arrive one after another", m1 > m0, `${m0} -> ${m1}`);
  ok("meeting messages in the feed", (await get("s.messages.filter(m => m.kind === 'meeting').length")) > 0);
  await shot("a1_meeting.png");

  console.log("\n== 4. 3D objects are clickable (overview)");
  for (const t of ["Left panel", "Right panel"]) if (await get(t === "Left panel" ? "s.leftOpen" : "s.rightOpen")) await p.getByTitle(t).click();
  await sleep(600);
  await click3d(-6, 1.25, -.22); ok("click a computer -> that agent's task panel", (await get("s.selected + '/' + s.tab")) === "research/tasks", await get("s.selected + '/' + s.tab"));
  await p.evaluate(() => window.__debug.store.getState().select(null));
  await p.getByRole("button", { name: "1×", exact: true }).click();   // normal speed for the hands-on part
  console.log("\n== 5. Agents work; click an agent; panel actions");
  ok("project running", await until("s.project.status === 'running'", 60000));
  ok("developer back at the desk", await until("s.agents.developer.place.kind === 'desk' && !s.agents.developer.move", 90000));
  for (const y of [.95, 1.15, .8]) { if ((await get("s.selected")) === "developer") break; await click3d(0, y, 1.0); }
  ok("click the 3D agent -> agent panel", (await get("s.selected")) === "developer");
  ok("panel shows status + current task + progress", await p.getByText("Current task").isVisible(), `status=${await get("s.agents.developer.status")} task="${await get("(s.tasks.find(t => t.id === s.agents.developer.taskId) || {}).title")}" ${Math.round(await get("s.agents.developer.progress") * 100)}%`);
  await shot("a3_agent.png");
  await p.getByRole("button", { name: "Pause", exact: true }).click(); await sleep(700);
  ok("Pause", (await get("s.agents.developer.paused && s.agents.developer.status === 'paused'")));
  await p.getByRole("button", { name: "Resume", exact: true }).click(); await sleep(700);
  ok("Resume", !(await get("s.agents.developer.paused")), `status=${await get("s.agents.developer.status")}`);
  await p.getByRole("button", { name: "Assign Task", exact: true }).click(); await sleep(400);
  await p.getByPlaceholder("Task title").fill("Write unit tests for checkout"); await p.getByRole("button", { name: "Assign", exact: true }).click(); await sleep(800);
  ok("Assign Task -> new task in the store", await get("s.tasks.some(t => t.assignee === 'developer' && t.origin === 'user' && t.title.includes('unit tests'))"));
  ok("assigning opens the agent's task list", (await get("s.tab")) === "tasks");
  await p.evaluate(() => window.__debug.store.getState().select("developer", "overview")); await sleep(300);
  await p.getByRole("button", { name: "View Activity", exact: true }).click(); await sleep(300);
  ok("View Activity tab", (await get("s.tab")) === "activity", `${await get("s.activity.filter(a => a.agent === 'developer').length")} log lines`);
  await p.evaluate(() => window.__debug.store.getState().select("developer", "overview")); await sleep(300);
  await p.getByRole("button", { name: "View Tasks", exact: true }).click(); await sleep(400);
  ok("View Tasks tab lists the assigned task", (await get("s.tab")) === "tasks" && await p.getByText("Write unit tests for checkout").first().isVisible());
  for (const tab of ["Comms", "Results"]) { await p.getByRole("button", { name: tab, exact: true }).click(); await sleep(300); ok(`${tab} tab`, (await get("s.tab")) === tab.toLowerCase()); }

  console.log("\n== 6. Chat (Talk button)");
  await p.evaluate(() => window.__debug.store.getState().select("developer", "overview")); await sleep(300);
  await p.getByRole("button", { name: "Talk", exact: true }).click(); await sleep(500);
  ok("Talk opens the chat", (await get("s.chatWith")) === "developer");
  ok("chat shows the Demo Mode note", await p.getByText(/demo/i).nth(1).isVisible());
  const ask = async q => { const n = await get("(s.chats.developer || []).length"); const i = p.locator("form input"); await i.fill(q); await i.press("Enter"); await until(`(s.chats.developer || []).length >= ${n + 2} && !s.typing`, 15000); return get("s.chats.developer[s.chats.developer.length - 1].text"); };
  let r = await ask("Developer, hozir nima qilyapsan?"); ok("uz: what are you doing", /%|ishla/i.test(r), r);
  r = await ask("Qanday muammolar bor?"); ok("uz: problems", r.length > 10, r);
  r = await ask("What are you working on right now?"); ok("en: what are you doing (English reply)", /\b(I'm|I am|working|queue|waiting|done)\b/i.test(r) && !/ishla|tayyor\./.test(r), r);
  const before = await get("s.tasks.filter(t => t.assignee === 'developer').length");
  r = await ask("Developer, pricing sahifasini yarat."); await sleep(800);
  ok("order in chat -> real task", (await get("s.tasks.filter(t => t.assignee === 'developer').length")) > before && await get("s.tasks.some(t => t.assignee === 'developer' && /pricing/i.test(t.title))"), r);
  await p.getByTitle("Voice").click(); await sleep(2500);
  const note = await p.locator("form").locator("xpath=..").innerText();
  ok("mic button: no crash, text chat still works", !errs.some(e => e.startsWith("PAGEERROR")), (note.match(/(Voice[^\n]*|Mikrofon[^\n]*|Bu brauzerda[^\n]*|Tinglayapman…)/) || ["(listening)"])[0]);
  await shot("a4_chat.png");
  await p.keyboard.press("Escape"); await sleep(400); ok("Esc closes the chat", (await get("s.chatWith")) === null);

  console.log("\n== 7. Virtual Life");
  await p.getByRole("button", { name: "Virtual Life", exact: true }).click(); await sleep(3000);
  ok("mode switch with camera flight", (await get("s.mode")) === "life" && await p.evaluate(() => window.__debug.camera.position.distanceTo(window.__debug.player.pos) < 7));
  await tp(-5, 9, Math.PI / 2); await sleep(500); let a = await ppos(); await hold(["w"], 2500); let bpos = await ppos(); const walk = bpos.x - a.x;
  ok("W walks forward", walk > .5, `${walk.toFixed(2)} m`);
  await tp(-5, 9, Math.PI / 2); await sleep(500); a = await ppos(); await hold(["Shift", "w"], 2500); bpos = await ppos(); const run = bpos.x - a.x;
  ok("Shift runs faster", run > walk * 1.4, `${run.toFixed(2)} m vs ${walk.toFixed(2)} m`);
  await tp(-5, 9, Math.PI / 2); await sleep(400); a = await ppos(); await hold(["d"], 1800); bpos = await ppos(); ok("A/D strafe sideways", Math.abs(bpos.z - a.z) > .3, `dz ${(bpos.z - a.z).toFixed(2)}`);
  await tp(-3, 7, Math.PI); await sleep(400); await p.keyboard.press("Space", { delay: 20 }); let maxY = 0; for (let i = 0; i < 12; i++) { maxY = Math.max(maxY, (await ppos()).y); await sleep(150); }
  ok("Space jumps", maxY > .4, `peak ${maxY.toFixed(2)} m`);
  const mx0 = await p.evaluate(() => window.__debug.player.yaw); await p.mouse.move(700, 450); await p.mouse.down(); await p.mouse.move(820, 450, { steps: 6 }); await p.mouse.up(); await sleep(400);
  await p.evaluate(() => document.exitPointerLock && document.exitPointerLock()); await p.evaluate(() => window.__debug.store.getState().setMenu(false));
  ok("mouse turns the view", Math.abs((await p.evaluate(() => window.__debug.player.yaw)) - mx0) > .05);
  await tp(-14, 5, -Math.PI / 2); await sleep(400); await hold(["w"], 3500); let w = await ppos(); ok("wall collision", w.x > -15.62 && w.x < -15, `x = ${w.x.toFixed(2)} (wall at -16)`);
  await tp(3, -1.5, 0); await sleep(400); await hold(["w"], 3000); w = await ppos(); ok("desk collision", w.z < -.6, `z = ${w.z.toFixed(2)} (desk edge -0.45)`);
  ok("developer seated for the agent tests", await until("s.agents.developer.place.kind === 'desk' && !s.agents.developer.move", 60000));
  await p.evaluate(() => { const s = window.__debug.store.getState(); if (!s.agents.developer.paused) s.togglePause("developer"); });   // keep Jasur at the desk while we test
  console.log("   project status during Virtual Life:", await get("s.project.status"));
  await tp(0, 2.7, Math.PI); await sleep(400); await hold(["w"], 3000); w = await ppos(); const gap = Math.hypot(w.x, w.z - .95); ok("agent collision (cannot walk into Jasur)", gap > .55, `player (${w.x.toFixed(2)}, ${w.z.toFixed(2)}), ${gap.toFixed(2)} m from Jasur's seat (0, 0.95)`);
  await sleep(600); ok('"Press E to Talk" prompt', await p.getByText("Press E to Talk to").isVisible(), (await p.getByText("Press E to Talk to").innerText()).replace(/\s+/g, " "));
  await shot("a5_presse.png");
  await p.keyboard.press("e"); await sleep(500); ok("E opens the chat with that agent", (await get("s.chatWith")) === "developer");
  r = await ask("Salom! Natijalar qanday?"); ok("chat in Virtual Life", r.length > 10, r);
  await p.keyboard.press("Escape"); await sleep(400);
  await p.evaluate(() => window.__debug.store.getState().togglePause("developer"));
  const useAt = async (x, z, kind, modal) => { for (let i = 0; i < 6; i++) { await tp(x, z, Math.PI); await sleep(700); if ((await get("s.nearby && s.nearby.kind")) === kind) break; await sleep(2500); }
    const k = await get("s.nearby && s.nearby.kind"); await p.keyboard.press("e"); await sleep(500); const got = await get(modal ? "s.modal" : "s.selected + '/' + s.tab"); if (await get("s.modal || s.chatWith")) { await p.keyboard.press("Escape"); await sleep(1200); } return [k, got]; };
  let [k, got] = await useAt(12.5, -1.0, "whiteboard", true); ok("E at the whiteboard", got === "whiteboard", `nearby=${k}`);
  [k, got] = await useAt(8.8, -3.2, "meeting", true); ok("E at the meeting room", got === "meeting", `nearby=${k}`);
  [k, got] = await useAt(-9.8, -3.1, "manager", true); ok("E at the manager office", got === "manager", `nearby=${k}`);
  const free = await get("['research','designer','developer','qa'].find(id => s.agents[id].place.kind !== 'desk')");
  if (free) { const dx = { research: -6, designer: -3, developer: 0, qa: 3 }[free]; [k, got] = await useAt(dx, 1.5, "computer", false); ok(`E at ${free}'s computer -> task panel`, got === `${free}/tasks`, `nearby=${k}`); }
  else console.log("SKIP computer in Virtual Life: every agent is at the desk right now (tested by click above)");
  await p.keyboard.press("Escape"); await sleep(500); ok("Esc opens the menu", await get("s.menuOpen") && await p.getByText("Back to Overview").isVisible());
  await p.getByRole("button", { name: "Switch to 1st person" }).click(); await sleep(1200);
  ok("1st person camera at the head", (await get("s.cam")) === "first" && await p.evaluate(() => { const pl = window.__debug.player.pos; return window.__debug.camera.position.distanceTo(pl.clone().setY(pl.y + 1.62)) < .25; }));
  await shot("a6_first.png");
  await p.keyboard.press("Escape"); await sleep(300); if (await get("s.menuOpen")) await p.getByRole("button", { name: "Resume", exact: true }).click();
  await p.keyboard.press("v"); await sleep(800); ok("V switches back to 3rd person", (await get("s.cam")) === "third");
  await p.keyboard.press("Escape"); await sleep(400); await p.getByRole("button", { name: "Back to Overview" }).click(); await sleep(2500);
  ok("Back to Overview", (await get("s.mode")) === "overview");

  console.log("\n== 8. Project completes");
  await p.getByRole("button", { name: "4×", exact: true }).click();
  ok("project Completed", await until("s.project.status === 'completed'", 300000), `progress ${Math.round(await get("s.project.progress") * 100)}%`);
  ok("all tasks done", await get("s.tasks.every(t => t.status === 'done')"), await get("s.tasks.filter(t => t.status === 'done').length + '/' + s.tasks.length"));
  ok("every agent spoke in the feed", (await get("new Set(s.messages.map(m => m.from)).size")) >= 5);
  ok("timeline filled", (await get("s.timeline.length")) > 5, `${await get("s.timeline.length")} events`);
  const seen = await p.evaluate(() => Object.fromEntries(Object.entries(window.__seen).map(([k, v]) => [k, [...v]])));
  ok("agents moved between places", Object.values(seen).every(v => v.length >= 2), JSON.stringify(seen));
  await p.getByTitle("Left panel").click(); await sleep(600); await shot("a7_done.png");
  await p.getByRole("button", { name: "EN", exact: true }).click(); await sleep(400); ok("UZ/EN switch", (await get("s.lang")) === "en");

  console.log("\n== 9. Phone (390x844, touch)");
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })).newPage();
  m.on("pageerror", e => errs.push("PAGEERROR(m) " + e.message));
  await m.goto(APP + "?debug"); await m.waitForFunction(() => window.__debug, null, { timeout: 30000 }); await sleep(2000);
  const mget = e => m.evaluate(`(() => { const s = window.__debug.store.getState(); return (${e}); })()`);
  ok("panels start closed on a phone", !(await mget("s.leftOpen || s.rightOpen")));
  await m.getByTitle("Left panel").tap(); await sleep(500); await m.getByTitle("Right panel").tap(); await sleep(500);
  ok("only one side panel at a time", (await mget("s.rightOpen && !s.leftOpen")));
  await m.getByTitle("Right panel").tap(); await sleep(300);
  await m.getByRole("button", { name: "Virtual Life", exact: true }).tap(); await sleep(2500);
  ok("touch controls in Virtual Life", await m.getByText("JUMP", { exact: true }).isVisible());
  await m.screenshot({ path: OUT + "a8_phone.png", timeout: 60000 });

  console.log("\n== errors: " + (errs.length ? errs.slice(0, 8).join("\n") : "none"));
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · screenshots in ${OUT}`);
  process.exitCode = results.every(Boolean) && !errs.length ? 0 : 1;
  await b.close();
})();
