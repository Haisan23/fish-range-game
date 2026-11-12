"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiInfo, GameState, H, MAX_LIVES, POWER_INFO, PowerKey, UiSnapshot, W,
  createGame, pauseGame, shoot, snapshot, startLevel, togglePause, update,
} from "@/lib/gameEngine";
import { draw } from "@/lib/gameRender";
import Avatar from "./Avatar";
import { Icon, IconName } from "./Icons";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const POWER_ICONS: Record<PowerKey, IconName> = {
  slow: "hourglass",
  double: "zap",
  freeze: "snowflake",
  wide: "expand",
};

/** Ask our own server route for level data (it calls the lecturer's Fish API). */
async function fetchLevelData(): Promise<ApiInfo> {
  try {
    const res = await fetch("/api/fish", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    return (await res.json()) as ApiInfo;
  } catch {
    // Browser could not reach our own server: clearly labelled local fallback.
    return { question: null, fish: 5, chest: 2, source: "fallback" };
  }
}

export default function ShootingGame({ username }: { username: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gRef = useRef<GameState>(createGame());
  const mouseRef = useRef({ x: W / 2, y: H / 2 });
  const [ui, setUi] = useState<UiSnapshot>(() => snapshot(gRef.current));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const sync = useCallback(() => setUi(snapshot(gRef.current)), []);

  const beginLevel = useCallback(async () => {
    const g = gRef.current;
    g.phase = "loading";
    sync();
    const info = await fetchLevelData();
    startLevel(g, info);
    sync();
  }, [sync]);

  const newGame = useCallback(() => {
    gRef.current = createGame();
    setSaveStatus("idle");
    void beginLevel();
  }, [beginLevel]);

  const nextLevel = useCallback(() => {
    gRef.current.level += 1;
    void beginLevel();
  }, [beginLevel]);

  const onTogglePause = useCallback(() => {
    togglePause(gRef.current);
    sync();
  }, [sync]);

  // Main loop: update logic, draw, refresh HUD ~20x per second.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const saveScore = async (g: GameState) => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: g.score,
            level: g.level,
            accuracy: g.shots === 0 ? 0 : Math.round((g.goodHits / g.shots) * 100),
          }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = gRef.current;
      update(g, dt);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) draw(ctx, g, mouseRef.current);

      if (g.phase === "gameOver" && !g.saved) {
        g.saved = true; // save only once per game
        void saveScore(g);
      }
      acc += dt;
      if (acc >= 0.05) { acc = 0; setUi(snapshot(g)); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-pause when the browser tab is hidden, so you never lose a life in the background.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) { pauseGame(gRef.current); sync(); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [sync]);

  // Keyboard: Space/Enter = start/next/resume, Esc or P = pause/resume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const p = gRef.current.phase;
      if (e.code === "Space" || e.code === "Enter") {
        if (p === "idle" || p === "gameOver") { e.preventDefault(); newGame(); }
        else if (p === "levelComplete") { e.preventDefault(); nextLevel(); }
        else if (p === "paused") { e.preventDefault(); onTogglePause(); }
      } else if (e.code === "Escape" || e.code === "KeyP") {
        onTogglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newGame, nextLevel, onTogglePause]);

  // Convert a pointer event (mouse or touch) to canvas coordinates
  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) * W) / rect.width, y: ((e.clientY - rect.top) * H) / rect.height };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => { mouseRef.current = toCanvas(e); };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const p = toCanvas(e);
    mouseRef.current = p;
    shoot(gRef.current, p.x, p.y);
  };

  const paused = ui.phase === "paused";
  const canPause = ui.phase === "playing" || paused;
  const aiming = ui.phase === "playing" || ui.phase === "countdown";
  const clockPct = Math.max(0, Math.min(100, (ui.gapLeft / ui.gapMax) * 100));
  const clockColor = clockPct < 30 ? "bg-red-500" : clockPct < 60 ? "bg-amber-400" : "bg-emerald-400";
  const frozen = ui.powers.freeze > 0;
  const progressPct = ui.required > 0 ? Math.min(100, (ui.hitCount / ui.required) * 100) : 0;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* ---------------- MAIN COLUMN ---------------- */}
      <section className="space-y-3">
        {/* HUD bar */}
        <div className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div>
              <div className="label">Score</div>
              <div className="text-2xl font-bold tabular-nums text-white">{ui.score.toLocaleString()}</div>
            </div>
            <div>
              <div className="label">Level</div>
              <div className="text-2xl font-bold tabular-nums text-white">{ui.level}</div>
            </div>
            <div>
              <div className="label">Lives</div>
              <div className="mt-1 flex gap-1" aria-label={`${ui.lives} lives`}>
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <Icon key={i} name="heart" filled={i < ui.lives}
                    className={`h-5 w-5 ${i < ui.lives ? "text-rose-500" : "text-slate-700"}`} />
                ))}
              </div>
            </div>

            <button
              onClick={onTogglePause}
              disabled={!canPause}
              aria-label={paused ? "Resume game" : "Pause game"}
              className="btn-ghost ml-auto"
            >
              <Icon name={paused ? "play" : "pause"} className="h-4 w-4" />
              {paused ? "Resume" : "Pause"}
              <span className="kbd hidden sm:inline">P</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="label">Targets cleared</span>
                <span className="font-semibold tabular-nums text-slate-200">{ui.hitCount} / {ui.required}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-[width] duration-200"
                  style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="label">Shot clock</span>
                <span className={`font-semibold tabular-nums ${frozen ? "text-cyan-300" : clockPct < 30 ? "text-red-400" : "text-slate-200"}`}>
                  {frozen ? "FROZEN" : `${ui.gapLeft.toFixed(1)}s`}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div className={`h-full rounded-full ${frozen ? "bg-cyan-300" : clockColor}`} style={{ width: `${clockPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas + overlays */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className={`block h-auto w-full touch-none select-none ${aiming ? "cursor-none" : "cursor-default"}`}
            onPointerMove={onMove}
            onPointerDown={onDown}
          />

          {ui.phase === "idle" && (
            <Overlay>
              <h2 className="text-2xl font-extrabold text-white">Ready to shoot?</h2>
              <p className="text-sm text-slate-300">
                Welcome, <b className="text-white">{username}</b>. Clear every target before the shot clock runs out.
              </p>
              <ul className="space-y-2 text-left text-sm text-slate-300">
                <li className="flex items-center gap-2"><Icon name="target" className="h-4 w-4 shrink-0 text-emerald-400" />Shoot cans and bullseyes</li>
                <li className="flex items-center gap-2"><Icon name="chest" className="h-4 w-4 shrink-0 text-amber-400" />Shoot golden chests for power-ups</li>
                <li className="flex items-center gap-2"><Icon name="bomb" className="h-4 w-4 shrink-0 text-rose-400" />Avoid the black bombs</li>
              </ul>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={newGame} className="btn-primary">Start game <span className="kbd !border-slate-900/30 !bg-slate-900/10 !text-slate-900">Space</span></button>
                <Link href="/how-to-play" className="btn-ghost">How to play</Link>
              </div>
            </Overlay>
          )}

          {ui.phase === "loading" && (
            <Overlay>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
              <p className="text-sm text-slate-300">Loading level data from the Fish API…</p>
            </Overlay>
          )}

          {paused && (
            <Overlay>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-400/15 text-amber-300">
                <Icon name="pause" className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Game paused</h2>
              <p className="text-sm text-slate-300">Targets and the shot clock are frozen.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={onTogglePause} className="btn-primary">
                  <Icon name="play" className="h-4 w-4" /> Resume <span className="kbd !border-slate-900/30 !bg-slate-900/10 !text-slate-900">Space</span>
                </button>
                <button onClick={newGame} className="btn-ghost"><Icon name="restart" className="h-4 w-4" /> Restart</button>
                <Link href="/how-to-play" target="_blank" className="btn-ghost">How to play</Link>
              </div>
            </Overlay>
          )}

          {ui.phase === "levelComplete" && (
            <Overlay>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                <Icon name="check" className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Level {ui.level} cleared</h2>
              <p className="text-sm text-slate-300">
                Level bonus <b className="text-amber-300">+{ui.levelBonus}</b> · Score <b className="text-white">{ui.score.toLocaleString()}</b>
              </p>
              <p className="text-xs text-slate-400">Next: faster targets, smaller targets and a shorter shot clock.</p>
              <button onClick={nextLevel} className="btn-primary">
                Start level {ui.level + 1} <span className="kbd !border-slate-900/30 !bg-slate-900/10 !text-slate-900">Space</span>
              </button>
            </Overlay>
          )}

          {ui.phase === "gameOver" && (
            <Overlay>
              <h2 className="text-2xl font-extrabold text-white">Game over</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Mini label="Score" value={ui.score.toLocaleString()} />
                <Mini label="Level" value={String(ui.level)} />
                <Mini label="Accuracy" value={`${ui.accuracy}%`} />
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                {saveStatus === "saving" && "Saving score…"}
                {saveStatus === "saved" && (<><Icon name="check" className="h-3.5 w-3.5 text-emerald-400" />Score saved to the scoreboard</>)}
                {saveStatus === "error" && (<><Icon name="alert" className="h-3.5 w-3.5 text-amber-400" />Could not save score. Are you still logged in?</>)}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={newGame} className="btn-primary">Play again <span className="kbd !border-slate-900/30 !bg-slate-900/10 !text-slate-900">Space</span></button>
                <Link href="/scoreboard" className="btn-ghost"><Icon name="trophy" className="h-4 w-4" /> Scoreboard</Link>
              </div>
            </Overlay>
          )}
        </div>

        <p className="text-center text-xs text-slate-500">
          Aim with mouse or touch · click/tap to shoot · <span className="kbd">P</span> or <span className="kbd">Esc</span> pause · <span className="kbd">Space</span> start / continue
        </p>
      </section>

      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="space-y-3">
        <div className="card flex items-center gap-3 p-4">
          <Avatar name={username} size={48} />
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{username}</div>
            <div className="text-xs text-slate-400">Avatar via DiceBear API</div>
          </div>
        </div>

        <div className="card grid grid-cols-3 divide-x divide-white/10 p-4 text-center">
          <div><div className="label">Accuracy</div><div className="text-lg font-bold tabular-nums text-white">{ui.accuracy}%</div></div>
          <div><div className="label">Combo</div><div className="text-lg font-bold tabular-nums text-white">x{ui.combo}</div></div>
          <div><div className="label">Shots</div><div className="text-lg font-bold tabular-nums text-white">{ui.shots}</div></div>
        </div>

        <div className="card p-4">
          <div className="label mb-3">Power-ups</div>
          <ul className="space-y-2">
            {(Object.keys(POWER_INFO) as PowerKey[]).map((k) => {
              const left = ui.powers[k];
              const active = left > 0;
              const pct = Math.min(100, (left / POWER_INFO[k].duration) * 100);
              return (
                <li key={k} title={POWER_INFO[k].help}
                  className={`rounded-xl border px-3 py-2 ${active ? "border-amber-400/60 bg-amber-400/10" : "border-white/5 bg-white/[0.03]"}`}>
                  <div className={`flex items-center gap-2 text-sm ${active ? "text-amber-200" : "text-slate-500"}`}>
                    <Icon name={POWER_ICONS[k]} className="h-4 w-4" />
                    <span className="flex-1">{POWER_INFO[k].label}</span>
                    <span className="font-mono text-xs tabular-nums">{active ? `${left.toFixed(1)}s` : "off"}</span>
                  </div>
                  {active && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Shoot a golden chest for a random power-up (or an extra life).</p>
        </div>

        {ui.api && (
          <div className="card space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="label">Level data</span>
              {ui.api.source === "api" ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">LIVE · Fish API</span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">LOCAL FALLBACK</span>
              )}
            </div>
            {ui.api.question && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ui.api.question} alt="Fish API puzzle for this level"
                className="h-24 w-full rounded-lg border border-white/10 bg-white object-contain"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-slate-300">
              <dt className="text-slate-500">fish</dt>
              <dd>{ui.api.fish} → <b className="text-white">{ui.required}</b> targets</dd>
              <dt className="text-slate-500">chest</dt>
              <dd>{ui.api.chest} → <b className="text-white">{ui.chests}</b> power-up chests</dd>
              <dt className="text-slate-500">speed</dt>
              <dd>{ui.speed}px/s · gap {ui.gapMax.toFixed(1)}s</dd>
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
      <div className="label">{label}</div>
      <div className="text-xl font-bold tabular-nums text-white">{value}</div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm space-y-4 p-6 text-center">{children}</div>
    </div>
  );
}