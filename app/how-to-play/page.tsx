import Link from "next/link";
import Footer from "@/components/Footer";
import { Icon, IconName } from "@/components/Icons";
import NavBar from "@/components/NavBar";
import { getSessionUser } from "@/lib/auth";
import { MAX_LIVES, POWER_INFO, PowerKey, levelConfig } from "@/lib/gameEngine";

export const dynamic = "force-dynamic";

const POWER_ICONS: Record<PowerKey, IconName> = {
  slow: "hourglass", double: "zap", freeze: "snowflake", wide: "expand",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function CanArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      <rect x="12" y="8" width="24" height="32" fill="#d1d5db" stroke="#4b5563" strokeWidth="2" />
      <rect x="12" y="19" width="24" height="10" fill="#dc2626" />
      <ellipse cx="24" cy="8" rx="12" ry="3" fill="#e5e7eb" stroke="#4b5563" strokeWidth="2" />
    </svg>
  );
}
function BullArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      {["#dc2626", "#fff", "#dc2626", "#fff", "#dc2626"].map((c, i) => (
        <circle key={i} cx="24" cy="24" r={20 - i * 4} fill={c} />
      ))}
    </svg>
  );
}
function BombArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      <circle cx="24" cy="28" r="16" fill="#111827" stroke="#ef4444" strokeWidth="3" />
      <path d="M24 12 L30 4" stroke="#a16207" strokeWidth="3" />
      <circle cx="30" cy="4" r="3" fill="#fbbf24" />
      <text x="24" y="35" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ef4444">!</text>
    </svg>
  );
}
function ChestArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12">
      <rect x="6" y="12" width="36" height="26" fill="#92400e" stroke="#451a03" strokeWidth="2" />
      <rect x="6" y="12" width="36" height="10" fill="#b45309" />
      <rect x="6" y="22" width="36" height="3" fill="#fbbf24" />
      <rect x="21" y="20" width="6" height="9" fill="#fbbf24" />
    </svg>
  );
}

export default function HowToPlayPage() {
  const username = getSessionUser();
  const levels = Array.from({ length: 8 }, (_, i) => i + 1).map((l) => ({ l, c: levelConfig(l, 8, 3) }));

  const targets = [
    { art: <CanArt />, name: "Tin can", text: "Standard target. 100 points.", tone: "text-emerald-300" },
    { art: <BullArt />, name: "Bullseye", text: "150 points, +50 for a dead-centre hit.", tone: "text-emerald-300" },
    { art: <ChestArt />, name: "Golden chest", text: "Shoot it for a random power-up. It never counts toward clearing the level.", tone: "text-amber-300" },
    { art: <BombArt />, name: "Bomb (level 4+)", text: "Do not shoot! −150 points and your combo resets.", tone: "text-rose-300" },
  ];

  return (
    <>
      <NavBar username={username} />
      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8">
        {/* Hero */}
        <header className="space-y-3">
          <h1 className="text-4xl font-extrabold text-white">How to play</h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Clear every target before the shot clock runs out. Each level is faster and tougher than the last.
          </p>
          <Link href={username ? "/" : "/login"} className="btn-primary">
            {username ? "Start playing" : "Log in to play"} <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </header>

        {/* Steps */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: 1, icon: "crosshair" as IconName, t: "Aim", d: "Move the mouse (or drag your finger) to place the crosshair." },
            { n: 2, icon: "target" as IconName, t: "Shoot", d: "Click or tap to fire. Hits score points; misses score nothing." },
            { n: 3, icon: "check" as IconName, t: "Clear the level", d: "Hit every required target to move on to a harder level." },
          ].map((s) => (
            <div key={s.n} className="card space-y-2 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400/15 text-amber-300"><Icon name={s.icon} className="h-5 w-5" /></span>
                <span className="label">Step {s.n}</span>
              </div>
              <div className="text-lg font-bold text-white">{s.t}</div>
              <p className="text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>

        <Section title="Controls">
          <div className="card divide-y divide-white/5 text-sm">
            {[
              ["Aim", "Move the mouse / drag a finger"],
              ["Shoot", "Click / tap"],
              ["Pause or resume", "Pause button, P or Esc (the game also pauses if you switch tabs)"],
              ["Start / continue", "Space or Enter"],
            ].map(([a, b]) => (
              <div key={a} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <span className="font-semibold text-white">{a}</span>
                <span className="text-slate-400">{b}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What you will see">
          <div className="grid gap-4 sm:grid-cols-2">
            {targets.map((t) => (
              <div key={t.name} className="card flex items-center gap-4 p-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-slate-950/60">{t.art}</div>
                <div>
                  <div className={`font-bold ${t.tone}`}>{t.name}</div>
                  <p className="text-sm text-slate-400">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shot clock and lives">
          <div className="card space-y-2 p-5 text-sm text-slate-300">
            <p>
              You start with <b className="text-white">3 lives</b> (maximum {MAX_LIVES}). After every shot, hit or miss, the{" "}
              <b className="text-white">shot clock</b> resets. If it reaches zero before you fire again, you lose a life.
              Lose them all and the game is over, and your score goes to the scoreboard.
            </p>
            <p className="text-slate-400">The allowed gap shrinks every level, so keep shooting.</p>
          </div>
        </Section>

        <Section title="Power-ups">
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(POWER_INFO) as PowerKey[]).map((k) => (
              <div key={k} className="card flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
                  <Icon name={POWER_ICONS[k]} className="h-6 w-6" />
                </span>
                <div>
                  <div className="font-bold text-white">{POWER_INFO[k].label} <span className="font-normal text-slate-500">· {POWER_INFO[k].duration}s</span></div>
                  <p className="text-sm text-slate-400">{POWER_INFO[k].help}</p>
                </div>
              </div>
            ))}
            <div className="card flex items-center gap-4 p-4 sm:col-span-2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-500/15 text-rose-400"><Icon name="heart" filled className="h-6 w-6" /></span>
              <div>
                <div className="font-bold text-white">Extra life</div>
                <p className="text-sm text-slate-400">+1 life (up to {MAX_LIVES}). Chests give one random reward from the five above.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Scoring">
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {[
                  ["Tin can", "100"],
                  ["Bullseye", "150 (+50 for the centre)"],
                  ["Speed bonus", "up to +50, more when the shot clock is nearly full"],
                  ["Combo multiplier", "×1.1 per consecutive hit, up to ×1.9. A miss resets it"],
                  ["Double Points power-up", "×2"],
                  ["Bomb", "−150"],
                  ["Level cleared", "+200 × level number"],
                ].map(([a, b]) => (
                  <tr key={a}><td className="px-5 py-3 font-semibold text-white">{a}</td><td className="px-5 py-3 text-slate-400">{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="How difficulty increases">
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr className="label"><th className="px-4 py-3">Level</th><th className="px-4 py-3">Speed</th><th className="px-4 py-3">Target size</th><th className="px-4 py-3">Shot clock</th><th className="px-4 py-3">Wobble</th><th className="px-4 py-3">Bombs</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 tabular-nums">
                {levels.map(({ l, c }) => (
                  <tr key={l}>
                    <td className="px-4 py-2.5 font-semibold text-white">{l}</td>
                    <td className="px-4 py-2.5">{Math.round(c.speed)} px/s</td>
                    <td className="px-4 py-2.5">{c.radius * 2}px</td>
                    <td className="px-4 py-2.5">{c.gap.toFixed(1)}s</td>
                    <td className="px-4 py-2.5">{c.bob > 0 ? "Yes" : "—"}</td>
                    <td className="px-4 py-2.5">{c.decoyChance > 0 ? `${Math.round(c.decoyChance * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Powered by external APIs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card space-y-2 p-5 text-sm">
              <div className="font-bold text-white">Fish API (level data)</div>
              <p className="text-slate-400">
                At the start of every level the game asks the Fish API for a puzzle. Its <code className="text-amber-300">fish</code> value sets how many
                targets you must hit (3–12) and its <code className="text-amber-300">chest</code> value sets how many power-up chests appear (0–4).
                The panel beside the game shows the live values. If the API is down, a clearly labelled local fallback is used.
              </p>
            </div>
            <div className="card space-y-2 p-5 text-sm">
              <div className="font-bold text-white">DiceBear API (avatars)</div>
              <p className="text-slate-400">
                Your username is sent to the DiceBear avatar API, which returns a unique picture that always looks the same for you.
                It appears in the menu, the game sidebar and the scoreboard.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Tips">
          <ul className="card list-disc space-y-1.5 py-4 pl-9 pr-5 text-sm text-slate-300">
            <li>Keep firing at a steady rhythm. A fast hit earns more than a slow one.</li>
            <li>Grab chests early. Clock Freeze and Slow Motion make later levels much easier.</li>
            <li>From level 4, check the colour before you shoot: black means bomb.</li>
            <li>Pause any time to take a breather. Nothing moves while the game is paused.</li>
          </ul>
        </Section>
      </main>
      <Footer />
    </>
  );
}