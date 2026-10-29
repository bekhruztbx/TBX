import type { AgentId, AgentProfile } from "../types";

export const AGENT_IDS: AgentId[] = ["manager", "research", "designer", "developer", "qa"];

export const AGENTS: Record<AgentId, AgentProfile> = {
  manager: {
    id: "manager", name: "Sardor", title: "Manager Agent", color: "#f08a5d", hair: "#2b1d16", skin: "#e2b48f",
    bio: { uz: "Vazifani bo'laklarga bo'ladi, jamoaga taqsimlaydi va jarayonni boshqaradi.", en: "Splits the brief into work packages, assigns them and runs the project." },
  },
  research: {
    id: "research", name: "Malika", title: "Research Agent", color: "#2ec4b6", hair: "#3b2418", skin: "#f0c9a6",
    bio: { uz: "Ma'lumot izlaydi, raqobatchilarni tahlil qiladi, talablarni yozadi.", en: "Finds information, analyses competitors and writes the requirements." },
  },
  designer: {
    id: "designer", name: "Nilufar", title: "Designer Agent", color: "#ff6fae", hair: "#1c1414", skin: "#d9a582",
    bio: { uz: "Interfeys, wireframe va UI kit ustida ishlaydi.", en: "Works on the interface: wireframes, UI kit and screens." },
  },
  developer: {
    id: "developer", name: "Jasur", title: "Developer Agent", color: "#6c8cff", hair: "#141010", skin: "#c99572",
    bio: { uz: "Kod yozadi: sahifalar, API va funksiyalar.", en: "Writes the code: pages, APIs and features." },
  },
  qa: {
    id: "qa", name: "Bobur", title: "QA Agent", color: "#5fd38a", hair: "#4a3020", skin: "#e8bd98",
    bio: { uz: "Kodni tekshiradi, test yozadi va xatolarni topadi.", en: "Checks the code, writes tests and finds bugs." },
  },
};

export const STATUS_COLOR: Record<string, string> = {
  working: "#4ade80", thinking: "#facc15", idle: "#94a3b8", completed: "#38bdf8", error: "#f87171", paused: "#c084fc",
};
export const STATUS_LABEL: Record<string, string> = {
  working: "Working", thinking: "Thinking", idle: "Idle", completed: "Completed", error: "Error", paused: "Paused",
};
