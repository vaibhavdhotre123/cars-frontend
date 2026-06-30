"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listCars, type Car } from "../lib/cars";
import { listCustomers, type Customer } from "../lib/customers";
import { listDeals, type Deal } from "../lib/deals";
import { DonutChart, BarList, AreaChart } from "./Charts";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsPanel() {
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, cu, d] = await Promise.all([listCars(), listCustomers(), listDeals()]);
      setCars(c);
      setCustomers(cu);
      setDeals(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const kpis = useMemo(() => {
    const revenue = deals.reduce((s, d) => s + d.salePrice, 0);
    const stockValue = cars.filter((c) => c.status !== "Sold").reduce((s, c) => s + c.price, 0);
    const avg = deals.length ? revenue / deals.length : 0;
    return { totalCars: cars.length, stockValue, revenue, units: deals.length, customers: customers.length, avg };
  }, [cars, customers, deals]);

  const inventoryStatus = useMemo(
    () => [
      { label: "Available", value: cars.filter((c) => c.status === "Available").length, color: "#10b981" },
      { label: "Reserved", value: cars.filter((c) => c.status === "Reserved").length, color: "#f59e0b" },
      { label: "Sold", value: cars.filter((c) => c.status === "Sold").length, color: "#71717a" },
    ],
    [cars]
  );

  const customerStatus = useMemo(
    () => [
      { label: "Lead", value: customers.filter((c) => c.status === "Lead").length, color: "#0ea5e9" },
      { label: "Active", value: customers.filter((c) => c.status === "Active").length, color: "#10b981" },
      { label: "Inactive", value: customers.filter((c) => c.status === "Inactive").length, color: "#a1a1aa" },
    ],
    [customers]
  );

  const byMake = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cars) m.set(c.make, (m.get(c.make) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [cars]);

  const topCustomers = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of deals) m.set(d.customerName, (m.get(d.customerName) ?? 0) + d.salePrice);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [deals]);

  const revenueByMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of deals) {
      const key = (d.soldDate || "").slice(0, 7); // YYYY-MM
      if (key) m.set(key, (m.get(key) ?? 0) + d.salePrice);
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => {
        const mm = Number(k.slice(5, 7));
        return { label: MONTHS[mm - 1] ?? k, value: v };
      });
  }, [deals]);

  if (loading) {
    return (
      <>
        <Heading />
        <div className="flex h-60 items-center justify-center text-sm text-zinc-400">Loading analytics…</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Heading />
        <div className="rounded-2xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-zinc-900">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={refresh} className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">Retry</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Heading />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Total cars" value={number.format(kpis.totalCars)} />
        <Kpi label="Stock value" value={currency.format(kpis.stockValue)} />
        <Kpi label="Revenue" value={currency.format(kpis.revenue)} />
        <Kpi label="Units sold" value={number.format(kpis.units)} />
        <Kpi label="Customers" value={number.format(kpis.customers)} />
      </section>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Revenue over time" subtitle="Sales revenue by month">
          <AreaChart data={revenueByMonth} format={(n) => currency.format(n)} />
        </Card>

        <Card title="Inventory by status">
          <DonutChart data={inventoryStatus} centerLabel="cars" />
        </Card>

        <Card title="Top makes" subtitle="Vehicles in stock by manufacturer">
          <BarList data={byMake} />
        </Card>

        <Card title="Customers by status">
          <DonutChart data={customerStatus} centerLabel="people" />
        </Card>

        <Card title="Top customers" subtitle="By total spend" className="lg:col-span-2">
          {topCustomers.length ? (
            <BarList data={topCustomers} format={(n) => currency.format(n)} />
          ) : (
            <p className="text-sm text-zinc-400">No sales recorded yet.</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Heading() {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Reports</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-zinc-500">Inventory, sales and customer insights.</p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
    </div>
  );
}

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 ${className}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
