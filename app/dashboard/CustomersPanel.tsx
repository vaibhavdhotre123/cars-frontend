"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CustomerInput,
  type CustomerStatus,
} from "../lib/customers";

const STATUSES: CustomerStatus[] = ["Lead", "Active", "Inactive"];

const STATUS_STYLES: Record<CustomerStatus, string> = {
  Lead: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  Inactive: "bg-zinc-100 text-zinc-600 ring-zinc-500/20 dark:bg-white/10 dark:text-zinc-300 dark:ring-white/15",
};

type IconProps = { className?: string };
const I = {
  Plus: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 5v14M5 12h14" /></svg>),
  Edit: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>),
  Trash: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>),
  Close: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  Search: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>),
  Spinner: (p: IconProps) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={p.className}><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>),
};

export default function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | CustomerStatus>("All");

  const [modal, setModal] = useState<{ customer: Customer | null } | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCustomers(await listCustomers());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    return {
      total: customers.length,
      lead: customers.filter((c) => c.status === "Lead").length,
      active: customers.filter((c) => c.status === "Active").length,
      inactive: customers.filter((c) => c.status === "Inactive").length,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q);
      const matchesFilter = filter === "All" || c.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [customers, query, filter]);

  function handleSaved(saved: Customer, wasEdit: boolean) {
    setCustomers((prev) =>
      wasEdit ? prev.map((c) => (c.id === saved.id ? saved : c)) : [...prev, saved]
    );
    setModal(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setRowError(null);
    try {
      await deleteCustomer(deleting.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Customers</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Customer records</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage leads and buyers.</p>
        </div>
        <button
          onClick={() => setModal({ customer: null })}
          className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <I.Plus className="h-4 w-4" />
          Add customer
        </button>
      </div>

      {/* Stat chips */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="Leads" value={counts.lead} />
        <Stat label="Active" value={counts.active} />
        <Stat label="Inactive" value={counts.inactive} />
      </div>

      {/* Table card */}
      <section className="rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 p-4 dark:border-white/10">
          <div className="relative w-full max-w-xs">
            <I.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers…"
              className="w-full rounded-lg border border-black/15 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)] dark:border-white/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5">
            {(["All", ...STATUSES] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-black shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {rowError && (
          <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{rowError}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-zinc-400 dark:border-white/10">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Phone</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">City</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !loadError && filtered.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-zinc-400">{c.email}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 sm:table-cell dark:text-zinc-400">{c.phone}</td>
                  <td className="hidden px-4 py-3 text-zinc-600 md:table-cell dark:text-zinc-400">{c.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ customer: c })} title="Edit" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white">
                        <I.Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => { setRowError(null); setDeleting(c); }} title="Delete" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400">
                        <I.Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400"><I.Spinner className="mx-auto h-5 w-5 animate-spin" /><span className="mt-2 block">Loading customers…</span></td></tr>
              )}

              {!loading && loadError && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm"><p className="text-red-600 dark:text-red-400">{loadError}</p><button onClick={refresh} className="mt-3 rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">Retry</button></td></tr>
              )}

              {!loading && !loadError && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400">{customers.length === 0 ? "No customers yet. Click “Add customer” to create your first one." : "No customers match your search."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modal && (
        <CustomerFormModal customer={modal.customer} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}

      {deleting && (
        <Overlay onClose={() => !deleteBusy && setDeleting(null)}>
          <h3 className="text-lg font-semibold">Delete customer?</h3>
          <p className="mt-2 text-sm text-zinc-500">
            This permanently removes <span className="font-medium text-zinc-900 dark:text-zinc-100">{deleting.name}</span>. This can&apos;t be undone.
          </p>
          {rowError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{rowError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">Cancel</button>
            <button onClick={confirmDelete} disabled={deleteBusy} className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60">
              {deleteBusy && <I.Spinner className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
    </div>
  );
}

function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (saved: Customer, wasEdit: boolean) => void;
}) {
  const isEdit = customer !== null;
  const [form, setForm] = useState<CustomerInput>({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    city: customer?.city ?? "",
    status: customer?.status ?? "Lead",
    notes: customer?.notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload: CustomerInput = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city?.trim() || "",
        notes: form.notes?.trim() || "",
      };
      const saved = isEdit
        ? await updateCustomer(customer!.id, payload)
        : await createCustomer(payload);
      onSaved(saved, isEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
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
          <h3 className="text-lg font-semibold">{isEdit ? "Edit customer" : "Add customer"}</h3>
          <p className="mt-0.5 text-sm text-zinc-500">{isEdit ? "Update this customer's details." : "Add a new customer or lead."}</p>
        </div>
        <button onClick={() => !busy && onClose()} className="rounded-md p-1 text-zinc-400 hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white">
          <I.Close className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <label className={labelCls}>
          Name
          <input className={field} required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={labelCls}>
            Email
            <input className={field} type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
          </label>
          <label className={labelCls}>
            Phone
            <input className={field} required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="555-0100" />
          </label>
          <label className={labelCls}>
            City
            <input className={field} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
          </label>
          <label className={labelCls}>
            Status
            <select className={field} value={form.status} onChange={(e) => set("status", e.target.value as CustomerStatus)}>
              {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </label>
        </div>
        <label className={labelCls}>
          Notes <span className="font-normal text-zinc-400">(optional)</span>
          <textarea className={`${field} min-h-20 resize-y`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Interested in SUVs, follow up next week…" />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

        <div className="mt-1 flex justify-end gap-3">
          <button type="button" onClick={() => !busy && onClose()} disabled={busy} className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10">Cancel</button>
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {busy && <I.Spinner className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
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
