"use client";

// /admin/events — Phase 3.9 Scope 6 rewrite.
// - Owners: full CRUD + Event Card Request queue + hide past/draft toggles.
// - Agents: read-only list, scoped to events featuring their assigned artists.
//   Cannot publish/hide, cannot edit, cannot delete.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  CalendarRange,
  X,
  Edit3,
  Eye,
  EyeOff,
  Inbox,
} from "lucide-react";
import { getAdminSession, isOwnerAdmin, type AdminSession } from "@/lib/admin-auth";

interface EventRow {
  id: string;
  title: string;
  date: string;
  startAt: string | null;
  city: string;
  venue: string;
  featuredArtists: string[];
  featuredArtistIds: string[];
  externalArtists: string[];
  ticketStatus: "Available" | "Limited" | "Sold Out";
  ticketUrl: string | null;
  isPast: boolean;
  published: boolean;
  description: string | null;
  showDescription: boolean;
  address: string | null;
  showAddress: boolean;
  customBannerEnabled: boolean;
  bannerUrl: string | null;
  createdAt: string;
}

interface ArtistOption {
  id: string;
  name: string;
}

interface EventCardRequest {
  id: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  venueAddress: string | null;
  ticketLink: string | null;
  description: string | null;
  artistIds: string[];
  bookingId: string | null;
  inquiryId: string | null;
  status: string;
  createdAt: string;
  requestedByAgent: { id: string; email: string; name: string };
  booking: { id: string; artistName: string } | null;
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
  featuredArtistIds: [] as string[],
  externalArtistsCsv: "",
  ticketStatus: "Available" as EventRow["ticketStatus"],
  ticketUrl: "",
  isPast: false,
  published: true,
  description: "",
  showDescription: true,
  address: "",
  showAddress: true,
  customBannerEnabled: false,
  bannerUrl: "",
  bookingId: "",
  fromEventCardRequestId: "",
};

export default function EventsAdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [artistOptions, setArtistOptions] = useState<ArtistOption[]>([]);
  const [ecrs, setEcrs] = useState<EventCardRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [showPast, setShowPast] = useState(false);
  const [showDrafts, setShowDrafts] = useState(true);

  const [queueOpen, setQueueOpen] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
  }, []);

  const headers = useMemo(
    () => ({ "x-admin-email": session?.email ?? "" }),
    [session?.email],
  );

  const fetchRows = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events", { headers });
      const data = res.ok ? await res.json() : [];
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [session, headers]);

  const fetchArtistOptions = useCallback(async () => {
    if (!session || !isOwnerAdmin(session)) return;
    const res = await fetch("/api/admin/artists", { headers });
    if (res.ok) {
      const data = await res.json();
      setArtistOptions(
        (Array.isArray(data) ? data : []).map((a: { id: string; name: string }) => ({
          id: a.id,
          name: a.name,
        })),
      );
    }
  }, [session, headers]);

  const fetchEcrs = useCallback(async () => {
    if (!session || !isOwnerAdmin(session)) return;
    const res = await fetch("/api/admin/event-card-requests", { headers });
    if (res.ok) setEcrs(await res.json());
  }, [session, headers]);

  useEffect(() => {
    if (session) {
      fetchRows();
      fetchArtistOptions();
      fetchEcrs();
    }
  }, [session, fetchRows, fetchArtistOptions, fetchEcrs]);

  const ownerAdmin = isOwnerAdmin(session);

  const visibleRows = rows.filter((r) => {
    if (!showPast && r.isPast) return false;
    if (!showDrafts && !r.published) return false;
    return true;
  });

  const openNew = (prefill?: Partial<typeof EMPTY_FORM>) => {
    setEditingId("new");
    setForm({ ...EMPTY_FORM, ...prefill });
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
      featuredArtistIds: row.featuredArtistIds ?? [],
      externalArtistsCsv: (row.externalArtists ?? []).join(", "),
      ticketStatus: row.ticketStatus,
      ticketUrl: row.ticketUrl ?? "",
      isPast: row.isPast,
      published: row.published,
      description: row.description ?? "",
      showDescription: row.showDescription !== false,
      address: row.address ?? "",
      showAddress: row.showAddress !== false,
      customBannerEnabled: Boolean(row.customBannerEnabled),
      bannerUrl: row.bannerUrl ?? "",
      bookingId: "",
      fromEventCardRequestId: "",
    });
    setFormError("");
  };
  const closeModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.date.trim() || !form.city.trim() || !form.venue.trim()) {
      setFormError("Title, date, city, and venue are required.");
      return;
    }
    setSaving(true);
    try {
      const externalArtists = form.externalArtistsCsv.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        title: form.title,
        date: form.date,
        startAt: form.startAt || undefined,
        city: form.city,
        venue: form.venue,
        featuredArtistIds: form.featuredArtistIds,
        externalArtists,
        ticketStatus: form.ticketStatus,
        ticketUrl: form.ticketUrl,
        isPast: form.isPast,
        published: form.published,
        description: form.description,
        showDescription: form.showDescription,
        address: form.address,
        showAddress: form.showAddress,
        customBannerEnabled: form.customBannerEnabled,
        bannerUrl: form.bannerUrl,
        bookingId: form.bookingId || undefined,
        fromEventCardRequestId: form.fromEventCardRequestId || undefined,
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
      if (isNew && form.fromEventCardRequestId) {
        // refresh queue so the request is marked Created
        await fetchEcrs();
      }
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

  const createFromRequest = (ecr: EventCardRequest) => {
    openNew({
      title: ecr.eventTitle,
      date: ecr.eventDate,
      startAt: ecr.eventDate.match(/^\d{4}-\d{2}-\d{2}$/) ? ecr.eventDate : "",
      city: "",
      venue: ecr.venueName,
      address: ecr.venueAddress ?? "",
      description: ecr.description ?? "",
      ticketUrl: ecr.ticketLink ?? "",
      featuredArtistIds: ecr.artistIds,
      bookingId: ecr.bookingId ?? "",
      fromEventCardRequestId: ecr.id,
    });
    setQueueOpen(false);
  };

  const removeEcr = async (id: string) => {
    if (!confirm("Delete this event card request?")) return;
    const res = await fetch(`/api/admin/event-card-requests/${id}`, { method: "DELETE", headers });
    if (res.ok) setEcrs((prev) => prev.filter((e) => e.id !== id));
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Loading…</span>
      </div>
    );
  }

  const pendingCount = ecrs.filter((e) => e.status === "Pending").length;

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · {ownerAdmin ? "Owner" : "Agent (scoped)"}
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display uppercase text-3xl tracking-tight inline-flex items-center gap-3">
            <CalendarRange size={22} className="text-pink-300" />
            Events
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchRows}
              disabled={loading}
              className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            {ownerAdmin && (
              <>
                <button
                  onClick={() => setQueueOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-pink-400/40 bg-black/40 text-zinc-200 text-[10px] tracking-[0.18em] uppercase transition-colors"
                  title="Event Card Request queue"
                >
                  <Inbox size={12} />
                  Event Card Requests
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => openNew()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
                >
                  <Plus size={13} /> Add Event
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-4">
        {/* Toggles */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] tracking-[0.18em] uppercase">
          <button
            onClick={() => setShowPast((v) => !v)}
            className={`px-3 py-1.5 rounded-full border transition-colors ${
              showPast
                ? "border-zinc-400/40 bg-zinc-400/10 text-zinc-200"
                : "border-white/10 text-zinc-400 hover:border-white/25"
            }`}
          >
            {showPast ? "Past: shown" : "Show past"}
          </button>
          {ownerAdmin && (
            <button
              onClick={() => setShowDrafts((v) => !v)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                showDrafts
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                  : "border-white/10 text-zinc-400 hover:border-white/25"
              }`}
            >
              {showDrafts ? "Drafts: shown" : "Hide drafts"}
            </button>
          )}
          <span className="text-zinc-500 ml-1">{visibleRows.length} of {rows.length}</span>
        </div>

        {visibleRows.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CalendarRange size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400 mb-2">
              {loading ? "Loading..." : "No events to show."}
            </p>
            {!ownerAdmin && (
              <p className="text-xs text-zinc-500">
                Events appear here when one of your assigned artists is featured.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRows.map((row) => (
              <div
                key={row.id}
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
                  <p className="font-display text-lg text-foreground break-words">{row.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 break-words">
                    {row.date} · {row.venue} · {row.city}
                  </p>
                  {row.featuredArtists.length > 0 && (
                    <p className="text-[11px] text-zinc-500 mt-1 break-words">{row.featuredArtists.join(" · ")}</p>
                  )}
                </div>
                {ownerAdmin && (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit modal — owner only */}
      {ownerAdmin && editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display uppercase text-xl tracking-tight">
                {editingId === "new" ? "Add Event" : "Edit Event"}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-zinc-400 hover:text-foreground" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <Row>
                <Label>Title</Label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  required
                />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row>
                  <Label>Display Date</Label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    placeholder="August 2, 2026"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                    required
                  />
                </Row>
                <Row>
                  <Label>Start Date (for sort)</Label>
                  <input
                    type="date"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  />
                </Row>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Row>
                  <Label>City</Label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Washington, DC"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                    required
                  />
                </Row>
                <Row>
                  <Label>Venue</Label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="The Anthem"
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                    required
                  />
                </Row>
              </div>
              <Row>
                <div className="flex items-center justify-between">
                  <Label>Address</Label>
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={form.showAddress}
                      onChange={(e) => setForm((f) => ({ ...f, showAddress: e.target.checked }))}
                      className="accent-pink-400"
                    />
                    Show on public card
                  </label>
                </div>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main St, City"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
              </Row>
              <Row>
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={form.showDescription}
                      onChange={(e) => setForm((f) => ({ ...f, showDescription: e.target.checked }))}
                      className="accent-pink-400"
                    />
                    Show on public card
                  </label>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                />
              </Row>
              <Row>
                <Label>Featured Artists (DB-linked, multi-select)</Label>
                <select
                  multiple
                  value={form.featuredArtistIds}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      featuredArtistIds: Array.from(e.target.selectedOptions).map((o) => o.value),
                    }))
                  }
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60 min-h-[120px]"
                >
                  {artistOptions.map((a) => (
                    <option key={a.id} value={a.id} className="bg-zinc-900">
                      {a.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">Cmd/Ctrl-click to select multiple.</p>
              </Row>
              <Row>
                <Label>External Acts (comma-separated free text)</Label>
                <input
                  type="text"
                  value={form.externalArtistsCsv}
                  onChange={(e) => setForm((f) => ({ ...f, externalArtistsCsv: e.target.value }))}
                  placeholder="Guest DJ, Surprise opener"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                />
              </Row>
              <Row>
                <div className="flex items-center justify-between">
                  <Label>Banner</Label>
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={form.customBannerEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, customBannerEnabled: e.target.checked }))}
                      className="accent-pink-400"
                    />
                    Use custom banner
                  </label>
                </div>
                <input
                  type="url"
                  value={form.bannerUrl}
                  onChange={(e) => setForm((f) => ({ ...f, bannerUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  disabled={!form.customBannerEnabled}
                />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row>
                  <Label>Ticket Status</Label>
                  <select
                    value={form.ticketStatus}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ticketStatus: e.target.value as EventRow["ticketStatus"] }))
                    }
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  >
                    <option value="Available" className="bg-zinc-900">Available</option>
                    <option value="Limited" className="bg-zinc-900">Limited</option>
                    <option value="Sold Out" className="bg-zinc-900">Sold Out</option>
                  </select>
                </Row>
                <Row>
                  <Label>Ticket URL</Label>
                  <input
                    type="url"
                    value={form.ticketUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ticketUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  />
                </Row>
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.isPast}
                    onChange={(e) => setForm((f) => ({ ...f, isPast: e.target.checked }))}
                    className="accent-pink-400"
                  />
                  Past event
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                    className="accent-pink-400"
                  />
                  Published (visible on /events)
                </label>
              </div>
              {formError && <p className="text-xs text-rose-400">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-full border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId === "new" ? "Create" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Card Request queue — owner only */}
      {ownerAdmin && queueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setQueueOpen(false)}>
          <div
            className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display uppercase text-xl tracking-tight">Event Card Requests</h2>
              <button onClick={() => setQueueOpen(false)} className="p-1.5 text-zinc-400 hover:text-foreground" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            {ecrs.length === 0 ? (
              <p className="text-sm text-zinc-500">No requests yet. Agents file these from Booking detail.</p>
            ) : (
              <ul className="space-y-3">
                {ecrs.map((r) => (
                  <li key={r.id} className="p-4 rounded-xl border border-white/8 bg-black/30">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500 mb-1">
                          {r.requestedByAgent.name || r.requestedByAgent.email} · {r.status}
                        </p>
                        <p className="text-sm text-foreground font-medium break-words">{r.eventTitle}</p>
                        <p className="text-xs text-zinc-400 break-words">
                          {r.eventDate} · {r.venueName}
                          {r.venueAddress ? ` · ${r.venueAddress}` : ""}
                        </p>
                        {r.description && (
                          <p className="text-xs text-zinc-300 mt-2 whitespace-pre-wrap break-words">{r.description}</p>
                        )}
                        {r.ticketLink && (
                          <a href={r.ticketLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-pink-300 hover:text-pink-200 inline-block mt-1.5 break-all">
                            {r.ticketLink}
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {r.status !== "Created" && (
                          <button
                            onClick={() => createFromRequest(r)}
                            className="text-[10px] tracking-[0.18em] uppercase btn-gradient font-bold rounded-full px-3 py-1.5"
                          >
                            Create Event
                          </button>
                        )}
                        <button
                          onClick={() => removeEcr(r.id)}
                          className="text-[10px] tracking-[0.18em] uppercase border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 rounded-full px-3 py-1.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">{children}</label>;
}
