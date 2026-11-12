// Player avatar loaded from OUR /api/avatar route, which calls the DiceBear API.
export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/avatar?seed=${encodeURIComponent(name)}`}
      alt={`Avatar of ${name}`}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full bg-slate-700 object-cover ring-2 ring-white/10"
      style={{ width: size, height: size }}
    />
  );
}