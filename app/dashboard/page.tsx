"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearUser, type AppUser } from "../lib/auth";
import {
  listCars,
  createCar,
  updateCar,
  deleteCar,
  type Car,
  type CarInput,
  type CarStatus,
} from "../lib/cars";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-US");

const STATUSES: CarStatus[] = ["Available", "Reserved", "Sold"];

// ---- Tiny inline icons (no extra deps) ------------------------------------
type IconProps = { className?: string };
const Icon = {
  Grid: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
  ),
  Car: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" /><path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H4a1 1 0 0 1-1-1z" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /></svg>
  ),
  Tag: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
  ),
  Users: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Chart: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="7" width="3" height="10" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></svg>
  ),
  Settings: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  Search: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
  ),
  Plus: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 5v14M5 12h14" /></svg>
  ),
  Logout: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
  ),
  Up: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M7 17 17 7M7 7h10v10" /></svg>
  ),
  Edit: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
  ),
  Trash: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
  ),
  Close: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 6 6 18M6 6l12 12" /></svg>
  ),
  Spinner: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={p.className}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>
  ),
  Refresh: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
  ),
};

type Tab = "Dashboard" | "Inventory" | "Sales" | "Customers" | "Reports" | "Settings";

const NAV: { label: Tab; icon: typeof Icon.Grid }[] = [
  { label: "Dashboard", icon: Icon.Grid },
  { label: "Inventory", icon: Icon.Car },
  { label: "Sales", icon: Icon.Tag },
  { label: "Customers", icon: Icon.Users },
  { label: "Reports", icon: Icon.Chart },
  { label: "Settings", icon: Icon.Settings },
];

const STATUS_STYLES: Record<CarStatus, string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  Reserved: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  Sold: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | CarStatus>("All");
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");

  // Modal state: null = closed, { car: null } = add, { car } = edit.
  const [modal, setModal] = useState<{ car: Car | null } | null>(null);
  const [deleting, setDeleting] = useState<Car | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCars(await listCars());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const current = getUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (checked) refresh();
  }, [checked, refresh]);

  const stats = useMemo(() => {
    const total = cars.length;
    const available = cars.filter((c) => c.status === "Available").length;
    const sold = cars.filter((c) => c.status === "Sold");
    const revenue = sold.reduce((sum, c) => sum + c.price, 0);
    const stockValue = cars
      .filter((c) => c.status !== "Sold")
      .reduce((s, c) => s + c.price, 0);
    return { total, available, soldCount: sold.length, revenue, stockValue };
  }, [cars]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cars.filter((c) => {
      const matchesQuery =
        !q ||
        c.model.toLowerCase().includes(q) ||
        c.make.toLowerCase().includes(q) ||
        String(c.id).includes(q);
      const matchesFilter = filter === "All" || c.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [cars, query, filter]);

  const soldCars = useMemo(() => cars.filter((c) => c.status === "Sold"), [cars]);
  const reservedCars = useMemo(() => cars.filter((c) => c.status === "Reserved"), [cars]);
  const avgSale = stats.soldCount ? stats.revenue / stats.soldCount : 0;

  // Inventory grouped by make, most stock first — used by the Reports tab.
  const byMake = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cars) counts.set(c.make, (counts.get(c.make) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [cars]);

  function handleSaved(saved: Car, wasEdit: boolean) {
    setCars((prev) =>
      wasEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    );
    setModal(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setRowError(null);
    try {
      await deleteCar(deleting.id);
      setCars((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to delete car");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleLogout() {
    clearUser();
    router.replace("/login");
  }

  // Avoid flashing protected content before the auth check runs.
  if (!checked || !user) return null;

  const displayName = user.name?.trim() || user.email.split("@")[0];
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  const showInventoryControls = activeTab === "Dashboard" || activeTab === "Inventory";

  // Shared props for the reusable inventory table.
  const tableCommon = {
    loading,
    loadError,
    onRetry: refresh,
    onEdit: (c: Car) => setModal({ car: c }),
    onDelete: (c: Car) => {
      setRowError(null);
      setDeleting(c);
    },
    rowError,
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/10 bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
            <Icon.Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Cars</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.label)}
              aria-current={activeTab === item.label ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === item.label
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-black/10 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-white/10 dark:bg-black/60">
          <div className="lg:hidden flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Icon.Car className="h-4 w-4" />
            </span>
          </div>

          {showInventoryControls ? (
            <div className="relative hidden flex-1 max-w-md sm:block">
              <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search inventory…"
                className="w-full rounded-lg border border-black/15 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white"
              />
            </div>
          ) : (
            <h2 className="hidden text-base font-semibold sm:block">{activeTab}</h2>
          )}

          <div className="ml-auto flex items-center gap-3">
            {showInventoryControls && (
              <button
                type="button"
                onClick={() => setModal({ car: null })}
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                <Icon.Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add car</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex items-center gap-2 rounded-full border border-black/15 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              <Icon.Logout className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>

        {/* Mobile tab nav (sidebar is hidden below lg) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-black/10 bg-white px-3 py-2 lg:hidden dark:border-white/10 dark:bg-zinc-950">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.label)}
              aria-current={activeTab === item.label ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === item.label
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/5"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Scrollable content */}
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            {/* ----- DASHBOARD ----- */}
            {activeTab === "Dashboard" && (
              <>
                <PageHeading
                  title={`Welcome back, ${displayName} 👋`}
                  subtitle="Here's what's happening across your dealership today."
                />

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total inventory" value={number.format(stats.total)} hint="vehicles in stock" icon={<Icon.Car className="h-5 w-5" />} />
                  <StatCard label="Available now" value={number.format(stats.available)} hint="ready to sell" icon={<Icon.Tag className="h-5 w-5" />} />
                  <StatCard label="Sold" value={number.format(stats.soldCount)} hint="closed deals" icon={<Icon.Up className="h-5 w-5" />} />
                  <StatCard label="Revenue" value={currency.format(stats.revenue)} hint="from closed deals" icon={<Icon.Chart className="h-5 w-5" />} />
                </section>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <InventoryTable
                      {...tableCommon}
                      title="Inventory"
                      subtitle={`${filtered.length} of ${cars.length} vehicles`}
                      items={filtered}
                      filter={filter}
                      onFilter={setFilter}
                      emptyMessage={
                        cars.length === 0
                          ? "No cars yet. Click “Add car” to create your first one."
                          : "No vehicles match your search."
                      }
                    />
                  </div>

                  <section className="flex flex-col gap-6">
                    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                      <h2 className="text-base font-semibold">Stock value</h2>
                      <p className="mt-1 text-xs text-zinc-500">Unsold inventory at list price</p>
                      <p className="mt-4 text-3xl font-semibold tracking-tight">{currency.format(stats.stockValue)}</p>
                      <div className="mt-4 space-y-3">
                        {STATUSES.map((s) => {
                          const count = cars.filter((c) => c.status === s).length;
                          const pct = cars.length ? Math.round((count / cars.length) * 100) : 0;
                          return <Bar key={s} label={s} value={`${count} · ${pct}%`} pct={pct} />;
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                      <h2 className="text-base font-semibold">Recently added</h2>
                      {cars.length === 0 ? (
                        <p className="mt-4 text-sm text-zinc-400">No vehicles yet.</p>
                      ) : (
                        <ul className="mt-4 space-y-4">
                          {[...cars].sort((a, b) => b.id - a.id).slice(0, 5).map((c) => (
                            <li key={c.id} className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                                <Icon.Car className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{c.make} {c.model}</p>
                                <p className="text-xs text-zinc-500">{c.year} · {currency.format(c.price)}</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}>
                                {c.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}

            {/* ----- INVENTORY ----- */}
            {activeTab === "Inventory" && (
              <>
                <PageHeading title="Inventory" subtitle="Manage every vehicle in your stock." />
                <InventoryTable
                  {...tableCommon}
                  title="All vehicles"
                  subtitle={`${filtered.length} of ${cars.length} vehicles`}
                  items={filtered}
                  filter={filter}
                  onFilter={setFilter}
                  emptyMessage={
                    cars.length === 0
                      ? "No cars yet. Click “Add car” to create your first one."
                      : "No vehicles match your search."
                  }
                />
              </>
            )}

            {/* ----- SALES ----- */}
            {activeTab === "Sales" && (
              <>
                <PageHeading title="Sales" subtitle="Closed deals and revenue performance." />
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Units sold" value={number.format(stats.soldCount)} hint="all time" icon={<Icon.Tag className="h-5 w-5" />} />
                  <StatCard label="Revenue" value={currency.format(stats.revenue)} hint="from closed deals" icon={<Icon.Chart className="h-5 w-5" />} />
                  <StatCard label="Avg. sale price" value={currency.format(avgSale)} hint="per vehicle" icon={<Icon.Up className="h-5 w-5" />} />
                  <StatCard label="Reserved" value={number.format(reservedCars.length)} hint="pending deals" icon={<Icon.Car className="h-5 w-5" />} />
                </section>
                <div className="mt-6">
                  <InventoryTable
                    {...tableCommon}
                    title="Closed deals"
                    subtitle={`${soldCars.length} sold`}
                    items={soldCars}
                    emptyMessage="No vehicles sold yet. Mark a car as “Sold” to see it here."
                  />
                </div>
              </>
            )}

            {/* ----- CUSTOMERS ----- */}
            {activeTab === "Customers" && (
              <>
                <PageHeading title="Customers" subtitle="Buyer records and contact history." />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-zinc-950">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
                    <Icon.Users className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">No customer records yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-zinc-500">
                    Customer management isn&apos;t connected to a backend yet. Once a
                    customers API exists, buyers and their purchase history will appear here.
                  </p>
                  <p className="mt-4 text-xs text-zinc-400">
                    {stats.soldCount} {stats.soldCount === 1 ? "deal has" : "deals have"} been closed so far.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="mt-6 cursor-not-allowed rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-white/15"
                  >
                    Add customer (coming soon)
                  </button>
                </div>
              </>
            )}

            {/* ----- REPORTS ----- */}
            {activeTab === "Reports" && (
              <>
                <PageHeading title="Reports" subtitle="Inventory and sales analytics." />
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Total units" value={number.format(stats.total)} hint="in catalogue" icon={<Icon.Car className="h-5 w-5" />} />
                  <StatCard label="Stock value" value={currency.format(stats.stockValue)} hint="unsold at list price" icon={<Icon.Tag className="h-5 w-5" />} />
                  <StatCard label="Revenue" value={currency.format(stats.revenue)} hint="from closed deals" icon={<Icon.Chart className="h-5 w-5" />} />
                  <StatCard label="Avg. sale price" value={currency.format(avgSale)} hint="per vehicle" icon={<Icon.Up className="h-5 w-5" />} />
                </section>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                    <h2 className="text-base font-semibold">Inventory by status</h2>
                    {cars.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-400">No data yet.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {STATUSES.map((s) => {
                          const count = cars.filter((c) => c.status === s).length;
                          const pct = Math.round((count / cars.length) * 100);
                          return <Bar key={s} label={s} value={`${count} · ${pct}%`} pct={pct} />;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                    <h2 className="text-base font-semibold">Inventory by make</h2>
                    {byMake.length === 0 ? (
                      <p className="mt-4 text-sm text-zinc-400">No data yet.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {byMake.map(([make, count]) => {
                          const pct = Math.round((count / cars.length) * 100);
                          return <Bar key={make} label={make} value={String(count)} pct={pct} />;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ----- SETTINGS ----- */}
            {activeTab === "Settings" && (
              <>
                <PageHeading title="Settings" subtitle="Your account and app preferences." />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                    <h2 className="text-base font-semibold">Account</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Row label="Name" value={user.name || "—"} />
                      <Row label="Email" value={user.email} />
                      <Row label="User ID" value={String(user.id)} />
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
                    <h2 className="text-base font-semibold">Preferences</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Row label="Appearance" value="Follows system theme" />
                      <Row label="Data source" value="cars-backend (live)" />
                      <Row label="Vehicles loaded" value={number.format(cars.length)} />
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
                      >
                        <Icon.Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh inventory
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                      >
                        <Icon.Logout className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <CarFormModal
          car={modal.car}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirmation */}
      {deleting && (
        <Overlay onClose={() => !deleteBusy && setDeleting(null)}>
          <h3 className="text-lg font-semibold">Delete car?</h3>
          <p className="mt-2 text-sm text-zinc-500">
            This permanently removes <span className="font-medium text-zinc-900 dark:text-zinc-100">{deleting.make} {deleting.model}</span> from your inventory. This can&apos;t be undone.
          </p>
          {rowError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{rowError}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleteBusy}
              className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {deleteBusy && <Icon.Spinner className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ---- Reusable inventory table ---------------------------------------------
function InventoryTable({
  title,
  subtitle,
  items,
  loading,
  loadError,
  onRetry,
  onEdit,
  onDelete,
  rowError,
  filter,
  onFilter,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  items: Car[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onEdit: (c: Car) => void;
  onDelete: (c: Car) => void;
  rowError: string | null;
  filter?: "All" | CarStatus;
  onFilter?: (f: "All" | CarStatus) => void;
  emptyMessage?: string;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-4 dark:border-white/10">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-xs text-zinc-500">{loading ? "Loading…" : subtitle}</p>
        </div>
        {onFilter && filter !== undefined && (
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5">
            {(["All", ...STATUSES] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {rowError && (
        <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {rowError}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-zinc-400 dark:border-white/10">
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Year</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Mileage</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !loadError && items.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.make} {c.model}</div>
                  <div className="text-xs text-zinc-400">#{c.id}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.year}</td>
                <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell dark:text-zinc-400">{number.format(c.mileage)} mi</td>
                <td className="px-4 py-3 font-medium">{currency.format(c.price)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      title="Edit"
                      className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Icon.Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(c)}
                      title="Delete"
                      className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Icon.Trash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                  <Icon.Spinner className="mx-auto h-5 w-5 animate-spin" />
                  <span className="mt-2 block">Loading inventory…</span>
                </td>
              </tr>
            )}

            {!loading && loadError && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm">
                  <p className="text-red-600 dark:text-red-400">{loadError}</p>
                  <button
                    onClick={onRetry}
                    className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!loading && !loadError && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                  {emptyMessage ?? "Nothing to show."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---- Add / Edit form modal -------------------------------------------------
function CarFormModal({
  car,
  onClose,
  onSaved,
}: {
  car: Car | null;
  onClose: () => void;
  onSaved: (saved: Car, wasEdit: boolean) => void;
}) {
  const isEdit = car !== null;
  const [form, setForm] = useState<CarInput>({
    make: car?.make ?? "",
    model: car?.model ?? "",
    year: car?.year ?? new Date().getFullYear(),
    price: car?.price ?? 0,
    mileage: car?.mileage ?? 0,
    status: car?.status ?? "Available",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof CarInput>(key: K, value: CarInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: CarInput = {
        ...form,
        make: form.make.trim(),
        model: form.model.trim(),
      };
      const saved = isEdit
        ? await updateCar(car!.id, payload)
        : await createCar(payload);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save car");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black dark:border-white/20 dark:focus:border-white";
  const labelCls = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <Overlay onClose={() => !busy && onClose()}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isEdit ? "Edit car" : "Add car"}</h3>
        <button onClick={() => !busy && onClose()} className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white">
          <Icon.Close className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className={labelCls}>
            Make
            <input className={field} required value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Tesla" />
          </label>
          <label className={labelCls}>
            Model
            <input className={field} required value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Model S" />
          </label>
          <label className={labelCls}>
            Year
            <input className={field} type="number" required min={1900} max={2100} value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
          </label>
          <label className={labelCls}>
            Status
            <select className={field} value={form.status} onChange={(e) => set("status", e.target.value as CarStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Price (USD)
            <input className={field} type="number" required min={0} step={1} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
          </label>
          <label className={labelCls}>
            Mileage
            <input className={field} type="number" required min={0} step={1} value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
        )}

        <div className="mt-1 flex justify-end gap-3">
          <button type="button" onClick={() => !busy && onClose()} disabled={busy} className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            {busy && <Icon.Spinner className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add car"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

// ---- Small presentational helpers -----------------------------------------
function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}

function Bar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

// ---- Reusable centered modal overlay --------------------------------------
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
        {icon}
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm font-medium text-zinc-500">{label}</p>
      <p className="text-xs text-zinc-400">{hint}</p>
    </div>
  );
}
