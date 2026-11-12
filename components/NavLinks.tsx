"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Play" },
  { href: "/how-to-play", label: "How to play" },
  { href: "/scoreboard", label: "Scoreboard" },
];

export default function NavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}
