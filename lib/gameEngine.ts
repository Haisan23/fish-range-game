// ============================================================================
// FISH RANGE – GAME ENGINE (pure logic, no React, no drawing)
//
// Fish API mapping (our game design, based on the verified API fields):
//   fish  -> how many targets must be hit to clear the level (clamped 3..12)
//   chest -> how many power-up chests appear during the level (clamped 0..4)
// ============================================================================

export const W = 960; // logical canvas width
export const H = 560; // logical canvas height
export const LANES = [210, 320, 430]; // y position of the 3 target shelves
export const CHEST_Y = 115; // chests travel along a high rail
export const MAX_LIVES = 5;

export type Phase =
  | "idle"
  | "loading"
  | "countdown"
  | "playing"
  | "paused"
  | "levelComplete"
  | "gameOver";
export type Kind = "can" | "bull" | "decoy" | "chest";
export type PowerKey = "slow" | "double" | "freeze" | "wide";

export const POWER_INFO: Record<PowerKey, { label: string; duration: number; help: string }> = {
  slow: { label: "Slow Motion", duration: 8, help: "Targets move at half speed" },
  double: { label: "Double Points", duration: 10, help: "All points are doubled" },
  freeze: { label: "Clock Freeze", duration: 6, help: "The shot clock is paused" },
  wide: { label: "Wide Shot", duration: 10, help: "Larger hit area around the crosshair" },
};

export interface Target {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  baseY: number;
  vx: number;
  r: number;
  phase: number;
  hitT: number | null; // null = alive, otherwise seconds since it was hit
}
export interface FloatText { x: number; y: number; text: string; color: string; life: number }
export interface Ring { x: number; y: number; life: number; color: string }

export interface ApiInfo {
  question: string | null;
  fish: number;
  chest: number;
  source: "api" | "fallback";
}

export interface LevelCfg {
  required: number; // targets to hit (from API "fish")
  chests: number; // chests this level (from API "chest")
  speed: number; // target speed px/sec
  radius: number; // target size
  gap: number; // seconds allowed between shots (shot clock)
  bob: number; // vertical wobble in pixels (later levels)
  decoyChance: number; // chance a decoy bomb spawns with a target
  maxOnScreen: number; // max live targets at once
}

export interface GameState {
  phase: Phase;
  level: number;
  score: number;
  lives: number;
  hitCount: number;
  required: number;
  shots: number;
  goodHits: number;
  combo: number;
  levelTime: number;
  spawnCd: number;
  countdown: number;
  gapLeft: number;
  chestTimes: number[];
  targets: Target[];
  floats: FloatText[];
  rings: Ring[];
  powers: Record<PowerKey, number>;
  cfg: LevelCfg;
  api: ApiInfo | null;
  banner: string;
  bannerT: number;
  shake: number;
  nextId: number;
  saved: boolean;
  levelBonus: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** DIFFICULTY: every level is a bit harder. Tweak these numbers to rebalance the game. */
export function levelConfig(level: number, apiFish: number, apiChest: number): LevelCfg {
  return {
    required: clamp(Math.round(apiFish), 3, 12),
    chests: clamp(Math.round(apiChest), 0, 4),
    speed: Math.min(340, 100 + (level - 1) * 25), // faster each level
    radius: Math.max(20, 36 - (level - 1) * 2), // smaller each level
    gap: Math.max(2.2, 5 - (level - 20) * 0.35), // shot clock shrinks 5s -> 1.8s
    bob: level >= 3 ? Math.min(34, (level - 2) * 9) : 0, // wobbling targets from level 3
    decoyChance: level >= 4 ? Math.min(0.35, 0.12 + (level - 4) * 0.05) : 0, // bombs from level 4
    maxOnScreen: Math.min(6, 3 + Math.floor(level / 2)),
  };
}

export function createGame(): GameState {
  return {
    phase: "idle",
    level: 1,
    score: 0,
    lives: 3,
    hitCount: 0,
    required: 5,
    shots: 0,
    goodHits: 0,
    combo: 0,
    levelTime: 0,
    spawnCd: 0,
    countdown: 0,
    gapLeft: 5,
    chestTimes: [],
    targets: [],
    floats: [],
    rings: [],
    powers: { slow: 0, double: 0, freeze: 0, wide: 0 },
    cfg: levelConfig(1, 5, 2),
    api: null,
    banner: "",
    bannerT: 0,
    shake: 0,
    nextId: 1,
    saved: false,
    levelBonus: 0,
  };
}

function setBanner(g: GameState, text: string, secs = 1.6) {
  g.banner = text;
  g.bannerT = secs;
}

function pushFloat(g: GameState, x: number, y: number, text: string, color: string) {
  g.floats.push({ x, y, text, color, life: 1.1 });
}

/** Prepare the next level using data from the Fish API (or the labelled fallback). */
export function startLevel(g: GameState, api: ApiInfo) {
  g.api = api;
  g.cfg = levelConfig(g.level, api.fish, api.chest);
  g.required = g.cfg.required;
  g.hitCount = 0;
  g.targets = [];
  g.floats = [];
  g.rings = [];
  g.combo = 0;
  g.levelTime = 0;
  g.spawnCd = 0.3;
  g.gapLeft = g.cfg.gap;
  g.powers = { slow: 0, double: 0, freeze: 0, wide: 0 };
  // Chests appear at random moments early/mid level. They never count toward level completion.
  const window = 2 + g.cfg.required * 1.8;
  g.chestTimes = Array.from({ length: g.cfg.chests }, () => 1.5 + Math.random() * window).sort(
    (a, b) => a - b
  );
  g.countdown = 1.5;
  g.phase = "countdown";
  setBanner(g, `LEVEL ${g.level}`, 1.4);
}

function spawnTarget(g: GameState) {
  const lane = Math.floor(Math.random() * LANES.length);
  const dir = lane % 2 === 0 ? 1 : -1; // alternate shelves move in opposite directions
  const speed = g.cfg.speed * (0.85 + Math.random() * 0.35);
  const kind: Kind = Math.random() < 0.5 ? "can" : "bull";
  g.targets.push({
    id: g.nextId++,
    kind,
    x: dir === 1 ? -50 : W + 50,
    y: LANES[lane],
    baseY: LANES[lane],
    vx: dir * speed,
    r: g.cfg.radius,
    phase: Math.random() * 6,
    hitT: null,
  });
  if (Math.random() < g.cfg.decoyChance) {
    const lane2 = (lane + 1 + Math.floor(Math.random() * 2)) % LANES.length;
    const dir2 = lane2 % 2 === 0 ? 1 : -1;
    g.targets.push({
      id: g.nextId++,
      kind: "decoy",
      x: dir2 === 1 ? -50 : W + 50,
      y: LANES[lane2],
      baseY: LANES[lane2],
      vx: dir2 * speed * 0.9,
      r: g.cfg.radius,
      phase: Math.random() * 6,
      hitT: null,
    });
  }
}

function spawnChest(g: GameState) {
  const dir = Math.random() < 0.5 ? 1 : -1;
  g.targets.push({
    id: g.nextId++,
    kind: "chest",
    x: dir === 1 ? -50 : W + 50,
    y: CHEST_Y,
    baseY: CHEST_Y,
    vx: dir * g.cfg.speed * 0.7,
    r: 30,
    phase: Math.random() * 6,
    hitT: null,
  });
}

function loseLife(g: GameState, msg: string) {
  g.lives -= 1;
  g.combo = 0;
  g.shake = 1;
  pushFloat(g, W / 2, 80, msg, "#f87171");
  if (g.lives <= 0) {
    g.lives = 0;
    g.phase = "gameOver";
    setBanner(g, "GAME OVER", 3);
  } else {
    setBanner(g, msg, 1.2);
  }
}

/** Advance the game by dt seconds. Called every animation frame. */
export function update(g: GameState, dt: number) {
  if (g.phase === "paused") return;

  // visual effects
  g.bannerT = Math.max(0, g.bannerT - dt);
  g.shake = Math.max(0, g.shake - dt * 3);
  for (const f of g.floats) { f.life -= dt; f.y -= 40 * dt; }
  g.floats = g.floats.filter((f) => f.life > 0);
  for (const r of g.rings) r.life -= dt * 2;
  g.rings = g.rings.filter((r) => r.life > 0);

  if (g.phase === "countdown") {
    g.countdown -= dt;
    if (g.countdown <= 0) g.phase = "playing";
    return;
  }
  if (g.phase !== "playing") return;

  g.levelTime += dt;

  // power-up timers
  (Object.keys(g.powers) as PowerKey[]).forEach((k) => {
    if (g.powers[k] > 0) g.powers[k] = Math.max(0, g.powers[k] - dt);
  });

  // SHOT CLOCK: you must fire within `gap` seconds of your previous shot.
  if (g.powers.freeze <= 0) {
    g.gapLeft -= dt;
    if (g.gapLeft <= 0) {
      loseLife(g, "TOO SLOW!");
      g.gapLeft = g.cfg.gap;
      if ((g.phase as Phase) === "gameOver") return;
    }
  }

  // move targets
  const speedMul = g.powers.slow > 0 ? 0.5 : 1;
  for (const t of g.targets) {
    if (t.hitT !== null) { t.hitT += dt; continue; }
    t.x += t.vx * speedMul * dt;
    t.phase += dt * 3;
    const bob = t.kind === "chest" ? 8 : g.cfg.bob;
    t.y = t.baseY + Math.sin(t.phase) * bob;
  }
  g.targets = g.targets.filter((t) =>
    t.hitT === null ? t.x > -90 && t.x < W + 90 : t.hitT < 0.5
  );

  // spawn replacement targets so the level can always be finished
  g.spawnCd -= dt;
  const live = g.targets.filter((t) => t.hitT === null && (t.kind === "can" || t.kind === "bull")).length;
  const remaining = g.required - g.hitCount;
  if (g.spawnCd <= 0 && live < remaining && live < g.cfg.maxOnScreen) {
    spawnTarget(g);
    g.spawnCd = 0.5 + Math.random() * 0.5;
  }
  while (g.chestTimes.length && g.levelTime >= g.chestTimes[0]) {
    g.chestTimes.shift();
    spawnChest(g);
  }
}

function applyPower(g: GameState, x: number, y: number) {
  const pool: (PowerKey | "life")[] = ["slow", "double", "freeze", "wide", "life"];
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (pick === "life" && g.lives >= MAX_LIVES) pick = "double";
  if (pick === "life") {
    g.lives += 1;
    pushFloat(g, x, y, "+1 LIFE", "#f472b6");
    setBanner(g, "EXTRA LIFE!");
  } else {
    const info = POWER_INFO[pick];
    g.powers[pick] = info.duration; // collecting again simply refreshes the timer
    pushFloat(g, x, y, info.label, "#fbbf24");
    setBanner(g, `${info.label.toUpperCase()}!`);
  }
}

function completeLevel(g: GameState) {
  g.levelBonus = 200 * g.level;
  g.score += g.levelBonus;
  g.powers = { slow: 0, double: 0, freeze: 0, wide: 0 };
  g.phase = "levelComplete";
  setBanner(g, "LEVEL CLEARED!", 2);
}

/** Player fires at (x, y) in canvas coordinates. */
export function shoot(g: GameState, x: number, y: number) {
  if (g.phase !== "playing") return;
  g.shots += 1;
  const wide = g.powers.wide > 0 ? 18 : 0;

  let best: Target | null = null;
  let bestD = Infinity;
  for (const t of g.targets) {
    if (t.hitT !== null) continue;
    const d = Math.hypot(t.x - x, t.y - y);
    if (d <= t.r + wide && d < bestD) { best = t; bestD = d; }
  }

  const clockBefore = g.gapLeft;
  g.gapLeft = g.cfg.gap; // any shot (hit or miss) resets the shot clock

  // MISS: no points, combo resets
  if (!best) {
    g.combo = 0;
    g.rings.push({ x, y, life: 1, color: "#f87171" });
    pushFloat(g, x, y - 16, "MISS", "#f87171");
    return;
  }

  best.hitT = 0;
  g.rings.push({ x, y, life: 1, color: "#4ade80" });

  if (best.kind === "decoy") {
    g.score = Math.max(0, g.score - 150);
    g.combo = 0;
    g.shake = 0.8;
    pushFloat(g, best.x, best.y - 20, "BOMB! -150", "#f87171");
    return;
  }

  if (best.kind === "chest") {
    g.goodHits += 1;
    applyPower(g, best.x, best.y);
    return;
  }

  // normal hit
  g.goodHits += 1;
  g.combo += 1;
  const bullseye = best.kind === "bull" && bestD < best.r * 0.35;
  const base = (best.kind === "bull" ? 150 : 100) + (bullseye ? 50 : 0);
  const speedBonus = Math.round((clockBefore / g.cfg.gap) * 50); // fast shots earn more
  const comboMul = 1 + Math.min(g.combo - 1, 9) * 0.1; // up to x1.9
  const doubleMul = g.powers.double > 0 ? 2 : 1;
  const total = Math.round((base + speedBonus) * comboMul * doubleMul);
  g.score += total;
  g.hitCount += 1;
  pushFloat(g, best.x, best.y - 20, bullseye ? `BULLSEYE +${total}` : `+${total}`, bullseye ? "#fbbf24" : "#4ade80");

  if (g.hitCount >= g.required) completeLevel(g);
}

/** Pause only if currently playing (used when the browser tab is hidden). */
export function pauseGame(g: GameState) {
  if (g.phase === "playing") g.phase = "paused";
}

export function togglePause(g: GameState) {
  if (g.phase === "playing") g.phase = "paused";
  else if (g.phase === "paused") g.phase = "playing";
}

export function accuracyPct(g: GameState): number {
  return g.shots === 0 ? 0 : Math.round((g.goodHits / g.shots) * 100);
}

/** Small plain-object copy of the state for React to display in the HUD. */
export interface UiSnapshot {
  phase: Phase;
  level: number;
  score: number;
  lives: number;
  required: number;
  hitCount: number;
  gapLeft: number;
  gapMax: number;
  combo: number;
  accuracy: number;
  shots: number;
  levelBonus: number;
  chests: number;
  speed: number;
  powers: Record<PowerKey, number>;
  api: ApiInfo | null;
}

export function snapshot(g: GameState): UiSnapshot {
  return {
    phase: g.phase,
    level: g.level,
    score: g.score,
    lives: g.lives,
    required: g.required,
    hitCount: g.hitCount,
    gapLeft: g.gapLeft,
    gapMax: g.cfg.gap,
    combo: g.combo,
    accuracy: accuracyPct(g),
    shots: g.shots,
    levelBonus: g.levelBonus,
    chests: g.cfg.chests,
    speed: Math.round(g.cfg.speed),
    powers: { ...g.powers },
    api: g.api,
  };
}