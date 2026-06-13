"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, Search, UserCog, X, Check, KeyRound, Eye, EyeOff, Building2, Clock, ShieldCheck, Music, Shield } from "lucide-react";
import { getAdminSession, isOwnerAdmin, type AdminSession } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

interface ArtistAssignment {
  id: string;
  artistId: string;
}

interface AgentLogin {
  id: string;
  email: string;
  name: string;
  role: "agent" | "admin" | "owner";
  isActive: boolean;
  createdAt: string;
  artistAssignments: ArtistAssignment[];
}

interface ArtistOption {
  id: string;
  name: string;
}

export default function AgentLoginsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [rows, setRows] = useState<AgentLogin[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", artistIds: [] as string[] });
  const [createError, setCreateError] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Inline reset-password state
  const [resetForId, setResetForId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Venue access drawer state (Phase 3.6 / Workflow C)
  type VenueAccessSummary = {
    agent: { id: string; email: string; name: string };
    pendingRequests: Array<{ id: string; venueId: string; requestedAt: string; reason: string; venue: { id: string; name: string; city: string; state: string } | null }>;
    grants: Array<{ id: string; venueId: string; grantedAt: string; grantedBy: string; venue: { id: string; name: string; city: string; state: string } | null }>;
  };
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessAgent, setAccessAgent] = useState<AgentLogin | null>(null);
  const [accessData, setAccessData] = useState<VenueAccessSummary | null>(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [grantSearch, setGrantSearch] = useState("");
  const [venueOptions, setVenueOptions] = useState<Array<{ id: string; name: string; city: string; state: string }>>([]);

  const loadAccess = async (agentId: string) => {
    if (!session) return;
    setAccessLoading(true);
    try {
      const [accessRes, venuesRes] = await Promise.all([
        fetch(`/api/admin/agent-logins/${agentId}/venue-access`, { headers: ownerHeaders, cache: "no-store" }),
        fetch("/api/admin/venues", { headers: ownerHeaders, cache: "no-store" }),
      ]);
      const access = accessRes.ok ? await accessRes.json() : null;
      const venues = venuesRes.ok ? await venuesRes.json() : [];
      setAccessData(access);
      setVenueOptions(
        Array.isArray(venues)
          ? venues.map((v: { id: string; name: string; city?: string; state?: string }) => ({
              id: v.id,
              name: v.name,
              city: v.city ?? "",
              state: v.state ?? "",
            }))
          : []
      );
    } finally {
      setAccessLoading(false);
    }
  };

  const openVenueAccess = (agent: AgentLogin) => {
    setAccessAgent(agent);
    setAccessOpen(true);
    setAccessData(null);
    setGrantSearch("");
    loadAccess(agent.id);
  };

  const accessAction = async (
    action: "approve" | "deny" | "grant" | "revoke" | "approveAll",
    payload: { requestId?: string; venueId?: string } = {}
  ) => {
    if (!accessAgent || !session) return;
    await fetch(`/api/admin/agent-logins/${accessAgent.id}/venue-access`, {
      method: "POST",
      headers: { ...ownerHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    await loadAccess(accessAgent.id);
  };

  // Artist assignment drawer state (Phase 3.7 pre)
  type ArtistAssignmentSummary = {
    agent: { id: string; name: string; email: string };
    artists: Array<{ id: string; name: string; status: string; image: string; primaryGenre: string }>;
  };
  const [artistsOpen, setArtistsOpen] = useState(false);
  const [artistsAgent, setArtistsAgent] = useState<AgentLogin | null>(null);
  const [artistsData, setArtistsData] = useState<ArtistAssignmentSummary | null>(null);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistsSearch, setArtistsSearch] = useState("");
  const [artistsSelected, setArtistsSelected] = useState<Set<string>>(new Set());
  const [artistsSaving, setArtistsSaving] = useState(false);

  // Pool of ALL artists in the system (for the multi-select picker)
  const [allArtists, setAllArtists] = useState<Array<{ id: string; name: string; primaryGenre: string; status: string }>>([]);

  const loadArtists = async (agentId: string) => {
    if (!session) return;
    setArtistsLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        fetch(`/api/admin/agent-logins/${agentId}/artists`, {
          headers: ownerHeaders,
          cache: "no-store",
        }),
        fetch("/api/admin/artists", { headers: ownerHeaders, cache: "no-store" }),
      ]);
      if (assignedRes.ok) {
        const data = (await assignedRes.json()) as ArtistAssignmentSummary;
        setArtistsData(data);
        setArtistsSelected(new Set(data.artists.map((a) => a.id)));
      }
      if (allRes.ok) {
        const all = await allRes.json();
        setAllArtists(
          Array.isArray(all)
            ? all.map((a: { id: string; name: string; primaryGenre?: string; status?: string }) => ({
                id: a.id,
                name: a.name,
                primaryGenre: a.primaryGenre ?? "",
                status: a.status ?? "",
              }))
            : []
        );
      }
    } finally {
      setArtistsLoading(false);
    }
  };

  const openArtists = (agent: AgentLogin) => {
    setArtistsAgent(agent);
    setArtistsOpen(true);
    setArtistsData(null);
    setArtistsSelected(new Set());
    setArtistsSearch("");
    loadArtists(agent.id);
  };

  const toggleArtist = (id: string) =>
    setArtistsSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const saveArtistAssignments = async () => {
    if (!artistsAgent || !session) return;
    setArtistsSaving(true);
    try {
      await fetch(`/api/admin/agent-logins/${artistsAgent.id}/artists`, {
        method: "PUT",
        headers: { ...ownerHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ artistIds: Array.from(artistsSelected) }),
      });
      // Refresh the row counts in the list (Assigned: ...)
      await fetchRows();
      setArtistsOpen(false);
    } finally {
      setArtistsSaving(false);
    }
  };

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    if (!isOwnerAdmin(s)) {
      router.replace("/admin");
    }
  }, [router]);

  const ownerHeaders = useMemo(
    () => ({ "x-admin-email": session?.email ?? "" }),
    [session?.email]
  );

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agent-logins", { headers: ownerHeaders });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch("/api/admin/artists", { headers: ownerHeaders });
      const data = await res.json();
      const list = (Array.isArray(data) ? data : data.artists ?? []) as Array<{ id: string; name: string }>;
      setArtists(list.map((a) => ({ id: a.id, name: a.name })));
    } catch {
      setArtists([]);
    }
  };

  useEffect(() => {
    if (!session || !isOwnerAdmin(session)) return;
    fetchRows();
    fetchArtists();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError("Name, email, and password are required.");
      return;
    }
    if (createForm.password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    setCreateSaving(true);
    try {
      const res = await fetch("/api/admin/agent-logins", {
        method: "POST",
        headers: { ...ownerHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          password: createForm.password,
          artistIds: createForm.artistIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create.");
        return;
      }
      setRows((prev) => [data, ...prev]);
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", artistIds: [] });
      setShowCreatePassword(false);
    } finally {
      setCreateSaving(false);
    }
  };

  const toggleActive = async (row: AgentLogin) => {
    const res = await fetch(`/api/admin/agent-logins/${row.id}`, {
      method: "PATCH",
      headers: { ...ownerHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
    }
  };

  const submitReset = async (id: string) => {
    if (!resetPassword.trim() || resetPassword.length < 8) return;
    const res = await fetch(`/api/admin/agent-logins/${id}`, {
      method: "PATCH",
      headers: { ...ownerHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    if (res.ok) {
      setResetForId(null);
      setResetPassword("");
      setShowResetPassword(false);
    }
  };

  const changeRole = async (row: AgentLogin, newRole: string) => {
    const res = await fetch(`/api/admin/agent-logins/${row.id}`, {
      method: "PATCH",
      headers: { ...ownerHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
    }
  };

  const remove = async (row: AgentLogin) => {
    if (!confirm(`Delete agent login for ${row.email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/agent-logins/${row.id}`, {
      method: "DELETE",
      headers: ownerHeaders,
    });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    }
  };

  const toggleArtistInCreate = (artistId: string) => {
    setCreateForm((f) => {
      const has = f.artistIds.includes(artistId);
      return { ...f, artistIds: has ? f.artistIds.filter((id) => id !== artistId) : [...f.artistIds, artistId] };
    });
  };

  const artistNameFor = (artistId: string) =>
    artists.find((a) => a.id === artistId)?.name ?? artistId;

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
            <UserCog size={22} className="text-pink-300" />
            Agent Logins
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
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold"
            >
              <Plus size={13} /> Add Agent
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
          />
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} agent{filtered.length === 1 ? "" : "s"}
        </p>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <UserCog size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              {loading ? "Loading..." : "No agent logins yet. Add one to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row, i) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{row.name}</span>
                    <span
                      className={`text-[9px] tracking-[0.18em] uppercase rounded-full px-2 py-0.5 border ${
                        row.isActive
                          ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"
                          : "text-zinc-400 border-zinc-500/30 bg-zinc-500/10"
                      }`}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                    <span
                      className={`text-[9px] tracking-[0.18em] uppercase rounded-full px-2 py-0.5 border ${
                        row.role === "owner"
                          ? "text-pink-300 border-pink-400/30 bg-pink-400/10"
                          : row.role === "admin"
                          ? "text-violet-300 border-violet-400/30 bg-violet-400/10"
                          : "text-sky-300 border-sky-400/30 bg-sky-400/10"
                      }`}
                    >
                      {row.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 break-all">{row.email}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Assigned: {row.artistAssignments.length === 0
                      ? "none"
                      : row.artistAssignments.map((a) => artistNameFor(a.artistId)).join(" · ")}
                  </p>
                  {resetForId === row.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showResetPassword ? "text" : "password"}
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="New password (≥8 chars)"
                          className="w-full pr-10 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          aria-label={showResetPassword ? "Hide password" : "Show password"}
                        >
                          {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        onClick={() => submitReset(row.id)}
                        className="p-2 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => { setResetForId(null); setResetPassword(""); setShowResetPassword(false); }}
                        className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-300"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleActive(row)}
                    className="text-[10px] tracking-[0.18em] uppercase px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors"
                  >
                    {row.isActive ? "Deactivate" : "Activate"}
                  </button>
                  {resetForId !== row.id && (
                    <button
                      onClick={() => { setResetForId(row.id); setResetPassword(""); }}
                      className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-3 py-2 rounded-lg border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 text-amber-200 transition-colors"
                    >
                      <KeyRound size={11} /> Reset Pwd
                    </button>
                  )}
                  <button
                    onClick={() => openArtists(row)}
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-3 py-2 rounded-lg border border-violet-500/30 hover:border-violet-500/60 bg-violet-500/10 text-violet-200 transition-colors"
                    title="Manage artist assignments for this agent"
                  >
                    <Music size={11} /> Artists ({row.artistAssignments.length})
                  </button>
                  <button
                    onClick={() => openVenueAccess(row)}
                    className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase px-3 py-2 rounded-lg border border-pink-500/30 hover:border-pink-500/60 bg-pink-500/10 text-pink-200 transition-colors"
                    title="Manage venue contact access for this agent"
                  >
                    <Building2 size={11} /> Venue Access
                  </button>
                  {session?.dbRole === "owner" && (
                    <div className="inline-flex items-center gap-1.5">
                      <Shield size={11} className="text-zinc-500" />
                      <select
                        value={row.role}
                        onChange={(e) => changeRole(row, e.target.value)}
                        className="text-[10px] tracking-[0.12em] uppercase px-2 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/60 text-zinc-200 transition-colors cursor-pointer focus:outline-none focus:border-pink-400/60"
                        title="Change role"
                      >
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                  )}
                  <button
                    onClick={() => remove(row)}
                    className="p-2 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors"
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

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display uppercase text-xl tracking-tight">Add Agent</h2>
              <button
                onClick={() => { setCreateOpen(false); setCreateError(""); }}
                className="p-1.5 text-zinc-400 hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitCreate} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Password (≥8 chars)</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full pr-10 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label={showCreatePassword ? "Hide password" : "Show password"}
                  >
                    {showCreatePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">
                  Assigned Artists <span className="text-zinc-600 normal-case tracking-normal">({createForm.artistIds.length} selected)</span>
                </label>
                <div className="max-h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-2 space-y-1">
                  {artists.length === 0 ? (
                    <p className="text-xs text-zinc-500 p-2">No artists in roster yet.</p>
                  ) : (
                    artists.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.artistIds.includes(a.id)}
                          onChange={() => toggleArtistInCreate(a.id)}
                          className="accent-pink-400"
                        />
                        <span className="text-sm text-zinc-200">{a.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {createError && (
                <p className="text-xs text-rose-400">{createError}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setCreateOpen(false); setCreateError(""); }}
                  className="flex-1 py-2.5 rounded-full border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="flex-1 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                >
                  {createSaving ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Artist Assignment drawer — Phase 3.7 pre */}
      {artistsOpen && artistsAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-stretch justify-end p-0 sm:p-4 sm:items-center sm:justify-center" onClick={() => setArtistsOpen(false)}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-none sm:rounded-2xl p-5 sm:p-6 w-full max-w-2xl max-h-screen sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 inline-flex items-center gap-1.5"><Music size={10} className="text-violet-300" /> Artist Assignments</p>
                <h2 className="font-display uppercase text-xl tracking-tight">{artistsAgent.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">{artistsAgent.email}</p>
              </div>
              <button onClick={() => setArtistsOpen(false)} className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </div>

            {artistsLoading || !artistsData ? (
              <div className="py-10 text-center text-sm text-zinc-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  This agent currently sees <strong className="text-violet-300">{artistsSelected.size}</strong> {artistsSelected.size === 1 ? "artist" : "artists"} on /admin/artists. Check or uncheck to change.
                </p>

                <input
                  type="text"
                  value={artistsSearch}
                  onChange={(e) => setArtistsSearch(e.target.value)}
                  placeholder="Search all artists by name..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/60"
                />

                <ul className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {allArtists
                    .filter((a) => !artistsSearch.trim() || a.name.toLowerCase().includes(artistsSearch.trim().toLowerCase()))
                    .map((a) => {
                      const checked = artistsSelected.has(a.id);
                      return (
                        <li key={a.id}>
                          <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                            checked
                              ? "border-violet-400/30 bg-violet-400/5"
                              : "border-white/5 hover:border-white/15 bg-black/20"
                          }`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleArtist(a.id)}
                              className="accent-violet-400 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-zinc-200 truncate">{a.name}</div>
                              <div className="text-[10px] text-zinc-500">{a.primaryGenre || a.status || "—"}</div>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  {allArtists.length === 0 && (
                    <li className="text-xs text-zinc-600 italic p-3">No artists in the system yet.</li>
                  )}
                </ul>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setArtistsOpen(false)}
                    className="px-4 py-2 rounded-full border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground hover:border-white/25 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveArtistAssignments}
                    disabled={artistsSaving}
                    className="flex-1 py-2 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                  >
                    {artistsSaving ? "Saving..." : `Save (${artistsSelected.size} assigned)`}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Venue Access drawer — Phase 3.6 / Workflow C */}
      {accessOpen && accessAgent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-stretch justify-end p-0 sm:p-4 sm:items-center sm:justify-center" onClick={() => setAccessOpen(false)}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-none sm:rounded-2xl p-5 sm:p-6 w-full max-w-2xl max-h-screen sm:max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Venue Contact Access</p>
                <h2 className="font-display uppercase text-xl tracking-tight">{accessAgent.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">{accessAgent.email}</p>
              </div>
              <button onClick={() => setAccessOpen(false)} className="p-2 rounded-lg border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </div>

            {accessLoading || !accessData ? (
              <div className="py-10 text-center text-sm text-zinc-500">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Pending requests */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
                      <Clock size={12} className="text-amber-300" />
                      Pending Requests ({accessData.pendingRequests.length})
                    </h3>
                    {accessData.pendingRequests.length > 1 && (
                      <button
                        onClick={() => accessAction("approveAll")}
                        className="text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 transition-colors"
                      >
                        Approve all
                      </button>
                    )}
                  </div>
                  {accessData.pendingRequests.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No pending requests.</p>
                  ) : (
                    <ul className="space-y-2">
                      {accessData.pendingRequests.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-400/15 bg-amber-400/5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-100 truncate">{r.venue?.name ?? `Venue ${r.venueId.slice(0, 8)}`}</div>
                            <div className="text-[10px] text-zinc-500">
                              {[r.venue?.city, r.venue?.state].filter(Boolean).join(", ") || "Location unknown"} · requested {new Date(r.requestedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => accessAction("approve", { requestId: r.id })}
                              className="p-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 transition-colors"
                              title="Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => accessAction("deny", { requestId: r.id })}
                              className="p-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 transition-colors"
                              title="Deny"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Active grants */}
                <section>
                  <h3 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3 inline-flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-300" />
                    Granted Venues ({accessData.grants.length})
                  </h3>
                  {accessData.grants.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">No venues granted.</p>
                  ) : (
                    <ul className="space-y-2">
                      {accessData.grants.map((g) => (
                        <li key={g.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-400/15 bg-emerald-400/5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-zinc-100 truncate">{g.venue?.name ?? `Venue ${g.venueId.slice(0, 8)}`}</div>
                            <div className="text-[10px] text-zinc-500">
                              {[g.venue?.city, g.venue?.state].filter(Boolean).join(", ") || "Location unknown"} · granted {new Date(g.grantedAt).toLocaleDateString()} by {g.grantedBy}
                            </div>
                          </div>
                          <button
                            onClick={() => accessAction("revoke", { venueId: g.venueId })}
                            className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 transition-colors shrink-0"
                            title="Revoke access"
                          >
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Grant a new venue without a prior request */}
                <section>
                  <h3 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Grant access to additional venue</h3>
                  <input
                    type="text"
                    value={grantSearch}
                    onChange={(e) => setGrantSearch(e.target.value)}
                    placeholder="Search venues by name..."
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 mb-2"
                  />
                  {grantSearch.trim() && (
                    <ul className="space-y-1 max-h-48 overflow-y-auto border border-white/5 rounded-xl p-2">
                      {venueOptions
                        .filter((v) => {
                          const grantedIds = new Set(accessData.grants.map((g) => g.venueId));
                          return !grantedIds.has(v.id) && v.name.toLowerCase().includes(grantSearch.trim().toLowerCase());
                        })
                        .slice(0, 20)
                        .map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/4 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-zinc-200 truncate">{v.name}</div>
                              <div className="text-[10px] text-zinc-500">{[v.city, v.state].filter(Boolean).join(", ") || "—"}</div>
                            </div>
                            <button
                              onClick={() => accessAction("grant", { venueId: v.id })}
                              className="text-[10px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 transition-colors shrink-0"
                            >
                              + Grant
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
