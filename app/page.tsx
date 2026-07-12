"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { SinglePlayerGame } from "@/components/SinglePlayerGame";
import { Leaderboard } from "@/components/Leaderboard";

type Screen = "home" | "single" | "join" | "lobby" | "multi" | "leaders";
type LobbyView = NonNullable<ReturnType<typeof useLobbyShape>>;
function useLobbyShape() {
  return null as null | {
    _id: Id<"lobbies">;
    code: string;
    hostUserId: Id<"users">;
    status: "waiting" | "playing" | "finished";
    capacity: number;
    members: Array<{
      _id: Id<"lobbyMembers">;
      userId: Id<"users">;
      username: string;
      connected: boolean;
      order: number;
      currentQuestion?: number;
      score?: number;
      finished?: boolean;
    }>;
  };
}

const cleanCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
const getSessionId = () => {
  let id = localStorage.getItem("kelime-oyunu-session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kelime-oyunu-session", id);
  }
  return id;
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home"),
    [name, setName] = useState(""),
    [lobbyCode, setLobbyCode] = useState(""),
    [singleSeed, setSingleSeed] = useState("");
  const [userId, setUserId] = useState<Id<"users"> | null>(null),
    [error, setError] = useState(""),
    [manualLobbyReturn, setManualLobbyReturn] = useState(false);
  const lobby = useQuery(
    api.lobbies.getByCode,
    lobbyCode.length === 6 ? { code: lobbyCode } : "skip",
  );
  const ensureGuest = useMutation(api.users.ensureGuest),
    createLobby = useMutation(api.lobbies.create),
    joinLobby = useMutation(api.lobbies.join),
    startLobby = useMutation(api.lobbies.start),
    leaveLobby = useMutation(api.lobbies.leave),
    updateProgress = useMutation(api.lobbies.updateProgress),
    recordScore = useMutation(api.leaderboard.record);

  useEffect(() => {
    const saved = localStorage.getItem("kelime-oyunu-player") || "";
    setName(saved);
    let active: { mode?: string; seed?: string; code?: string } = {};
    try {
      active = JSON.parse(localStorage.getItem("kelime-oyunu-active") || "{}");
    } catch {}
    const code = cleanCode(
      new URLSearchParams(location.search).get("oda") || active.code || "",
    );
    if (active.mode === "single" && active.seed) {
      setSingleSeed(active.seed);
      setScreen("single");
    } else if (code.length === 6) {
      setLobbyCode(code);
      setScreen("join");
    }
  }, []);
  useEffect(() => {
    if (lobbyCode && lobby && name && !userId)
      void ensureGuest({ sessionId: getSessionId(), username: name })
        .then(setUserId)
        .catch(() => undefined);
  }, [lobbyCode, lobby, name, userId, ensureGuest]);
  useEffect(() => {
    if (
      !lobby ||
      !userId ||
      !lobby.members.some((member) => member.userId === userId)
    )
      return;
    if (lobby.status === "playing" && !manualLobbyReturn) {
      localStorage.setItem(
        "kelime-oyunu-active",
        JSON.stringify({ mode: "online", code: lobby.code }),
      );
      setScreen("multi");
    } else if (screen === "join") setScreen("lobby");
  }, [lobby, userId, manualLobbyReturn, screen]);

  const establishUser = async () => {
    const clean = name.trim().slice(0, 20);
    if (clean.length < 2) throw new Error("Oyuncu adı 2–20 karakter olmalı.");
    localStorage.setItem("kelime-oyunu-player", clean);
    setName(clean);
    const id = await ensureGuest({
      sessionId: getSessionId(),
      username: clean,
    });
    setUserId(id);
    return { id, clean };
  };
  const createOnlineLobby = async () => {
    try {
      setError("");
      const user = await establishUser();
      const result = await createLobby({
        userId: user.id,
        username: user.clean,
      });
      setLobbyCode(result.code);
      localStorage.setItem(
        "kelime-oyunu-active",
        JSON.stringify({ mode: "lobby", code: result.code }),
      );
      history.replaceState(null, "", `/?oda=${result.code}`);
      setManualLobbyReturn(false);
      setScreen("lobby");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lobi oluşturulamadı.");
    }
  };
  const enterLobby = async () => {
    try {
      setError("");
      if (lobbyCode.length !== 6)
        throw new Error("Oda kodu 6 karakter olmalı.");
      if (lobby === undefined)
        throw new Error("Oda kontrol ediliyor, tekrar deneyin.");
      if (lobby === null) throw new Error("Bu kodla oluşturulmuş bir oda yok.");
      if (lobby.status !== "waiting")
        throw new Error("Bu odadaki oyun başlamış veya bitmiş.");
      const user = await establishUser();
      await joinLobby({
        lobbyId: lobby._id,
        userId: user.id,
        username: user.clean,
      });
      localStorage.setItem(
        "kelime-oyunu-active",
        JSON.stringify({ mode: "lobby", code: lobby.code }),
      );
      history.replaceState(null, "", `/?oda=${lobby.code}`);
      setManualLobbyReturn(false);
      setScreen("lobby");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Odaya katılınamadı.");
    }
  };
  const reportProgress = useCallback(
    (progress: { question: number; score: number; finished: boolean }) => {
      if (lobby?._id && userId)
        void updateProgress({
          lobbyId: lobby._id,
          userId,
          currentQuestion: progress.question,
          score: progress.score,
          finished: progress.finished,
        }).catch(() => undefined);
    },
    [lobby?._id, userId, updateProgress],
  );
  const reportScore = useCallback((result: { score: number; correct: number; wrong: number; mode: "single" | "multiplayer" }) => { void recordScore({ sessionId: getSessionId(), score: result.score, correct: result.correct, wrong: result.wrong, lettersTaken: 0, mode: result.mode }).catch(() => undefined); }, [recordScore]);
  const exitOnlineToHome = useCallback(() => { if (lobby?._id && userId) void leaveLobby({ lobbyId: lobby._id, userId }); localStorage.removeItem("kelime-oyunu-active"); history.replaceState(null, "", "/"); setLobbyCode(""); setScreen("home"); }, [lobby?._id, userId, leaveLobby]);

  if (screen === "single" && singleSeed)
    return (
      <main className="min-h-screen px-4 py-8">
        <SinglePlayerGame
          name={name}
          questionSeed={singleSeed}
          onHome={() => setScreen("home")}
          onScore={reportScore}
          onFinish={() => setScreen("home")}
        />
      </main>
    );
  if (screen === "multi" && lobby && userId)
    return (
      <main className="min-h-screen px-4 py-8">
        <SinglePlayerGame
          name={name}
          online
          questionSeed={`online:${lobby.code}`}
          rivals={lobby.members
            .filter((member) => member.userId !== userId)
            .map((member) => ({
              name: member.username,
              score: member.score ?? 0,
              question: member.currentQuestion ?? 1,
              connected: member.connected,
            }))}
          onProgress={reportProgress}
          onScore={reportScore}
          onHome={exitOnlineToHome}
          onExit={() => {
            setManualLobbyReturn(true);
            setScreen("lobby");
          }}
          onFinish={() => setScreen("home")}
        />
      </main>
    );
  if (screen === "leaders")
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
        <button
          onClick={() => setScreen("home")}
          className="mb-5 text-sm text-teal-300"
        >
          ← Ana menü
        </button>
        <Leaderboard />
      </main>
    );
  if (screen === "join")
    return (
      <JoinRoom
        name={name}
        setName={setName}
        code={lobbyCode}
        setCode={(code) => {
          setLobbyCode(cleanCode(code));
          setError("");
        }}
        error={error}
        checking={lobby === undefined && lobbyCode.length === 6}
        onBack={() => {
          history.replaceState(null, "", "/");
          setScreen("home");
        }}
        onJoin={enterLobby}
      />
    );
  if (screen === "lobby" && lobby && userId)
    return (
      <Lobby
        lobby={lobby as LobbyView}
        currentUserId={userId}
        onBack={async () => {
          await leaveLobby({ lobbyId: lobby._id, userId });
          localStorage.removeItem("kelime-oyunu-active");
          history.replaceState(null, "", "/");
          setLobbyCode("");
          setScreen("home");
        }}
        onResume={() => {
          setManualLobbyReturn(false);
          setScreen("multi");
        }}
        onStart={async () => {
          try {
            setError("");
            await startLobby({ lobbyId: lobby._id, requestingUserId: userId });
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Oyun başlatılamadı.",
            );
          }
        }}
        error={error}
      />
    );
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
      <section className="grid w-full gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="py-5">
          <p className="brand-kicker mb-5 text-xs font-black uppercase tracking-[.2em]">
            Canlı Türkçe kelime yarışması
          </p>
          <h1 className="brand-title text-7xl md:text-9xl">
            Kelime
            <br />
            <span>Oyunu</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg font-semibold leading-relaxed text-slate-300">
            Tek başına rekor kır veya 2–5 kişilik gerçek zamanlı lobide
            arkadaşlarına meydan oku.
          </p>
          <div className="mt-9 max-w-lg">
            <label
              htmlFor="name"
              className="text-xs font-black uppercase tracking-widest"
            >
              Oyuncu adın
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              placeholder="2–20 karakter"
              className="mt-2 w-full px-4 py-3 outline-none"
            />
            {error && <p className="mt-3 font-bold text-red-600">{error}</p>}
          </div>
        </div>
        <div className="panel grid gap-3 p-6 md:p-8">
          <Mode
            title="Tek Oyunculu"
            text="530 doğal sorudan seçilen 14 soruyla yarış."
            onClick={() => {
              try {
                const clean = name.trim().slice(0, 20);
                if (clean.length < 2) throw new Error("Oyuncu adı 2–20 karakter olmalı.");
                localStorage.setItem("kelime-oyunu-player", clean);
                setName(clean);
                const seed = `single:${crypto.randomUUID()}`;
                setSingleSeed(seed);
                localStorage.setItem(
                  "kelime-oyunu-active",
                  JSON.stringify({ mode: "single", seed }),
                );
                setScreen("single");
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Başlatılamadı.",
                );
              }
            }}
          />
          <Mode
            title="Lobi Oluştur"
            text="Gerçek zamanlı online bir oda oluştur."
            onClick={createOnlineLobby}
          />
          <Mode
            title="Lobiye Katıl"
            text="Var olan 6 karakterli oda koduyla katıl."
            onClick={() => {
              setError("");
              setScreen("join");
            }}
          />
          <button
            onClick={() => setScreen("leaders")}
            className="mt-2 border border-white/10 py-3 font-bold text-slate-300"
          >
            🏆 Lider Tablosu
          </button>
        </div>
      </section>
    </main>
  );
}

function Mode({
  title,
  text,
  onClick,
}: {
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="mode-card p-5 pr-14 text-left">
      <span className="text-xl font-black uppercase">{title}</span>
      <span className="mt-1 block text-sm text-slate-400">{text}</span>
    </button>
  );
}
function JoinRoom({
  name,
  setName,
  code,
  setCode,
  error,
  checking,
  onBack,
  onJoin,
}: {
  name: string;
  setName: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  error: string;
  checking: boolean;
  onBack: () => void;
  onJoin: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <section className="panel w-full p-7">
        <button onClick={onBack} className="text-sm text-teal-300">
          ← Ana menü
        </button>
        <p className="brand-kicker mt-7 text-xs font-black uppercase">
          Online oda
        </p>
        <h1 className="mt-4 text-3xl font-black">Lobiye Katıl</h1>
        <label className="mt-6 block text-xs font-black uppercase tracking-widest">
          Oyuncu adın
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={20}
          className="mt-2 w-full px-4 py-3"
        />
        <label className="mt-5 block text-xs font-black uppercase tracking-widest">
          6 karakterli oda kodu
        </label>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ABC123"
          className="mt-2 w-full px-4 py-3 text-center text-2xl font-black tracking-[.3em]"
        />
        {error && (
          <p className="mt-3 text-center font-bold text-red-600">{error}</p>
        )}
        <button
          disabled={checking || name.trim().length < 2 || code.length !== 6}
          onClick={onJoin}
          className="mt-6 w-full bg-amber-300 p-3 font-black disabled:opacity-40"
        >
          {checking ? "ODA KONTROL EDİLİYOR" : "ODAYA KATIL"}
        </button>
      </section>
    </main>
  );
}
function Lobby({
  lobby,
  currentUserId,
  onBack,
  onResume,
  onStart,
  error,
}: {
  lobby: LobbyView;
  currentUserId: Id<"users">;
  onBack: () => void;
  onResume: () => void;
  onStart: () => void;
  error: string;
}) {
  const isHost = lobby.hostUserId === currentUserId,
    invite =
      typeof window === "undefined"
        ? ""
        : `${location.origin}/?oda=${lobby.code}`;
  const copy = () => navigator.clipboard.writeText(invite);
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <button onClick={onBack} className="mb-5 text-sm text-teal-300">
        ← Lobiden ayrıl
      </button>
      <section className="panel p-6 md:p-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Online oda kodu
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-[.18em] text-amber-300">
              {lobby.code}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Oyuncular bu listeye gerçek zamanlı eklenir.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={copy}
                className="bg-[#eef3fc] px-4 py-2 text-sm font-black"
              >
                LİNKİ KOPYALA
              </button>
              <button
                onClick={() =>
                  navigator.share
                    ? navigator.share({
                        title: "Kelime Oyunu",
                        text: `Oda kodu: ${lobby.code}`,
                        url: invite,
                      })
                    : copy()
                }
                className="bg-[#eef8f3] px-4 py-2 text-sm font-black"
              >
                PAYLAŞ
              </button>
            </div>
          </div>
          <b className="rounded-full bg-teal-400/15 px-4 py-2 text-teal-300">
            {lobby.members.length}/{lobby.capacity} oyuncu
          </b>
        </header>
        <div className="mt-7 grid gap-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            {lobby.members.map((member, index) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-2xl border border-[#d8d0c1] bg-white p-3"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef8f3] font-black">
                  {index + 1}
                </span>
                <b className="flex-1">{member.username}</b>
                {member.userId === lobby.hostUserId && (
                  <small className="rounded-full bg-[#fff7db] px-3 py-1 font-black text-amber-300">
                    YÖNETİCİ
                  </small>
                )}
                <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-[#eef3fc] p-5">
            <h2 className="font-black">
              {isHost ? "Yarışmayı yönet" : "Yönetici bekleniyor"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              En az iki gerçek oyuncu katıldığında oyun başlayabilir.
            </p>
            {error && (
              <p className="mt-3 text-sm font-bold text-red-600">{error}</p>
            )}
            {lobby.status === "playing" ? (
              <button
                onClick={onResume}
                className="mt-6 w-full bg-amber-300 p-3 font-black"
              >
                OYUNA DÖN
              </button>
            ) : isHost ? (
              <button
                onClick={onStart}
                disabled={lobby.members.length < 2}
                className="mt-6 w-full bg-amber-300 p-3 font-black disabled:opacity-30"
              >
                YARIŞMAYI BAŞLAT
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
