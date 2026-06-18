"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearUser, type AppUser } from "../lib/auth";
import AiAssistant from "./AiAssistant";
import Showroom from "./Showroom";
import CustomersPanel from "./CustomersPanel";
import SalesPanel from "./SalesPanel";
import { toastSuccess } from "../lib/toast";
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
  Sun: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
  Moon: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
  ),
  Grip: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className}><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" /></svg>
  ),
  Cube: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  Upload: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 9 5-5 5 5" /><path d="M12 4v12" /></svg>
  ),
};

type Tab = "Dashboard" | "Inventory" | "Showroom" | "Sales" | "Customers" | "Reports" | "Settings";

const NAV: { label: Tab; icon: typeof Icon.Grid }[] = [
  { label: "Dashboard", icon: Icon.Grid },
  { label: "Inventory", icon: Icon.Car },
  { label: "Showroom", icon: Icon.Cube },
  { label: "Sales", icon: Icon.Tag },
  { label: "Customers", icon: Icon.Users },
  { label: "Reports", icon: Icon.Chart },
  { label: "Settings", icon: Icon.Settings },
];

// Keys for the reorderable dashboard KPI cards (drag to rearrange; saved to localStorage).
const DEFAULT_KPI_ORDER = ["total", "available", "sold", "revenue"];
const KPI_STORAGE_KEY = "kpiOrder";

// Accent color (Settings tab). Persisted to localStorage; applied to --accent.
const DEFAULT_ACCENT = "#4f46e5";
const ACCENT_STORAGE_KEY = "accent";
const ACCENT_PRESETS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Sky", hex: "#0284c7" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Amber", hex: "#d97706" },
  { name: "Slate", hex: "#475569" },
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState(DEFAULT_ACCENT);

  // Drag-to-reorder state for the KPI cards.
  const [kpiOrder, setKpiOrder] = useState<string[]>(DEFAULT_KPI_ORDER);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Profile popup (top-right avatar menu).
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Reflect the theme + accent the init script already applied.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    try {
      const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (savedAccent) setAccent(savedAccent);
    } catch {}
  }, []);

  // Close the profile popup when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!profileOpen) return;
    function onDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  // Restore a saved KPI card order (only if it's a valid permutation of the keys).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KPI_STORAGE_KEY);
      if (!saved) return;
      const arr = JSON.parse(saved) as string[];
      const valid =
        Array.isArray(arr) &&
        arr.length === DEFAULT_KPI_ORDER.length &&
        DEFAULT_KPI_ORDER.every((k) => arr.includes(k));
      if (valid) setKpiOrder(arr);
    } catch {}
  }, []);

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
      toastSuccess("Car deleted");
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

  function setThemeTo(next: "light" | "dark") {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  function toggleTheme() {
    setThemeTo(theme === "dark" ? "light" : "dark");
  }

  // Apply an accent color app-wide (drives the --accent CSS variable) and persist it.
  function applyAccent(hex: string) {
    document.documentElement.style.setProperty("--accent", hex);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, hex);
    } catch {}
    setAccent(hex);
  }

  function resetPreferences() {
    applyAccent(DEFAULT_ACCENT);
    setThemeTo("light");
    setKpiOrder(DEFAULT_KPI_ORDER);
    try {
      localStorage.removeItem(KPI_STORAGE_KEY);
    } catch {}
  }

  // Move the dragged KPI card to the dropped-on card's position and persist.
  function moveKpi(targetKey: string) {
    setDragOverKey(null);
    if (!dragKey || dragKey === targetKey) return;
    const next = [...kpiOrder];
    const from = next.indexOf(dragKey);
    const to = next.indexOf(targetKey);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    setKpiOrder(next);
    setDragKey(null);
    try {
      localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(next));
    } catch {}
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
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Definitions for the reorderable KPI cards, keyed so order can be persisted.
  const kpiCards: Record<string, { label: string; value: string; hint: string; icon: React.ReactNode; accent: string }> = {
    total: { label: "Total inventory", value: number.format(stats.total), hint: "vehicles in stock", icon: <Icon.Car className="h-5 w-5" />, accent: "indigo" },
    available: { label: "Available now", value: number.format(stats.available), hint: "ready to sell", icon: <Icon.Tag className="h-5 w-5" />, accent: "emerald" },
    sold: { label: "Sold", value: number.format(stats.soldCount), hint: "closed deals", icon: <Icon.Up className="h-5 w-5" />, accent: "violet" },
    revenue: { label: "Revenue", value: currency.format(stats.revenue), hint: "from closed deals", icon: <Icon.Chart className="h-5 w-5" />, accent: "amber" },
  };

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
    <div className="flex min-h-screen w-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-black/10 bg-white px-4 py-6 lg:flex dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
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
                  ? "bg-[var(--accent)] text-white"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
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
                className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Icon.Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add car</span>
              </button>
            )}
            <button
              onClick={toggleTheme}
              type="button"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
              aria-pressed={theme === "dark"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-zinc-600 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {theme === "dark" ? <Icon.Sun className="h-4 w-4" /> : <Icon.Moon className="h-4 w-4" />}
            </button>
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                type="button"
                title="Account"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {initials}
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3 border-b border-black/5 p-4 dark:border-white/10">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>

                  <dl className="space-y-2 p-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500">Name</dt>
                      <dd className="truncate font-medium">{user.name || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500">Email</dt>
                      <dd className="truncate font-medium">{user.email}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-zinc-500">User ID</dt>
                      <dd className="font-medium">{user.id}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-black/5 p-2 dark:border-white/10">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Icon.Logout className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile tab nav (sidebar is hidden below lg) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-black/10 bg-white px-3 py-2 lg:hidden dark:border-white/10 dark:bg-zinc-900">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setActiveTab(item.label)}
              aria-current={activeTab === item.label ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === item.label
                  ? "bg-[var(--accent)] text-white"
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
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                      Overview
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                      Welcome back, {displayName}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                      Here&apos;s what&apos;s happening across your dealership today.
                    </p>
                  </div>
                  <p className="text-sm font-medium text-zinc-400">{today}</p>
                </div>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {kpiOrder.map((key) => {
                    const card = kpiCards[key];
                    if (!card) return null;
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => setDragKey(key)}
                        onDragEnd={() => { setDragKey(null); setDragOverKey(null); }}
                        onDragOver={(e) => { e.preventDefault(); if (dragOverKey !== key) setDragOverKey(key); }}
                        onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                        onDrop={() => moveKpi(key)}
                        title="Drag to reorder"
                        className={`group relative cursor-grab rounded-2xl transition active:cursor-grabbing ${
                          dragKey === key ? "opacity-40" : ""
                        } ${dragOverKey === key && dragKey && dragKey !== key ? "ring-2 ring-black/30 dark:ring-white/40" : ""}`}
                      >
                        <Icon.Grip className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
                        <StatCard label={card.label} value={card.value} hint={card.hint} icon={card.icon} accent={card.accent} />
                      </div>
                    );
                  })}
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
                    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
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

            {/* ----- SHOWROOM ----- */}
            {activeTab === "Showroom" && (
              <>
                <PageHeading title="Showroom" subtitle="View your vehicles in 3D — rotate, zoom, and inspect." />
                <Showroom cars={cars} />
              </>
            )}

            {/* ----- SALES ----- */}
            {activeTab === "Sales" && <SalesPanel onSaleRecorded={refresh} />}

            {/* ----- CUSTOMERS ----- */}
            {activeTab === "Customers" && <CustomersPanel />}

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
                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
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

                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
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
                <PageHeading title="Settings" subtitle="Personalize the app and manage your account." />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Appearance */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
                    <h2 className="text-base font-semibold">Appearance</h2>
                    <p className="mt-1 text-xs text-zinc-500">Customize how the dashboard looks.</p>

                    {/* Theme */}
                    <div className="mt-5">
                      <p className="text-sm font-medium">Theme</p>
                      <div className="mt-2 inline-flex rounded-lg border border-black/10 p-1 dark:border-white/15">
                        {(["light", "dark"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setThemeTo(t)}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                              theme === t
                                ? "bg-[var(--accent)] text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                          >
                            {t === "dark" ? <Icon.Moon className="h-4 w-4" /> : <Icon.Sun className="h-4 w-4" />}
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent color */}
                    <div className="mt-6">
                      <p className="text-sm font-medium">Accent color</p>
                      <p className="text-xs text-zinc-500">Recolors buttons, highlights and the active menu.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        {ACCENT_PRESETS.map((p) => (
                          <button
                            key={p.hex}
                            onClick={() => applyAccent(p.hex)}
                            title={p.name}
                            aria-label={p.name}
                            aria-pressed={accent.toLowerCase() === p.hex.toLowerCase()}
                            className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                              accent.toLowerCase() === p.hex.toLowerCase()
                                ? "ring-2 ring-offset-2 ring-zinc-900 ring-offset-white dark:ring-white dark:ring-offset-zinc-900"
                                : ""
                            }`}
                            style={{ backgroundColor: p.hex }}
                          />
                        ))}
                        {/* Custom color */}
                        <label
                          title="Custom color"
                          className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-black/25 text-sm text-zinc-400 dark:border-white/30"
                        >
                          <input
                            type="color"
                            value={accent}
                            onChange={(e) => applyAccent(e.target.value)}
                            className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0 opacity-0"
                          />
                          <span className="pointer-events-none absolute">+</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={resetPreferences}
                      className="mt-6 rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  {/* Account & data */}
                  <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
                    <h2 className="text-base font-semibold">Account</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Row label="Name" value={user.name || "—"} />
                      <Row label="Email" value={user.email} />
                      <Row label="User ID" value={String(user.id)} />
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
                        className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
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

      {/* AI inventory assistant (floating, all tabs) */}
      <AiAssistant cars={cars} />
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
    <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
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
    imageUrl: car?.imageUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Real-world makes/models from the free NHTSA API (for autocomplete).
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  // VIN decoder.
  const [vin, setVin] = useState("");
  const [decoding, setDecoding] = useState(false);

  function set<K extends keyof CarInput>(key: K, value: CarInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Decode a VIN -> auto-fill make / model / year (free NHTSA API).
  async function decodeVin() {
    const v = vin.trim();
    if (!v) return;
    setDecoding(true);
    setError(null);
    try {
      const res = await fetch(`/api/decode-vin?vin=${encodeURIComponent(v)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setForm((f) => ({
        ...f,
        make: data.make || f.make,
        model: data.model || f.model,
        year: data.year ? Number(data.year) : f.year,
      }));
      toastSuccess("VIN decoded");
    } catch {
      setError("Could not decode the VIN.");
    } finally {
      setDecoding(false);
    }
  }

  // Load the list of real car makes once.
  useEffect(() => {
    let active = true;
    fetch("/api/vehicle-data")
      .then((r) => r.json())
      .then((d) => active && setMakes(Array.isArray(d.makes) ? d.makes : []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load real models whenever the make changes (debounced).
  useEffect(() => {
    const make = form.make.trim();
    if (!make) {
      setModels([]);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      fetch(`/api/vehicle-data?make=${encodeURIComponent(make)}`)
        .then((r) => r.json())
        .then((d) => active && setModels(Array.isArray(d.models) ? d.models : []))
        .catch(() => {});
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [form.make]);

  // Read an uploaded image as a base64 data URL so it can be saved to the DB.
  function handleFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image is too large — please use one under 2 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => set("imageUrl", String(reader.result));
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsDataURL(file);
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
        imageUrl: form.imageUrl?.trim() || "",
      };
      const saved = isEdit
        ? await updateCar(car!.id, payload)
        : await createCar(payload);
      onSaved(saved, isEdit);
      toastSuccess(isEdit ? "Car updated" : "Car added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save car");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)] dark:border-white/20";
  const labelCls = "flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const hasImage = !!form.imageUrl?.trim();
  const isUploaded = !!form.imageUrl?.startsWith("data:");

  return (
    <Overlay onClose={() => !busy && onClose()} size="lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{isEdit ? "Edit car" : "Add car"}</h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            {isEdit ? "Update this vehicle's details and photo." : "Add a new vehicle to your inventory."}
          </p>
        </div>
        <button onClick={() => !busy && onClose()} className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white">
          <Icon.Close className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        {/* VIN decoder */}
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Decode from VIN <span className="font-normal text-zinc-400">(optional)</span>
          </span>
          <div className="mt-1.5 flex gap-2">
            <input
              className={`${field} flex-1 uppercase tracking-wide`}
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="17-character VIN"
              maxLength={17}
            />
            <button
              type="button"
              onClick={decodeVin}
              disabled={decoding || !vin.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {decoding && <Icon.Spinner className="h-4 w-4 animate-spin" />}
              Decode
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-400">Auto-fills make, model and year.</p>
        </div>

        {/* Photo upload */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Photo</span>

          {hasImage ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl as string}
                alt="Car preview"
                className="h-48 w-full rounded-xl border border-black/10 object-cover dark:border-white/10"
                onError={() => setError("That image couldn't be loaded.")}
              />
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                title="Remove photo"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
              >
                <Icon.Trash className="h-4 w-4" />
              </button>
              <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
                {isUploaded ? "Uploaded" : "From URL"}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
              className={`flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm transition-colors ${
                dragOver
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : "border-black/15 hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
              }`}
            >
              <Icon.Upload className="h-7 w-7 text-zinc-400" />
              <span className="font-medium">Click to upload or drag &amp; drop</span>
              <span className="text-xs text-zinc-400">PNG, JPG or WEBP · up to 2&nbsp;MB · saved with the car</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <input
            className={field}
            type="url"
            value={isUploaded ? "" : (form.imageUrl ?? "")}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="…or paste an image URL"
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <label className={labelCls}>
            Make
            <input className={field} required list="nhtsa-makes" value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Tesla" autoComplete="off" />
            <datalist id="nhtsa-makes">
              {makes.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>
          <label className={labelCls}>
            Model
            <input className={field} required list="nhtsa-models" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Model S" autoComplete="off" />
            <datalist id="nhtsa-models">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
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
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
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
function Overlay({
  children,
  onClose,
  size = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm [animation:overlayFadeIn_120ms_ease-out]"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 shadow-2xl [animation:popupIn_160ms_cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-zinc-900 ${
          size === "lg" ? "max-w-lg" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

const STAT_ACCENTS: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
};

function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "indigo",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900 dark:ring-0">
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${STAT_ACCENTS[accent] ?? STAT_ACCENTS.indigo}`}>
          {icon}
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}
