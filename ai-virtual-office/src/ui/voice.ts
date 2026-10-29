import type { AgentId, Lang } from "../types";

/** Browser speech, used only where the browser supports it; text chat always keeps working. */
type SR = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };
const SRClass = (): (new () => SR) | null => (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition ?? null;

export const canListen = () => !!SRClass();
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function listen(lang: Lang, onText: (text: string, final: boolean) => void, onEnd: (error?: string) => void): () => void {
  const C = SRClass(); if (!C) { onEnd("unsupported"); return () => {}; }
  const r = new C(); r.lang = lang === "uz" ? "uz-UZ" : "en-US"; r.interimResults = true; r.continuous = false;
  r.onresult = e => { const res = e.results[e.results.length - 1]; onText(Array.from(res).map(x => x.transcript).join(""), res.isFinal); };
  r.onerror = e => onEnd(e.error); r.onend = () => onEnd();
  try { r.start(); } catch { onEnd("start-failed"); }
  return () => { try { r.stop(); } catch { /* already stopped */ } };
}

const PITCH: Record<AgentId, number> = { manager: .9, research: 1.15, designer: 1.25, developer: 1, qa: .95 };
/** speak an agent's reply; Uzbek voices are rare, so fall back to Turkish (close Latin pronunciation), then the default */
export function speak(text: string, lang: Lang, agent: AgentId, onStart: () => void, onEnd: () => void) {
  if (!canSpeak()) { onEnd(); return; }
  const synth = window.speechSynthesis; synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[✅"«»]/g, ""));
  const voices = synth.getVoices(), pick = (p: string) => voices.find(v => v.lang.toLowerCase().startsWith(p));
  const v = lang === "uz" ? pick("uz") ?? pick("tr") ?? pick("en") : pick("en");
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === "uz" ? "uz-UZ" : "en-US";
  u.pitch = PITCH[agent]; u.rate = 1.04;
  u.onstart = onStart; u.onend = onEnd; u.onerror = onEnd;
  synth.speak(u);
}
