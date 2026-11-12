import Link from "next/link";
import Avatar from "./Avatar";
import { Logo } from "./Icons";
import LogoutButton from "./LogoutButton";
import NavLinks from "./NavLinks";

export default function NavBar({ username }: { username: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Fish<span className="text-amber-400">Range</span>
          </span>
        </Link>
        <NavLinks className="hidden sm:flex" />
        <div className="flex items-center gap-3">
          {username ? (
            <>
              <span className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
                <Avatar name={username} size={30} />
                {username}
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary !py-1.5">Log in</Link>
          )}
        </div>
      </div>
      <NavLinks className="justify-center border-t border-white/5 px-2 py-1 sm:hidden" />
    </header>
  );
}