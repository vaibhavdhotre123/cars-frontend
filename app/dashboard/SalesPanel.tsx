"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listDeals, createDeal, deleteDeal, type Deal } from "../lib/deals";
import { listCars, type Car } from "../lib/cars";
import { listCustomers, type Customer } from "../lib/customers";
import { getUser } from "../lib/auth";
import { toastSuccess } from "../lib/toast";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US");

type IconProps = { className?: string };
const I = {
  Plus: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 5v14M5 12h14" /></svg>),
  Trash: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>),
  Close: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  Spinner: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={p.className}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>),
  Tag: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>),
  Chart: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></svg>),
  Up: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M7 17 17 7M7 7h10v10" /></svg>),
  Car: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" /><path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /></svg>),
};

export default function SalesPanel({ onSaleRecorded }: { onSaleRecorded?: () => void }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Deal | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [d, c, cu] = await Promise.all([listDeals(), listCars(), listCustomers()]);
      setDeals(d);
      setCars(c);
      setCustomers(cu);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const stats = useMemo(() => {
    const revenue = deals.reduce((s, d) => s + d.salePrice, 0);
    const avg = deals.length ? revenue / deals.length : 0;
    const available = cars.filter((c) => c.status === "Available").length;
    return { units: deals.length, revenue, avg, available };
  }, [deals, cars]);

  const sellable = useMemo(() => cars.filter((c) => c.status !== "Sold"), [cars]);

  async function handleSaved() {
    setModalOpen(false);
    await refresh();
    onSaleRecorded?.();
    toastSuccess("Sale recorded");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRowError(null);
    try {
      await deleteDeal(deleting.id);
      setDeals((prev) => prev.filter((d) => d.id !== deleting.id));
      setDeleting(null);
      toastSuccess("Sale removed");
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to remove sale");
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Sales</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Deals &amp; revenue</h1>
          <p className="mt-1 text-sm text-zinc-500">Record sales and track closed deals.</p>
        </div>
        <button onClick={() => { setRowError(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
          <I.Plus className="h-4 w-4" /> Record sale
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Units sold" value={number.format(stats.units)} hint="all time" icon={<I.Tag className="h-5 w-5" />} accent="indigo" />
        <Stat label="Revenue" value={currency.format(stats.revenue)} hint="from deals" icon={<I.Chart className="h-5 w-5" />} accent="amber" />
        <Stat label="Avg. sale price" value={currency.format(stats.avg)} hint="per vehicle" icon={<I.Up className="h-5 w-5" />} accent="violet" />
        <Stat label="Available" value={number.format(stats.available)} hint="ready to sell" icon={<I.Car className="h-5 w-5" />} accent="emerald" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="border-b border-black/5 p-4 dark:border-white/10">
          <h2 className="text-base font-semibold">Closed deals</h2>
          <p className="text-xs text-zinc-500">{loading ? "Loading…" : `${deals.length} sale${deals.length === 1 ? "" : "s"}`}</p>
        </div>

        {rowError && <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{rowError}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-zinc-400 dark:border-white/10">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Salesperson</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !loadError && deals.map((d) => (
                <tr key={d.id} className="border-b border-black/5 last:border-0 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{d.carLabel}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{d.customerName}</div>
                    {d.customerEmail && <div className="text-xs text-zinc-400">{d.customerEmail}</div>}
                  </td>
                  <td className="px-4 py-3 font-medium">{currency.format(d.salePrice)}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell dark:text-zinc-400">{d.soldDate}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">{d.salesperson || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => { setRowError(null); setDeleting(d); }} title="Remove sale" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400">
                        <I.Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400"><I.Spinner className="mx-auto h-5 w-5 animate-spin" /><span className="mt-2 block">Loading sales…</span></td></tr>)}
              {!loading && loadError && (<tr><td colSpan={6} className="px-4 py-10 text-center text-sm"><p className="text-red-600 dark:text-red-400">{loadError}</p><button onClick={refresh} className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">Retry</button></td></tr>)}
              {!loading && !loadError && deals.length === 0 && (<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">No sales yet. Click “Record sale” to log your first deal.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <RecordSaleModal cars={sellable} customers={customers} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
      )}

      {deleting && (
        <Overlay onClose={() => setDeleting(null)}>
          <h3 className="text-lg font-semibold">Remove this sale?</h3>
          <p className="mt-2 text-sm text-zinc-500">
            This removes the deal record for <span className="font-medium text-zinc-900 dark:text-zinc-100">{deleting.carLabel}</span>. The car&apos;s status is not changed.
          </p>
          {rowError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{rowError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">Cancel</button>
            <button onClick={confirmDelete} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">Remove</button>
          </div>
        </Overlay>
      )}
    </>
  );
}

function Stat({ label, value, hint, icon, accent }: { label: string; value: string; hint: string; icon: React.ReactNode; accent: string }) {
  const accents: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  };
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accents[accent] ?? accents.indigo}`}>{icon}</span>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

function RecordSaleModal({
  cars,
  customers,
  onClose,
  onSaved,
}: {
  cars: Car[];
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [carId, setCarId] = useState<number | "">(cars[0]?.id ?? "");
  const [customerId, setCustomerId] = useState<number | "">(customers[0]?.id ?? "");
  const [price, setPrice] = useState<number>(cars[0]?.price ?? 0);
  const [soldDate, setSoldDate] = useState(today);
  const [salesperson, setSalesperson] = useState(getUser()?.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onCarChange(id: number) {
    setCarId(id);
    const car = cars.find((c) => c.id === id);
    if (car) setPrice(car.price);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (carId === "" || customerId === "") {
      setError("Select a car and a customer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createDeal({
        carId: Number(carId),
        customerId: Number(customerId),
        salePrice: price,
        soldDate,
        salesperson: salesperson.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sale");
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-white/20";
  const labelCls = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <Overlay onClose={() => !busy && onClose()}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Record sale</h3>
          <p className="mt-0.5 text-sm text-zinc-500">Link a customer to the car they bought.</p>
        </div>
        <button onClick={() => !busy && onClose()} className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"><I.Close className="h-5 w-5" /></button>
      </div>

      {cars.length === 0 || customers.length === 0 ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          {cars.length === 0 ? "No available cars to sell. Add a car (or set one to Available) first." : "No customers yet. Add a customer first."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <label className={labelCls}>
            Car
            <select className={field} value={carId} onChange={(e) => onCarChange(Number(e.target.value))}>
              {cars.map((c) => (<option key={c.id} value={c.id}>{c.make} {c.model} ({c.year}) — {currency.format(c.price)} · {c.status}</option>))}
            </select>
          </label>
          <label className={labelCls}>
            Customer
            <select className={field} value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.name} — {c.email}</option>))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className={labelCls}>
              Sale price (USD)
              <input className={field} type="number" min={0} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </label>
            <label className={labelCls}>
              Date
              <input className={field} type="date" value={soldDate} onChange={(e) => setSoldDate(e.target.value)} />
            </label>
          </div>
          <label className={labelCls}>
            Salesperson <span className="font-normal text-zinc-400">(optional)</span>
            <input className={field} value={salesperson} onChange={(e) => setSalesperson(e.target.value)} placeholder="Who closed it" />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

          <div className="mt-1 flex justify-end gap-3">
            <button type="button" onClick={() => !busy && onClose()} disabled={busy} className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {busy && <I.Spinner className="h-4 w-4 animate-spin" />}
              Record sale
            </button>
          </div>
        </form>
      )}
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm [animation:overlayFadeIn_120ms_ease-out]" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-2xl [animation:popupIn_160ms_cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
