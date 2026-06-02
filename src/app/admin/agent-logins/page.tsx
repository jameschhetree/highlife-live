"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, RefreshCw, Search, UserCog, X, Check, KeyRound, Eye, EyeOff } from "lucide-react";
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
    </div>
  );
}
