export type ScoreEntry = { name: string; score: number; correct: number; playedAt: number; mode: "single" | "multiplayer" };
export const LEADERBOARD_KEY = "harf-meydani-leaderboard-v1";
const normalizedName = (name: string) => name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");

export function consolidateScores(entries: ScoreEntry[]) {
  const best = new Map<string, ScoreEntry>();
  for (const entry of entries) {
    const key = normalizedName(entry.name);
    const current = best.get(key);
    if (!current || entry.score > current.score || (entry.score === current.score && entry.correct > current.correct)) best.set(key, entry);
  }
  return [...best.values()].sort((a, b) => b.score - a.score || b.correct - a.correct || a.playedAt - b.playedAt).slice(0, 100);
}

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try { const rows = consolidateScores(JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]") as ScoreEntry[]); localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(rows)); return rows; } catch { return []; }
}
export function saveScore(entry: ScoreEntry) { const rows = consolidateScores([...loadScores(), entry]); localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(rows)); return rows; }
