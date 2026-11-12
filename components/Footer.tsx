export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
      <p>
        Fish Range · CIS045-3 Distributed Service Architectures · Level data from the{" "}
        <a className="text-slate-400 underline hover:text-white" href="https://marcconrad.com/uob/fish" target="_blank" rel="noreferrer">
          Fish API
        </a>{" "}
        · Avatars by{" "}
        <a className="text-slate-400 underline hover:text-white" href="https://www.dicebear.com" target="_blank" rel="noreferrer">
          DiceBear
        </a>
      </p>
    </footer>
  );
}