"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, CalendarRange, X, Edit3, Eye, EyeOff } from "lucide-react";
import { getAdminSession, isOwnerAdmin, type AdminSession } from "@/lib/admin-auth";

interface EventRow {
  id: string;
  title: string;
  date: string;
  startAt: string | null;
  city: string;
  venue: string;
  featuredArtists: string[];
  ticketStatus: "Available" | "Limited" | "Sold Out";
  ticketUrl: string | null;
  isPast: boolean;
  published: boolean;
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  Available: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
  Limited: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  "Sold Out": "text-zinc-400 bg-zinc-400/10 border-zinc-400/30",
};

const EMPTY_FORM = {
  title: "",
  date: "",
  startAt: "",
  city: "",
  venue: "",
  featuredArtistsCsv: "",
  ticketStatus: "Available" as EventRow["ticketStatus"],
  ticketUrl: "",
  isPast: false,
  published: true,
};

export default function EventsAdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit/create modal
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    if (!isOwnerAdmin(s)) router.replace("/admin");
  }, [router]);

  const headers = useMemo(
    () => ({ "x-admin-email": session?.email ?? "" }),
    [session?.email]
  );

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", { headers });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && isOwnerAdmin(session)) fetchRows();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditingId("new");
    setForm(EMPTY_FORM);
    setFormError("");
  };
  const openEdit = (row: EventRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      date: row.date,
      startAt: row.startAt ? row.startAt.slice(0, 10) : "",
      city: row.city,
      venue: row.venue,
      featuredArtistsCsv: row.featuredArtists.join(", "),
      ticketStatus: row.ticketStatus,
      ticketUrl: row.ticketUrl ?? "",
      isPast: row.isPast,
      published: row.published,
    });
    setFormError("");
  };
  const closeModal = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.date.trim() || !form.city.trim() || !form.venue.trim()) {
      setFormError("Title, date, city, and venue are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        date: form.date,
        startAt: form.startAt || undefined,
        city: form.city,
        venue: form.venue,
        featuredArtists: form.featuredArtistsCsv.split(",").map((s) => s.trim()).filter(Boolean),
        ticketStatus: form.ticketStatus,
        ticketUrl: form.ticketUrl,
        isPast: form.isPast,
        published: form.published,
      };
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/admin/events" : `/api/admin/events/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Save failed" }));
        setFormError(data.error || "Save failed");
        return;
      }
      const saved = await res.json();
      setRows((prev) => {
        if (isNew) return [saved, ...prev];
        return prev.map((r) => (r.id === saved.id ? saved : r));
      });
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (row: EventRow) => {
    const res = await fetch(`/api/admin/events/${row.id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ published: !row.published }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    }
  };

  const remove = async (row: EventRow) => {
    if (!confirm(`Delete event "${row.title}"? Cannot be undone.`)) return;
    const res = await fetch(`/api/admin/events/${row.id}`, { method: "DELETE", headers });
    if (res.ok) setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  if (!session || !isOwnerAdmin(session)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Owner access only</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Owner-only
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display uppercase text-3xl tracking-tight inline-flex items-center gap-3">
            <CalendarRange size={22} className="text-pink-300" />
            Events
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRows}
              disabled={loading}
              className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              <Plus size={13} /> Add Event
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-4">
        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {rows.length} event{rows.length === 1 ? "" : "s"}
        </p>

        {rows.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CalendarRange size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400 mb-2">
              {loading ? "Loading..." : "No events in the database yet."}
            </p>
            <p className="text-xs text-zinc-500">
              The public /events page is showing the default seed events until you add real ones here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${STATUS_COLOR[row.ticketStatus]}`}>
                      {row.ticketStatus}
                    </span>
                    {row.isPast && (
                      <span className="text-[9px] tracking-[0.18em] uppercase border border-zinc-600 text-zinc-400 rounded-full px-2 py-0.5">
                        Past
                      </span>
                    )}
                    {!row.published && (
                      <span className="text-[9px] tracking-[0.18em] uppercase border border-amber-500/30 text-amber-300 bg-amber-500/10 rounded-full px-2 py-0.5">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="font-display text-lg text-foreground">{row.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {row.date} · {row.venue} · {row.city}
                  </p>
                  {row.featuredArtists.length > 0 && (
                    <p className="text-[11px] text-zinc-500 mt-1">{row.featuredArtists.join(" · ")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => togglePublished(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 text-[10px] tracking-[0.18em] uppercase transition-colors"
                  >
                    {row.published ? <Eye size={11} /> : <EyeOff size={11} />}
                    {row.published ? "Live" : "Draft"}
                  </button>
                  <button
                    onClick={() => openEdit(row)}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground"
                    title="Edit"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => remove(row)}
                    className="p-2 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display uppercase text-xl tracking-tight">
                {editingId === "new" ? "Add Event" : "Edit Event"}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-foreground" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Display Date</label>
                  <input type="text" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    placeholder="August 2, 2026"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" required />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Start Date (for sort)</label>
                  <input type="date" value={form.startAt} onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Washington, DC"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" required />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Venue</label>
                  <input type="text" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="The Anthem"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Featured Artists (comma-separated)</label>
                <input type="text" value={form.featuredArtistsCsv} onChange={(e) => setForm((f) => ({ ...f, featuredArtistsCsv: e.target.value }))}
                  placeholder="Foolery, Tone Brady"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Ticket Status</label>
                  <select value={form.ticketStatus} onChange={(e) => setForm((f) => ({ ...f, ticketStatus: e.target.value as EventRow["ticketStatus"] }))}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60">
                    <option value="Available" className="bg-zinc-900">Available</option>
                    <option value="Limited" className="bg-zinc-900">Limited</option>
                    <option value="Sold Out" className="bg-zinc-900">Sold Out</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Ticket URL (optional)</label>
                  <input type="url" value={form.ticketUrl} onChange={(e) => setForm((f) => ({ ...f, ticketUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60" />
                </div>
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={form.isPast} onChange={(e) => setForm((f) => ({ ...f, isPast: e.target.checked }))} className="accent-pink-400" />
                  Past event
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="accent-pink-400" />
                  Published (visible on /events)
                </label>
              </div>
              {formError && <p className="text-xs text-rose-400">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-full border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50">
                  {saving ? "Saving..." : editingId === "new" ? "Create" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
