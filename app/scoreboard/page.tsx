import Link from "next/link";
import Avatar from "@/components/Avatar";
import Footer from "@/components/Footer";
import { Icon } from "@/components/Icons";
import NavBar from "@/components/NavBar";
import { getSessionUser } from "@/lib/auth";
import { topScores } from "@/lib/store";

export const dynamic = "force-dynamic";

const RANK_STYLE = [
  "bg-amber-400 text-slate-900",
  "bg-slate-300 text-slate-900",
  "bg-orange-400 text-slate-900",
];

export default async function ScoreboardPage() {
  const username = getSessionUser();
  let all: Awaited<ReturnType<typeof topScores>> = [];
  let dbError = false;
  try {
    all = await topScores(1000);
  } catch (err) {
    console.error("[scoreboard] could not load scores:", err);
    dbError = true;
  }
  const scores = all.slice(0, 10);
  const players = new Set(all.map((s) => s.username)).size;
  const myBest = username ? Math.max(0, ...all.filter((s) => s.username === username).map((s) => s.score)) : 0;

  return (
    <>
      <NavBar username={username} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold text-white">
              <Icon name="trophy" className="h-7 w-7 text-amber-400" /> Scoreboard
            </h1>
            <p className="mt-1 text-slate-400">The ten best runs across all players.</p>
          </div>
          <Link href="/" className="btn-primary">Play now</Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card p-4"><div className="label">Top score</div><div className="mt-1 text-2xl font-bold tabular-nums text-white">{(scores[0]?.score ?? 0).toLocaleString()}</div></div>
          <div className="card p-4"><div className="label">Players ranked</div><div className="mt-1 text-2xl font-bold tabular-nums text-white">{players}</div></div>
          <div className="card p-4"><div className="label">Your best</div><div className="mt-1 text-2xl font-bold tabular-nums text-white">{username ? myBest.toLocaleString() : "—"}</div></div>
        </div>

        {dbError && (
          <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Could not load scores right now (database unavailable). Please try again shortly.
          </div>
        )}

        {scores.length === 0 && !dbError ? (
          <div className="card p-10 text-center text-slate-300">
            No scores yet. <Link href="/" className="font-semibold text-amber-300 underline">Play a game</Link> to be the first on the board.
          </div>
        ) : scores.length === 0 ? null : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03]">
                  <tr className="label">
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Player</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Level</th>
                    <th className="px-4 py-3 text-right">Accuracy</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s, i) => (
                    <tr key={`${s.username}-${s.date}-${i}`}
                      className={`border-b border-white/5 last:border-0 ${s.username === username ? "bg-amber-400/10" : "hover:bg-white/[0.03]"}`}>
                      <td className="px-4 py-3">
                        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${RANK_STYLE[i] ?? "bg-white/10 text-slate-300"}`}>{i + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3 font-medium text-white">
                          <Avatar name={s.username} size={32} />
                          {s.username}
                          {s.username === username && <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">YOU</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-white">{s.score.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.level}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.accuracy}%</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(s.date).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}