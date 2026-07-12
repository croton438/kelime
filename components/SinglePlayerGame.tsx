"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { answerFeedback, revealLetter } from "@/lib/game";
import { makeQuestionSet, seededRandom } from "@/lib/questions";
import { saveScore } from "@/lib/leaderboard";

type Rival = {
  name: string;
  score: number;
  question: number;
  connected: boolean;
};
type FeedbackState = "correct" | "wrong" | "passed" | "revealed" | null;
type Props = {
  name: string;
  onFinish: () => void;
  onExit?: () => void;
  onProgress?: (progress: {
    question: number;
    score: number;
    finished: boolean;
  }) => void;
  online?: boolean;
  rivals?: Rival[];
  questionSeed?: string;
};
type SavedGame = {
  index: number;
  score: number;
  mainTime: number;
  revealed: number[];
  answering: boolean;
  deadline: number | null;
  correct: number;
  wrong: number;
  passed: number;
  savedAt: number;
};
const MAIN_SECONDS = 240;

function loadSavedGame(key: string): SavedGame | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null") as SavedGame | null;
  } catch {
    return null;
  }
}

export function SinglePlayerGame({
  name,
  onFinish,
  onExit,
  onProgress,
  online = false,
  rivals = [],
  questionSeed,
}: Props) {
  const set = useMemo(
    () =>
      makeQuestionSet(questionSeed ? seededRandom(questionSeed) : Math.random),
    [questionSeed],
  );
  const storageKey = useMemo(
    () =>
      `kelime-oyunu-game:${questionSeed || `single:${name}`}:${name.toLocaleLowerCase("tr")}`,
    [questionSeed, name],
  );
  const restored = useMemo(() => loadSavedGame(storageKey), [storageKey]);
  const restoredTime = restored
    ? Math.max(
        0,
        restored.mainTime -
          (!restored.answering
            ? Math.floor((Date.now() - restored.savedAt) / 1000)
            : 0),
      )
    : MAIN_SECONDS;
  const [index, setIndex] = useState(restored?.index ?? 0),
    [score, setScore] = useState(restored?.score ?? 0),
    [mainTime, setMainTime] = useState(restoredTime);
  const [revealed, setRevealed] = useState<number[]>(restored?.revealed ?? []),
    [answering, setAnswering] = useState(restored?.answering ?? false),
    [deadline, setDeadline] = useState<number | null>(
      restored?.deadline ?? null,
    );
  const [guess, setGuess] = useState(""),
    [message, setMessage] = useState(""),
    [correct, setCorrect] = useState(restored?.correct ?? 0),
    [wrong, setWrong] = useState(restored?.wrong ?? 0),
    [passed, setPassed] = useState(restored?.passed ?? 0);
  const [finished, setFinished] = useState(false),
    [saved, setSaved] = useState(false),
    [now, setNow] = useState(Date.now()),
    [transitioning, setTransitioning] = useState(false),
    [feedbackState, setFeedbackState] = useState<FeedbackState>(null),
    [resultValue, setResultValue] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    advancing = useRef(false),
    question = set[index],
    value = question
      ? Array.from(question.answer).length * 100 - revealed.length * 100
      : 0;

  const next = (
    result: "correct" | "wrong" | "revealed" | "passed",
    delayMs = 800,
  ) => {
    if (advancing.current) return;
    advancing.current = true;
    setTransitioning(true);
    setAnswering(false);
    setFeedbackState(result);
    setResultValue(value);
    setRevealed(
      Array.from(
        { length: Array.from(question.answer).length },
        (_, position) => position,
      ),
    );
    if (result === "correct") {
      setScore((s) => s + value);
      setCorrect((c) => c + 1);
    }
    if (result === "wrong") {
      setScore((s) => s - value);
      setWrong((w) => w + 1);
    }
    if (result === "passed") setPassed((count) => count + 1);
    setTimeout(() => {
      if (index + 1 >= set.length) setFinished(true);
      else {
        setIndex((i) => i + 1);
        setRevealed([]);
        setAnswering(false);
        setDeadline(null);
        setGuess("");
        setMessage("");
        setFeedbackState(null);
        setResultValue(0);
        setTransitioning(false);
        advancing.current = false;
      }
    }, delayMs);
  };
  const beginAnswer = () => {
    if (answering || advancing.current || finished) return;
    const current = Date.now();
    setNow(current);
    setAnswering(true);
    setDeadline(current + 15_000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!answering && !transitioning && !finished)
        setMainTime((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [answering, transitioning, finished]);
  useEffect(() => {
    if (mainTime === 0 && !finished) setFinished(true);
  }, [mainTime, finished]);
  useEffect(() => {
    if (deadline && now >= deadline && !finished) {
      setDeadline(null);
      setRevealed(
        Array.from(
          { length: Array.from(question.answer).length },
          (_, position) => position,
        ),
      );
      setMessage(`Bilemedi · Doğru kelime: ${question.answer}`);
      next("wrong", 2000);
    }
  }, [now, deadline, finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (answering) input.current?.focus();
  }, [answering]);
  useEffect(() => {
    if (finished && !saved) {
      saveScore({
        name,
        score,
        correct,
        playedAt: Date.now(),
        mode: online ? "multiplayer" : "single",
      });
      setSaved(true);
    }
  }, [finished, saved, name, score, correct, online]);
  useEffect(() => {
    if (online && onProgress)
      onProgress({ question: Math.min(index + 1, 14), score, finished });
  }, [online, onProgress, index, score, finished]);
  useEffect(() => {
    if (!finished && !transitioning)
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          index,
          score,
          mainTime,
          revealed,
          answering,
          deadline,
          correct,
          wrong,
          passed,
          savedAt: Date.now(),
        } satisfies SavedGame),
      );
  }, [
    storageKey,
    index,
    score,
    mainTime,
    revealed,
    answering,
    deadline,
    correct,
    wrong,
    passed,
    finished,
    transitioning,
  ]);

  const finishAndLeave = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem("kelime-oyunu-active");
    onFinish();
  };

  if (finished)
    return (
      <section className="game-results mx-auto max-w-2xl p-8 text-center">
        <p className="stage-eyebrow mx-auto w-fit">Yarışma tamamlandı</p>
        <h2 className="mt-7 text-6xl font-black text-white md:text-7xl">
          {score.toLocaleString("tr-TR")}
          <small className="ml-3 text-xl tracking-widest text-red-300">
            PUAN
          </small>
        </h2>
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Bilinen" value={correct} />
          <Stat label="Bilemedi" value={wrong} />
          <Stat label="Pas" value={passed} />
        </div>
        <button
          onClick={finishAndLeave}
          className="stage-action stage-answer mt-9 px-8 py-3"
        >
          ANA MENÜ
        </button>
      </section>
    );
  if (!question) return null;
  const answerTime = deadline
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 15;
  return (
    <section
      className={`game-stage mx-auto max-w-7xl p-5 md:p-8 ${answering ? "is-answering" : ""} ${feedbackState ? `feedback-${feedbackState}` : ""}`}
    >
      <header className="game-topbar">
        <div>
          {online && onExit && (
            <button type="button" onClick={onExit} className="stage-exit">
              ← LOBİYE DÖN
            </button>
          )}
          <p className="stage-eyebrow">
            {online ? "CANLI ONLINE" : "TEK OYUNCULU"}
          </p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-wide text-white">
            {name} <span className="text-white/35">·</span> Soru {index + 1}
            <span className="text-white/40">/{set.length}</span>
          </h2>
        </div>
        <div className="flex gap-3">
          <Stat label="PUAN" value={score} />
          <Stat
            label={answering ? "CEVAP" : "SÜRE"}
            value={
              answering
                ? answerTime
                : `${Math.floor(mainTime / 60)}:${String(mainTime % 60).padStart(2, "0")}`
            }
          />
        </div>
      </header>
      {answering && deadline && (
        <div
          className={`answer-countdown ${answerTime <= 5 ? "is-urgent" : ""}`}
          role="timer"
          aria-live="assertive"
        >
          <span>CEVAP SÜRESİ</span>
          <strong>{answerTime}</strong>
          <small>SANİYE</small>
        </div>
      )}
      <div className="stage-layout mt-6">
        <div>
          <div className="stage-question">
            <p className="text-xs font-black uppercase tracking-[.18em] text-white/65">
              {Array.from(question.answer).length} harf
              {question.origin !== "Doğrulanacak" && <> · {question.origin}</>}{" "}
              · {question.difficulty}
            </p>
            <p className="mt-3 text-xl font-bold leading-snug text-white md:text-2xl">
              {question.clue}
            </p>
          </div>
          <div
            className="stage-letters"
            aria-label="Cevap modunu açan harf kutuları"
          >
            {Array.from(question.answer).map((letter, i) => (
              <button
                type="button"
                key={i}
                onClick={beginAnswer}
                disabled={answering || transitioning}
                aria-label={`${i + 1}. harf kutusu; cevap vermek için seç`}
                title="Cevap vermek için tıkla"
                style={{ animationDelay: `${i * 65}ms` }}
                className={`stage-letter ${revealed.includes(i) ? "is-open" : ""}`}
              >
                {revealed.includes(i) ? letter : ""}
              </button>
            ))}
          </div>
          <p className="stage-value">
            {transitioning ? resultValue : value}
            <small> PUAN</small>
          </p>
          {message && (
            <p role="status" className="stage-feedback-message">
              {message}
            </p>
          )}
          {!transitioning &&
            (answering ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const feedback = answerFeedback(guess, question.answer);
                  setMessage(feedback);
                  if (feedback === "Doğru cevap") {
                    setDeadline(null);
                    next("correct", 1800);
                  } else setGuess("");
                }}
                className="stage-answer-form"
              >
                <input
                  ref={input}
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  aria-label="Cevabın"
                  placeholder="CEVABINI YAZ"
                />
                <button className="stage-action stage-answer">GÖNDER</button>
              </form>
            ) : (
              <div className="stage-actions">
                <button
                  onClick={() => {
                    setRevealed(
                      Array.from(
                        { length: Array.from(question.answer).length },
                        (_, position) => position,
                      ),
                    );
                    setMessage(`Pas · Doğru kelime: ${question.answer}`);
                    next("passed", 2000);
                  }}
                  className="stage-action stage-pass"
                >
                  PAS
                </button>
                <button
                  disabled={
                    revealed.length === Array.from(question.answer).length
                  }
                  onClick={() => {
                    const opened = revealLetter(question.answer, revealed);
                    setRevealed(opened);
                    if (opened.length === Array.from(question.answer).length) {
                      setMessage(`Kelime tamamlandı · ${question.answer}`);
                      next("revealed", 3000);
                    }
                  }}
                  className="stage-action stage-reveal"
                >
                  HARF LÜTFEN
                </button>
                <button
                  onClick={beginAnswer}
                  className="stage-action stage-answer"
                >
                  CEVAPLA
                </button>
              </div>
            ))}
        </div>
        <LiveStats
          name={name}
          question={index + 1}
          total={set.length}
          score={score}
          rivals={rivals}
        />
      </div>
    </section>
  );
}

function LiveStats({
  name,
  question,
  total,
  score,
  rivals,
}: {
  name: string;
  question: number;
  total: number;
  score: number;
  rivals: Rival[];
}) {
  return (
    <aside className="stage-rivals">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="font-black uppercase tracking-wider text-white">
          Canlı Sıralama
        </h3>
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_12px_#f87171]" />
      </div>
      <div className="stage-player is-current">
        <div className="flex justify-between">
          <b>{name}</b>
          <span className="text-xs font-black text-[#218b6b]">OYNUYOR</span>
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>
            Soru {question}/{total}
          </span>
          <b>{score} puan</b>
        </div>
        <div className="mt-3 h-2 overflow-hidden border border-black bg-[#f3eedf]">
          <div
            className="h-full bg-[#1e63d5]"
            style={{ width: `${(question / total) * 100}%` }}
          />
        </div>
      </div>
      {rivals.map((rival) => (
        <div key={rival.name} className="stage-player">
          <div className="flex items-center justify-between">
            <b>{rival.name}</b>
            <span
              className={`h-2 w-2 rounded-full ${rival.connected ? "bg-emerald-400" : "bg-slate-500"}`}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span>
              Soru {rival.question}/{total}
            </span>
            <b>{rival.score} puan</b>
          </div>
        </div>
      ))}
      {!rivals.length && (
        <p className="mt-4 text-xs leading-relaxed text-white/80">
          Online yarışmada rakiplerin soru ve puan bilgileri burada canlı
          görünür.
        </p>
      )}
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stage-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
