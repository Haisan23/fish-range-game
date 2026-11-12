import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, IconName, Logo } from "@/components/Icons";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "crosshair", title: "Beat the shot clock", text: "Every shot must land before the timer runs out." },
  { icon: "chest", title: "Collect power-ups", text: "Slow motion, double points, clock freeze and more." },
  { icon: "trophy", title: "Climb the scoreboard", text: "Harder levels, bigger scores, bragging rights." },
];

export default function LoginPage() {
  if (getSessionUser()) redirect("/");
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <span className="text-3xl font-extrabold tracking-tight text-white">
            Fish<span className="text-amber-400">Range</span>
          </span>
        </div>
        <div className="space-y-3">
          <h2 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            The browser shooting gallery with a <span className="text-amber-400">ticking clock</span>.
          </h2>
          <p className="max-w-lg text-lg text-slate-400">
            Aim, shoot and clear each level. The Fish API decides how many targets and chests you face.
          </p>
        </div>
        <ul className="space-y-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5 text-amber-400 ring-1 ring-white/10">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold text-white">{f.title}</div>
                <div className="text-sm text-slate-400">{f.text}</div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/how-to-play" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200">
          How to play <Icon name="arrow" className="h-4 w-4" />
        </Link>
      </section>
      <section className="flex justify-center lg:justify-end">
        <LoginForm />
      </section>
    </main>
  );
}