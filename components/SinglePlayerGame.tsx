"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { answerFeedback, revealLetter } from "@/lib/game";
import { makeQuestionSet, seededRandom } from "@/lib/questions";
import { saveScore } from "@/lib/leaderboard";

type Rival = { name: string; score: number; question: number; connected: boolean };
type Props = { name: string; onFinish: () => void; onExit?: () => void; online?: boolean; rivals?: Rival[]; questionSeed?: string };
const MAIN_SECONDS = 240;

export function SinglePlayerGame({ name, onFinish, onExit, online = false, rivals = [], questionSeed }: Props) {
  const set = useMemo(() => makeQuestionSet(questionSeed ? seededRandom(questionSeed) : Math.random), [questionSeed]);
  const [index, setIndex] = useState(0), [score, setScore] = useState(0), [mainTime, setMainTime] = useState(MAIN_SECONDS);
  const [revealed, setRevealed] = useState<number[]>([]), [answering, setAnswering] = useState(false), [deadline, setDeadline] = useState<number | null>(null);
  const [guess, setGuess] = useState(""), [message, setMessage] = useState(""), [correct, setCorrect] = useState(0), [wrong, setWrong] = useState(0), [passed, setPassed] = useState(0);
  const [finished, setFinished] = useState(false), [saved, setSaved] = useState(false), [now, setNow] = useState(Date.now());
  const input = useRef<HTMLInputElement>(null), advancing = useRef(false), question = set[index], value = question ? Array.from(question.answer).length * 100 - revealed.length * 100 : 0;

  const next = (result: "correct" | "wrong" | "revealed" | "passed") => {
    if (advancing.current) return;
    advancing.current = true;
    if (result === "correct") { setScore((s) => s + value); setCorrect((c) => c + 1); }
    if (result === "wrong") { setScore((s) => s - value); setWrong((w) => w + 1); }
    if (result === "passed") setPassed((count) => count + 1);
    setTimeout(() => { if (index + 1 >= set.length) setFinished(true); else { setIndex((i) => i + 1); setRevealed([]); setAnswering(false); setDeadline(null); setGuess(""); setMessage(""); advancing.current = false; } }, 800);
  };
  const beginAnswer = () => {
    if (answering || advancing.current || finished) return;
    const current = Date.now();
    setNow(current);
    setAnswering(true);
    setDeadline(current + 15_000);
  };

  useEffect(() => { const timer = setInterval(() => { setNow(Date.now()); if (!answering && !finished) setMainTime((t) => Math.max(0, t - 1)); }, 1000); return () => clearInterval(timer); }, [answering, finished]);
  useEffect(() => { if (mainTime === 0 && !finished) setFinished(true); }, [mainTime, finished]);
  useEffect(() => { if (deadline && now >= deadline && !finished) { setDeadline(null); setMessage(`Bilemedi · ${question.answer}`); next("wrong"); } }, [now, deadline, finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (answering) input.current?.focus(); }, [answering]);
  useEffect(() => { if (finished && !saved) { saveScore({ name, score, correct, playedAt: Date.now(), mode: online ? "multiplayer" : "single" }); setSaved(true); } }, [finished, saved, name, score, correct, online]);

  if (finished) return <section className="game-results mx-auto max-w-2xl p-8 text-center"><p className="stage-eyebrow mx-auto w-fit">Yarışma tamamlandı</p><h2 className="mt-7 text-6xl font-black text-white md:text-7xl">{score.toLocaleString("tr-TR")}<small className="ml-3 text-xl tracking-widest text-red-300">PUAN</small></h2><div className="mt-8 grid grid-cols-3 gap-3"><Stat label="Bilinen" value={correct}/><Stat label="Bilemedi" value={wrong}/><Stat label="Pas" value={passed}/></div><button onClick={onFinish} className="stage-action stage-answer mt-9 px-8 py-3">ANA MENÜ</button></section>;
  if (!question) return null;
  const answerTime = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : 15;
  return <section className={`game-stage mx-auto max-w-7xl p-5 md:p-8 ${answering ? "is-answering" : ""}`}>
    <header className="game-topbar"><div>{online && onExit && <button type="button" onClick={onExit} className="stage-exit">← LOBİYE DÖN</button>}<p className="stage-eyebrow">{online ? "CANLI ONLINE" : "TEK OYUNCULU"}</p><h2 className="mt-2 text-xl font-black uppercase tracking-wide text-white">{name} <span className="text-white/35">·</span> Soru {index + 1}<span className="text-white/40">/{set.length}</span></h2></div><div className="flex gap-3"><Stat label="PUAN" value={score}/><Stat label={answering ? "CEVAP" : "SÜRE"} value={answering ? answerTime : `${Math.floor(mainTime / 60)}:${String(mainTime % 60).padStart(2,"0")}`}/></div></header>
    <div className="stage-layout mt-6"><div>
    <div className="stage-question"><p className="text-xs font-black uppercase tracking-[.18em] text-white/65">{Array.from(question.answer).length} harf{question.origin !== "Doğrulanacak" && <> · {question.origin}</>} · {question.difficulty}</p><p className="mt-3 text-xl font-bold leading-snug text-white md:text-2xl">{question.clue}</p></div>
    <div className="stage-letters" aria-label="Cevap modunu açan harf kutuları">{Array.from(question.answer).map((letter, i) => <button type="button" key={i} onClick={beginAnswer} disabled={answering} aria-label={`${i + 1}. harf kutusu; cevap vermek için seç`} title="Cevap vermek için tıkla" className={`stage-letter ${revealed.includes(i) ? "is-open" : ""}`}>{revealed.includes(i) ? letter : ""}</button>)}</div>
    <p className="stage-value">{value}<small> PUAN</small></p>
    {message && <p role="status" className={`mt-5 text-center font-black ${message === "Doğru cevap" ? "text-teal-300" : "text-rose-300"}`}>{message}</p>}
    {answering ? <form onSubmit={(e) => { e.preventDefault(); const feedback = answerFeedback(guess, question.answer); setMessage(feedback); if (feedback === "Doğru cevap") { setDeadline(null); next("correct"); } else setGuess(""); }} className="stage-answer-form"><input ref={input} value={guess} onChange={(e) => setGuess(e.target.value)} aria-label="Cevabın" placeholder="CEVABINI YAZ"/><button className="stage-action stage-answer">GÖNDER</button></form> : <div className="stage-actions"><button onClick={() => { setMessage("Pas geçildi"); next("passed"); }} className="stage-action stage-pass">PAS</button><button disabled={revealed.length === Array.from(question.answer).length} onClick={() => { const opened = revealLetter(question.answer, revealed); setRevealed(opened); if (opened.length === Array.from(question.answer).length) { setMessage(`Kelime tamamlandı · ${question.answer}`); next("revealed"); } }} className="stage-action stage-reveal">HARF LÜTFEN</button><button onClick={beginAnswer} className="stage-action stage-answer">CEVAPLA</button></div>}
    </div><LiveStats name={name} question={index + 1} total={set.length} score={score} rivals={rivals}/></div>
  </section>;
}

function LiveStats({ name, question, total, score, rivals }: { name: string; question: number; total: number; score: number; rivals: Rival[] }) {
  return <aside className="stage-rivals">
    <div className="flex items-center justify-between border-b border-white/10 pb-3"><h3 className="font-black uppercase tracking-wider text-white">Canlı Sıralama</h3><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_12px_#f87171]"/></div>
    <div className="stage-player is-current">
      <div className="flex justify-between"><b>{name}</b><span className="text-xs font-black text-[#218b6b]">OYNUYOR</span></div>
      <div className="mt-2 flex justify-between text-sm"><span>Soru {question}/{total}</span><b>{score} puan</b></div>
      <div className="mt-3 h-2 overflow-hidden border border-black bg-[#f3eedf]"><div className="h-full bg-[#1e63d5]" style={{ width: `${(question / total) * 100}%` }}/></div>
    </div>
    {rivals.map((rival) => <div key={rival.name} className="stage-player"><div className="flex items-center justify-between"><b>{rival.name}</b><span className={`h-2 w-2 rounded-full ${rival.connected ? "bg-emerald-400" : "bg-slate-500"}`}/></div><div className="mt-1 flex justify-between text-xs"><span>Soru {rival.question}/{total}</span><b>{rival.score} puan</b></div></div>)}
    {!rivals.length && <p className="mt-4 text-xs leading-relaxed text-white/80">Online yarışmada rakiplerin soru ve puan bilgileri burada canlı görünür.</p>}
  </aside>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stage-stat"><p>{label}</p><strong>{value}</strong></div>; }
