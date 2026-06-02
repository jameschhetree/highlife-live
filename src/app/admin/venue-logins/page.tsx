"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Building2,
  KeyRound,
  UserPlus,
  Trash2,
  Undo2,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { canManageVenueLogins, getAdminSession, type AdminSession } from "@/lib/admin-auth";

interface PartnerRequest {
  id: string;
  accountType: string;
  organizationName: string;
  address: string;
  role: string;
  contactName: string;
  workPhone: string;
  mobilePhone: string;
  workEmail: string;
  requestedLoginEmail: string;
  preferredGenre: string;
  howHeard: string;
  extraNotes: string;
  status: string;
  submittedAt: string;
}

interface VenueLoginRow {
  id: string;
  email: string;
  displayName: string;
  organizationName: string;
  accountType: string;
  isActive: boolean;
  sourceRequestId: string | null;
  createdAt: string;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  New: { bg: "bg-amber-400/10", text: "text-amber-300", border: "border-amber-400/30" },
  Approved: { bg: "bg-sky-400/10", text: "text-sky-300", border: "border-sky-400/30" },
  Rejected: { bg: "bg-rose-400/10", text: "text-rose-300", border: "border-rose-400/30" },
  Converted: { bg: "bg-emerald-400/10", text: "text-emerald-300", border: "border-emerald-400/30" },
  Archived: { bg: "bg-zinc-400/10", text: "text-zinc-400", border: "border-zinc-400/30" },
};

export default function VenueLoginsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [tab, setTab] = useState<"requests" | "logins">("requests");

  // Requests state
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Logins state
  const [logins, setLogins] = useState<VenueLoginRow[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(false);

  // Undo state (client-side soft delete)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ displayName: "", organizationName: "", email: "" });

  // Create login modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFrom, setCreateFrom] = useState<PartnerRequest | null>(null);
  const [createForm, setCreateForm] = useState({ email: "", password: "", displayName: "", organizationName: "", accountType: "Venue" });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const current = getAdminSession();
    if (!current || !canManageVenueLogins(current)) {
      router.replace("/admin");
      return;
    }
    setSession(current);
    setAccessChecked(true);
  }, [router]);

  const fetchRequests = useCallback(async () => {
    if (!session) return;
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/admin/venue-logins/requests", {
        headers: { "x-admin-email": session.email },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } finally {
      setRequestsLoading(false);
    }
  }, [session]);

  const fetchLogins = useCallback(async () => {
    if (!session) return;
    setLoginsLoading(true);
    try {
      const res = await fetch("/api/admin/venue-logins", {
        headers: { "x-admin-email": session.email },
      });
      const data = await res.json();
      setLogins(Array.isArray(data) ? data : []);
    } finally {
      setLoginsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (accessChecked) {
      fetchRequests();
      fetchLogins();
    }
  }, [accessChecked, fetchRequests, fetchLogins]);

  const updateRequestStatus = async (id: string, status: string) => {
    if (!session) return;
    await fetch("/api/admin/venue-logins/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": session.email },
      body: JSON.stringify({ id, status }),
    });
    fetchRequests();
  };

  const openCreateFromRequest = (req: PartnerRequest) => {
    setCreateFrom(req);
    setCreateForm({
      email: req.requestedLoginEmail,
      password: "",
      displayName: req.contactName,
      organizationName: req.organizationName,
      accountType: req.accountType,
    });
    setShowCreateModal(true);
  };

  const openCreateNew = () => {
    setCreateFrom(null);
    setCreateForm({ email: "", password: "", displayName: "", organizationName: "", accountType: "Venue" });
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!session || !createForm.email || !createForm.password || !createForm.displayName) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/venue-logins", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({
          ...createForm,
          sourceRequestId: createFrom?.id || undefined,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchLogins();
        if (createFrom) fetchRequests();
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRemoveLogin = async (id: string) => {
    if (!session) return;
    setRemovedIds((prev) => new Set(prev).add(id));
  };

  const handleUndoRemove = (id: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const confirmRemove = async (id: string) => {
    if (!session) return;
    await fetch(`/api/admin/venue-logins/${id}`, {
      method: "DELETE",
      headers: { "x-admin-email": session.email },
    });
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    fetchLogins();
  };

  const startEdit = (login: VenueLoginRow) => {
    setEditingId(login.id);
    setEditForm({ displayName: login.displayName, organizationName: login.organizationName, email: login.email });
  };

  const saveEdit = async () => {
    if (!session || !editingId) return;
    await fetch(`/api/admin/venue-logins/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-email": session.email },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    fetchLogins();
  };

  const cancelEdit = () => setEditingId(null);

  const newCount = requests.filter((r) => r.status === "New").length;
  const isLoading = tab === "requests" ? requestsLoading : loginsLoading;
  const visibleLogins = logins.filter((l) => !removedIds.has(l.id));

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      {/* Header */}
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Venue Partner Management
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display uppercase text-3xl tracking-tight">Venue Logins</h1>
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-pink-200 bg-pink-500/15 border border-pink-500/30 rounded-full px-2.5 py-1">
                {newCount} New
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateNew}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors text-[10px] tracking-[0.18em] uppercase"
            >
              <UserPlus size={13} /> Add Login
            </button>
            <button
              onClick={() => { fetchRequests(); fetchLogins(); }}
              disabled={isLoading}
              className="p-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-5">
        {/* Tab nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 rounded-full border transition-colors ${
              tab === "requests"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-zinc-300 border-white/10 hover:border-white/25 hover:text-foreground"
            }`}
          >
            <Building2 size={13} /> Requests
            {newCount > 0 && <span className="text-pink-300 ml-1">{newCount}</span>}
          </button>
          <button
            onClick={() => setTab("logins")}
            className={`flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase px-4 py-2.5 rounded-full border transition-colors ${
              tab === "logins"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-zinc-300 border-white/10 hover:border-white/25 hover:text-foreground"
            }`}
          >
            <KeyRound size={13} /> Active Logins
            <span className="text-zinc-500 ml-1">{visibleLogins.length}</span>
          </button>
        </div>

        {/* REQUESTS TAB */}
        {tab === "requests" && (
          <>
            <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
              {requests.length} request{requests.length === 1 ? "" : "s"}
            </p>

            {requests.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Building2 size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-sm text-zinc-400">
                  {requestsLoading ? "Loading..." : "No partner login requests yet."}
                </p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Type</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Organization</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden md:table-cell">Contact</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden lg:table-cell">Role</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden lg:table-cell">Login Email</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden xl:table-cell">Phone</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden xl:table-cell">Genre</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Status</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden lg:table-cell">Submitted</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req, i) => {
                        const sc = STATUS_COLOR[req.status] ?? STATUS_COLOR.New;
                        const phones = [req.workPhone, req.mobilePhone].filter(Boolean).join(" / ");
                        return (
                          <motion.tr
                            key={req.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25, delay: i * 0.02 }}
                            className="border-b border-white/4 last:border-0 hover:bg-white/4 transition-colors"
                          >
                            <td className="px-2.5 sm:px-4 py-3">
                              <span className={`text-[10px] tracking-[0.18em] uppercase rounded-full px-2 py-0.5 border ${
                                req.accountType === "Venue"
                                  ? "text-sky-300 border-sky-400/30 bg-sky-400/10"
                                  : "text-violet-300 border-violet-400/30 bg-violet-400/10"
                              }`}>
                                {req.accountType}
                              </span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3">
                              <span className="text-zinc-200 font-medium text-[12px]">{req.organizationName}</span>
                              {req.address && (
                                <span className="block text-[10px] text-zinc-500 mt-0.5">{req.address}</span>
                              )}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                              <span className="text-zinc-300 text-[11px] block">{req.contactName}</span>
                              <span className="text-zinc-500 text-[10px]">{req.workEmail}</span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden lg:table-cell text-zinc-400 text-[11px]">{req.role}</td>
                            <td className="px-2.5 sm:px-4 py-3 hidden lg:table-cell text-zinc-300 text-[11px]">{req.requestedLoginEmail}</td>
                            <td className="px-2.5 sm:px-4 py-3 hidden xl:table-cell text-zinc-400 text-[10px]">{phones || "---"}</td>
                            <td className="px-2.5 sm:px-4 py-3 hidden xl:table-cell text-zinc-400 text-[11px]">{req.preferredGenre || "---"}</td>
                            <td className="px-2.5 sm:px-4 py-3">
                              <span className={`text-[10px] tracking-[0.18em] uppercase rounded-full px-2.5 py-1 border ${sc.bg} ${sc.text} ${sc.border}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden lg:table-cell text-zinc-500 text-[11px]">
                              {new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {req.status === "New" && (
                                  <>
                                    <button
                                      onClick={() => openCreateFromRequest(req)}
                                      className="p-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-colors"
                                      title="Create login from request"
                                    >
                                      <UserPlus size={12} />
                                    </button>
                                    <button
                                      onClick={() => updateRequestStatus(req.id, "Rejected")}
                                      className="p-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors"
                                      title="Reject"
                                    >
                                      <X size={12} />
                                    </button>
                                  </>
                                )}
                                {req.status === "Rejected" && (
                                  <button
                                    onClick={() => updateRequestStatus(req.id, "Archived")}
                                    className="text-[9px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
                                  >
                                    Archive
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* LOGINS TAB */}
        {tab === "logins" && (
          <>
            <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
              {visibleLogins.length} active login{visibleLogins.length === 1 ? "" : "s"}
            </p>

            {/* Removed items undo bar */}
            {removedIds.size > 0 && (
              <div className="space-y-2">
                {Array.from(removedIds).map((rid) => {
                  const login = logins.find((l) => l.id === rid);
                  if (!login) return null;
                  return (
                    <motion.div
                      key={rid}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5"
                    >
                      <span className="text-sm text-amber-200">
                        {login.displayName} ({login.email}) marked for removal
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUndoRemove(rid)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] tracking-[0.18em] uppercase border border-amber-500/40 text-amber-200 hover:text-amber-100 hover:border-amber-500/60 transition-colors"
                        >
                          <Undo2 size={11} /> Undo
                        </button>
                        <button
                          onClick={() => confirmRemove(rid)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] tracking-[0.18em] uppercase border border-rose-500/40 text-rose-300 hover:text-rose-200 hover:border-rose-500/60 transition-colors"
                        >
                          <Trash2 size={11} /> Confirm
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {visibleLogins.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <KeyRound size={28} strokeWidth={1.5} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-sm text-zinc-400">
                  {loginsLoading ? "Loading..." : "No active venue logins."}
                </p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Email</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Display Name</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden md:table-cell">Organization</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden md:table-cell">Type</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3 hidden lg:table-cell">Created</th>
                        <th className="text-left font-normal px-2.5 sm:px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLogins.map((login, i) => {
                        const isEditing = editingId === login.id;
                        return (
                          <motion.tr
                            key={login.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25, delay: i * 0.02 }}
                            className="border-b border-white/4 last:border-0 hover:bg-white/4 transition-colors"
                          >
                            <td className="px-2.5 sm:px-4 py-3">
                              {isEditing ? (
                                <input
                                  value={editForm.email}
                                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-[12px] text-foreground w-full"
                                />
                              ) : (
                                <span className="text-zinc-200 text-[12px] break-all">{login.email}</span>
                              )}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3">
                              {isEditing ? (
                                <input
                                  value={editForm.displayName}
                                  onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-[12px] text-foreground w-full"
                                />
                              ) : (
                                <span className="text-zinc-300 text-[12px] break-all">{login.displayName}</span>
                              )}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                              {isEditing ? (
                                <input
                                  value={editForm.organizationName}
                                  onChange={(e) => setEditForm((f) => ({ ...f, organizationName: e.target.value }))}
                                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-[12px] text-foreground w-full"
                                />
                              ) : (
                                <span className="text-zinc-400 text-[11px]">{login.organizationName || "---"}</span>
                              )}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                              <span className={`text-[10px] tracking-[0.18em] uppercase rounded-full px-2 py-0.5 border ${
                                login.accountType === "Venue"
                                  ? "text-sky-300 border-sky-400/30 bg-sky-400/10"
                                  : "text-violet-300 border-violet-400/30 bg-violet-400/10"
                              }`}>
                                {login.accountType}
                              </span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden lg:table-cell text-zinc-500 text-[11px]">
                              {new Date(login.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={saveEdit}
                                      className="p-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-colors"
                                      title="Save"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="p-1.5 rounded-lg border border-zinc-500/30 hover:border-zinc-500/60 bg-zinc-500/10 text-zinc-300 hover:text-zinc-200 transition-colors"
                                      title="Cancel"
                                    >
                                      <X size={12} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEdit(login)}
                                      className="p-1.5 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-zinc-300 hover:text-foreground transition-colors"
                                      title="Edit"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleRemoveLogin(login.id)}
                                      className="p-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors"
                                      title="Remove"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Login Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-5"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display uppercase text-xl tracking-tight mb-1">Create Venue Login</h2>
              {createFrom && (
                <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-4">
                  From request: {createFrom.organizationName}
                </p>
              )}

              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Login Email</label>
                  <input
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                    placeholder="login@venue.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Password</label>
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                    placeholder="Set initial password"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Display Name</label>
                  <input
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                    placeholder="Venue Partner"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 block mb-1.5">Organization</label>
                  <input
                    value={createForm.organizationName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, organizationName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                    placeholder="The Grand Venue"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-white/10 text-xs tracking-[0.18em] uppercase text-zinc-300 hover:text-foreground hover:border-white/25 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={createLoading || !createForm.email || !createForm.password || !createForm.displayName}
                    className="flex-1 py-2.5 rounded-full btn-gradient text-xs tracking-[0.18em] uppercase font-bold disabled:opacity-50"
                  >
                    {createLoading ? "Creating..." : "Create Login"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
