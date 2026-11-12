"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";
  const input =
    "mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder-slate-600 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30";

  return (
    <form onSubmit={submit} className="card w-full max-w-md space-y-5 p-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {isLogin ? "Log in to save your scores and climb the scoreboard." : "It takes ten seconds. No email needed."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/60 p-1 text-sm font-semibold" role="tablist">
        <button type="button" role="tab" aria-selected={isLogin} onClick={() => { setMode("login"); setError(""); }}
          className={`rounded-lg py-2 transition ${isLogin ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
          Log in
        </button>
        <button type="button" role="tab" aria-selected={!isLogin} onClick={() => { setMode("register"); setError(""); }}
          className={`rounded-lg py-2 transition ${!isLogin ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
          Create account
        </button>
      </div>

      <label className="block text-sm font-medium text-slate-300">
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
          placeholder="e.g. sharpshooter" className={input} />
      </label>
      <label className="block text-sm font-medium text-slate-300">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
          autoComplete={isLogin ? "current-password" : "new-password"} placeholder="At least 6 characters" className={input} />
      </label>

      {!isLogin && <p className="text-xs text-slate-500">Username: 3–16 letters, numbers or underscore.</p>}
      {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
        {busy ? "Please wait…" : isLogin ? "Log in" : "Create account & play"}
      </button>
    </form>
  );
}