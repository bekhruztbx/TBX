import * as THREE from "three";
import { AGENTS, STATUS_COLOR, STATUS_LABEL } from "../data/agents";
import type { AgentState, Project, Task } from "../types";

/** canvas-drawn textures: no image files, so the build stays self-contained */
export function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d")!; draw(c);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  if (!repeat) { tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; }   // live screens are re-uploaded often: skip mipmaps
  if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(...repeat); }
  return tex;
}
const rnd = (s: number) => { const x = Math.sin(s * 91.37 + 7.1) * 43758.5453; return x - Math.floor(x); };

export function floorTexture() {
  return canvasTexture(512, 512, c => {
    c.fillStyle = "#262b38"; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(255,255,255,${rnd(i) * .025})`; c.fillRect(rnd(i * 3) * 512, rnd(i * 7) * 512, 2, 2); }
    c.strokeStyle = "rgba(255,255,255,.06)"; c.lineWidth = 2; c.strokeRect(1, 1, 510, 510);
  }, [16, 11]);
}
export function carpetTexture(col: string) {
  return canvasTexture(256, 256, c => {
    c.fillStyle = col; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(0,0,0,${rnd(i) * .12})`; c.fillRect(rnd(i * 5) * 256, rnd(i * 11) * 256, 1.5, 1.5); }
  }, [3, 3]);
}
export function skylineTexture() {
  return canvasTexture(2048, 512, c => {
    const g = c.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, "#0b1030"); g.addColorStop(.55, "#1d1b4a"); g.addColorStop(1, "#3a2a5c"); c.fillStyle = g; c.fillRect(0, 0, 2048, 512);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(255,255,255,${.3 + rnd(i) * .7})`; c.fillRect(rnd(i * 2) * 2048, rnd(i * 4) * 220, 1.6, 1.6); }
    let x = 0, k = 0;
    while (x < 2048) {
      const w = 50 + rnd(k) * 110, h = 120 + rnd(k * 3) * 300; k++;
      c.fillStyle = ["#0e1124", "#121633", "#0b0e1f"][k % 3]; c.fillRect(x, 512 - h, w, h);
      for (let wy = 512 - h + 10; wy < 500; wy += 14) for (let wx = x + 6; wx < x + w - 6; wx += 11) if (rnd(wx * 1.3 + wy) > .58) { c.fillStyle = rnd(wx + wy * 2) > .8 ? "#ffd27a" : "#9fc3ff"; c.globalAlpha = .55 + rnd(wx * wy) * .45; c.fillRect(wx, wy, 5, 7); c.globalAlpha = 1; }
      x += w + 4;
    }
  });
}
export function signTexture(text: string, sub: string) {
  return canvasTexture(1024, 256, c => {
    c.fillStyle = "#0d1018"; c.fillRect(0, 0, 1024, 256);
    c.fillStyle = "#f08a5d"; c.beginPath(); c.arc(110, 128, 46, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#0d1018"; c.font = "800 52px Inter, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("AI", 110, 130);
    c.textAlign = "left"; c.fillStyle = "#f4f1ea"; c.font = "800 78px Inter, sans-serif"; c.fillText(text, 190, 110);
    c.fillStyle = "#8b93a7"; c.font = "500 34px Inter, sans-serif"; c.fillText(sub, 192, 182);
  });
}

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 3) {
  const words = text.split(" "); let line = "", n = 0;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (c.measureText(test).width > maxW && line) { c.fillText(n === maxLines - 1 ? line + "…" : line, x, y + n * lh); n++; line = w; if (n >= maxLines) return; } else line = test;
  }
  if (line && n < maxLines) c.fillText(line, x, y + n * lh);
}

/** a desk monitor: the agent's status, current task and progress */
export function drawScreen(c: CanvasRenderingContext2D, a: AgentState, task: Task | null) {
  const W = c.canvas.width, H = c.canvas.height, p = AGENTS[a.id], col = STATUS_COLOR[a.status];
  c.fillStyle = "#0b0f19"; c.fillRect(0, 0, W, H);
  c.fillStyle = p.color; c.fillRect(0, 0, W, 10);
  c.fillStyle = "#e8ecf4"; c.font = "700 34px Inter, sans-serif"; c.fillText(`${p.name} · ${p.title.replace(" Agent", "")}`, 24, 58);
  c.fillStyle = col; c.beginPath(); c.arc(W - 40, 46, 11, 0, Math.PI * 2); c.fill();
  c.font = "600 22px Inter, sans-serif"; c.textAlign = "right"; c.fillText(STATUS_LABEL[a.status].toUpperCase(), W - 62, 54); c.textAlign = "left";
  c.fillStyle = "#9aa3b5"; c.font = "500 24px Inter, sans-serif"; wrap(c, task ? task.title : a.action, 24, 104, W - 48, 30, 2);
  if (task) {
    c.fillStyle = "#1e2433"; c.fillRect(24, H - 70, W - 48, 18); c.fillStyle = col; c.fillRect(24, H - 70, (W - 48) * a.progress, 18);
    c.fillStyle = "#e8ecf4"; c.font = "600 22px JetBrains Mono, monospace"; c.fillText(`${Math.round(a.progress * 100)}%`, 24, H - 22);
    c.fillStyle = "#6b7488"; c.font = "500 20px JetBrains Mono, monospace"; c.textAlign = "right"; c.fillText(a.action.slice(0, 30), W - 24, H - 22); c.textAlign = "left";
  } else {
    // code-ish idle lines
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#243049" : "#1b2438"; c.fillRect(24, 170 + i * 26, 120 + ((i * 97) % 220), 12); }
  }
}

/** the whiteboard: to do / doing / done, one sticky note per task */
export function drawBoard(c: CanvasRenderingContext2D, project: Project | null, tasks: Task[]) {
  const W = c.canvas.width, H = c.canvas.height;
  c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#1c2230"; c.font = "800 44px Inter, sans-serif"; c.fillText(project ? project.title.slice(0, 44) : "Project board", 34, 64);
  const pr = project?.progress ?? 0;
  c.fillStyle = "#dfe3ea"; c.fillRect(34, 86, W - 68, 16); c.fillStyle = "#f08a5d"; c.fillRect(34, 86, (W - 68) * pr, 16);
  c.fillStyle = "#5b6475"; c.font = "600 24px Inter, sans-serif"; c.textAlign = "right"; c.fillText(`${Math.round(pr * 100)}%  ·  ${project ? project.status.toUpperCase() : "IDLE"}`, W - 34, 64); c.textAlign = "left";
  const cols: [string, Task[]][] = [["TO DO", tasks.filter(t => t.status === "queued")], ["DOING", tasks.filter(t => t.status === "running" || t.status === "blocked" || t.status === "error")], ["DONE", tasks.filter(t => t.status === "done")]];
  const cw = (W - 68) / 3;
  cols.forEach(([name, list], i) => {
    const x = 34 + i * cw;
    c.fillStyle = "#8a93a6"; c.font = "700 22px Inter, sans-serif"; c.fillText(`${name} (${list.length})`, x + 6, 140);
    list.slice(0, 5).forEach((t, k) => {
      const y = 156 + k * 70; c.fillStyle = AGENTS[t.assignee].color; c.globalAlpha = .9; c.fillRect(x + 4, y, cw - 18, 60); c.globalAlpha = 1;
      c.fillStyle = "#151821"; c.font = "600 19px Inter, sans-serif"; wrap(c, t.title, x + 14, y + 25, cw - 40, 21, 2);
    });
  });
}
