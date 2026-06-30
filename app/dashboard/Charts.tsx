"use client";

// Lightweight, dependency-free SVG charts. Theme-aware (dark mode) and use the
// app accent color (var(--accent)) for primary series.

type Slice = { label: string; value: number; color: string };

export function DonutChart({
  data,
  size = 168,
  thickness = 24,
  centerLabel,
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} className="stroke-black/[0.06] dark:stroke-white/10" />
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * c;
              const seg = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          {centerLabel && <span className="text-xs text-zinc-400">{centerLabel}</span>}
        </div>
      </div>

      <ul className="min-w-32 flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-zinc-600 dark:text-zinc-300">{d.label}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({
  data,
  format,
  color = "var(--accent)",
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <p className="text-sm text-zinc-400">No data yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="truncate pr-2 text-zinc-600 dark:text-zinc-300">{d.label}</span>
            <span className="font-medium tabular-nums">{format ? format(d.value) : d.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AreaChart({
  data,
  format,
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
        Not enough data yet — record a few sales to see the trend.
      </div>
    );
  }

  const W = 320;
  const H = 150;
  const pad = 10;
  const n = data.length;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = (W - pad * 2) / (n - 1);
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = H - pad - (d.value / max) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${H - pad} L${pts[0][0].toFixed(1)},${H - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaFill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
      {format && (
        <p className="mt-1 text-center text-xs text-zinc-400">
          Peak: <span className="font-medium text-zinc-600 dark:text-zinc-300">{format(max)}</span>
        </p>
      )}
    </div>
  );
}
