"use client";

import { useMemo, useRef, useState } from "react";
import type { Car } from "../lib/cars";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US");

const STATUS_STYLES: Record<string, string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  Reserved: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  Sold: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
};

function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  );
}

export default function Showroom({ cars }: { cars: Car[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(cars[0]?.id ?? null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hover, setHover] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const car = useMemo(
    () => cars.find((c) => c.id === selectedId) ?? cars[0] ?? null,
    [cars, selectedId]
  );

  // Honest, data-derived highlights (no invented specs).
  const highlights = useMemo(() => {
    if (!car) return [];
    const out: string[] = [];
    const yearNow = new Date().getFullYear();
    if (car.mileage < 10000) out.push("Low mileage");
    if (car.year >= yearNow - 1) out.push("Latest model");
    if (car.status === "Available") out.push("Ready to drive");
    if (car.price >= 100000) out.push("Premium");
    if (car.status === "Reserved") out.push("Reserved");
    return out;
  }, [car]);

  // Parallax tilt that follows the cursor — gives the photo a live, 3D feel.
  function onMove(e: React.MouseEvent) {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 12, ry: px * 16 });
  }
  function onLeave() {
    setHover(false);
    setTilt({ rx: 0, ry: 0 });
  }

  const hasImage = !!car?.imageUrl?.trim();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Image stage + thumbnails */}
      <div className="lg:col-span-2">
        <div
          ref={stageRef}
          onMouseMove={onMove}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={onLeave}
          className="relative flex h-[440px] items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-zinc-100 to-zinc-200 sm:h-[520px] dark:border-white/10 dark:from-zinc-900 dark:to-black"
          style={{ perspective: "1200px" }}
        >
          {hasImage && car ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={car.id}
              src={car.imageUrl as string}
              alt={`${car.make} ${car.model}`}
              draggable={false}
              className="max-h-[88%] max-w-[90%] object-contain drop-shadow-2xl transition-transform duration-150 ease-out"
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${hover ? 1.06 : 1})`,
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).dataset.failed = "1";
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center px-6 text-center text-zinc-400">
              <CarIcon className="h-16 w-16" />
              <p className="mt-3 max-w-xs text-sm">
                {car
                  ? "No photo for this car yet. Add an Image URL in Inventory → edit this car."
                  : "No cars to display. Add a vehicle in Inventory."}
              </p>
            </div>
          )}

          {car && (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {car.make} {car.model} · {car.year}
            </span>
          )}
          {hasImage && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              Move cursor to tilt
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {cars.length > 0 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {cars.map((c) => {
              const active = c.id === car?.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  title={`${c.make} ${c.model}`}
                  className={`relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-zinc-100 transition dark:bg-white/5 ${
                    active
                      ? "border-black ring-2 ring-black dark:border-white dark:ring-white"
                      : "border-black/10 hover:border-black/30 dark:border-white/15 dark:hover:border-white/40"
                  }`}
                >
                  {c.imageUrl?.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")} />
                  ) : (
                    <CarIcon className="h-6 w-6 text-zinc-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature / spec panel */}
      <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        {!car ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-zinc-500">No cars to display. Add a vehicle in Inventory to view it here.</p>
          </div>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Vehicle
              <select
                value={car.id}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.make} {c.model} ({c.year})
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5">
              <h2 className="text-xl font-semibold tracking-tight">{car.make} {car.model}</h2>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{currency.format(car.price)}</p>
              <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[car.status] ?? ""}`}>
                {car.status}
              </span>
            </div>

            {highlights.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <span key={h} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                    {h}
                  </span>
                ))}
              </div>
            )}

            <dl className="mt-5 space-y-2.5 text-sm">
              <Spec label="Make" value={car.make} />
              <Spec label="Model" value={car.model} />
              <Spec label="Year" value={String(car.year)} />
              <Spec label="Mileage" value={`${number.format(car.mileage)} mi`} />
              <Spec label="Status" value={car.status} />
              <Spec label="Stock #" value={`#${car.id}`} />
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
