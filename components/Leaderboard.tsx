"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { consolidateScores, loadScores, type ScoreEntry } from "@/lib/leaderboard";

export function Leaderboard() {
  const remote = useQuery(api.leaderboard.top, { limit: 100 });
  const [local, setLocal] = useState<ScoreEntry[]>([]);
  useEffect(() => setLocal(loadScores()), []);
  const rows = useMemo(() => consolidateScores([...local, ...(remote ?? []).map((row) => ({ name: row.username, score: row.score, correct: row.correct, playedAt: row.createdAt, mode: row.mode } satisfies ScoreEntry))]), [local, remote]);
  return <div className="panel p-6"><p className="brand-kicker text-xs font-black uppercase">Rekorlar</p><h2 className="brand-title mt-4 text-5xl">Lider Tablosu</h2><p className="mt-3 text-sm text-slate-400">Her oyuncunun cihazlar arasındaki en iyi skoru</p><div className="mt-6 space-y-3">{rows.length ? rows.slice(0, 10).map((row, index) => <div key={row.name.toLocaleLowerCase("tr")} className={`flex items-center rounded-2xl border border-[#d8d0c1] p-3 shadow-[0_5px_14px_rgba(49,41,24,.07)] ${index === 0 ? "bg-[#f8dfa0]" : "bg-white"}`}><b className="w-11 text-xl">#{index + 1}</b><span className="flex-1 font-black uppercase">{row.name}</span><span className="text-sm">{row.correct} doğru</span><b className="ml-4 text-lg text-[#e84a34]">{row.score}</b></div>) : <p className="rounded-2xl border border-dashed border-[#b9ad99] p-6 text-center text-slate-500">{remote === undefined ? "Skorlar yükleniyor…" : "İlk skor seni bekliyor."}</p>}</div></div>;
}
