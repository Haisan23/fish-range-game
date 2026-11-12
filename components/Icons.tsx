// Small inline SVG icon set (no extra packages needed).
import type { ReactNode } from "react";

export type IconName =
  | "pause" | "play" | "heart" | "crosshair" | "trophy" | "help" | "clock"
  | "snowflake" | "hourglass" | "zap" | "expand" | "target" | "bomb" | "chest"
  | "user" | "check" | "alert" | "restart" | "arrow";

const PATHS: Record<IconName, ReactNode> = {
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  crosshair: <><circle cx="12" cy="12" r="9" /><path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  snowflake: <path d="M2 12h20M12 2v20m8-6-4-4 4-4M4 8l4 4-4 4m12-12-4 4-4-4M8 20l4-4 4 4" />,
  hourglass: <><path d="M5 22h14M5 2h14" /><path d="M17 22v-4.17a2 2 0 0 0-.59-1.41L12 12l-4.41 4.42A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.41L12 12l4.41-4.42A2 2 0 0 0 17 6.17V2" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  bomb: <><circle cx="11" cy="13" r="8" /><path d="M14.5 5.5 17 3M19 2l1 1M18 7l2 .5" /></>,
  chest: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M3 12h18M12 12v3M5 8a7 5 0 0 1 14 0" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  check: <path d="m5 12 5 5L20 7" />,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  restart: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
};

// Icons that look better filled
const SOLID: IconName[] = ["pause", "play", "zap"];

export function Icon({
  name, className = "h-5 w-5", filled = false,
}: { name: IconName; className?: string; filled?: boolean }) {
  const fill = filled || SOLID.includes(name);
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={fill && SOLID.includes(name) ? 1 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/** Brand mark: crosshair in a rounded amber square. */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 ${className}`}>
      <Icon name="crosshair" className="h-3/5 w-3/5" />
    </span>
  );
}