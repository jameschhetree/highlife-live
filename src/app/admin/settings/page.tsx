"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  Shield,
  Key,
  Mail,
  AlertTriangle,
  Trash,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { clearAllData, resetDemoData } from "@/lib/admin-store";
import { triggerStoreUpdate } from "@/hooks/useAdminStore";
import { getAdminSession } from "@/lib/admin-auth";

type DemoCounts = {
  artists: number;
  venues: number;
  contacts: number;
  campaigns: number;
  opportunities: number;
  epks: number;
};

const teamMembers = [
  { name: "James Carter", email: "james@highlifedmv.com", role: "Owner/Admin", status: "Active" },
  { name: "Maria Lopez", email: "maria@highlifedmv.com", role: "Booker", status: "Active" },
  { name: "Devon Clark", email: "devon@highlifedmv.com", role: "Researcher", status: "Active" },
  { name: "Sarah Kim", email: "sarah@highlifedmv.com", role: "Viewer", status: "Invited" },
];

const roles = [
  { name: "Owner/Admin", perms: "Full access: CRUD all data, approve campaigns, manage team, API keys, settings, delete demo data" },
  { name: "Manager", perms: "Edit artists/venues, approve campaigns, view reports, manage team" },
  { name: "Booker", perms: "Manage contacts, draft campaigns, move pipeline deals, add notes, request approval" },
  { name: "Researcher", perms: "Add venue/contact leads, mark needs-review, add source URLs, clean data" },
  { name: "Viewer", perms: "View dashboard and reports only. No edits." },
];

const suppressionList = [
  { email: "noreply@example.com", reason: "Generic noreply address", addedDate: "2026-04-10" },
  { email: "info@donotcontact.org", reason: "Requested removal", addedDate: "2026-05-01" },
  { email: "bounced@invalid.com", reason: "Hard bounce", addedDate: "2026-05-15" },
];

export default function SettingsPage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [dataCleared, setDataCleared] = useState(false);
  const [previewCounts, setPreviewCounts] = useState<DemoCounts | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DemoCounts | null>(null);

  // Fetch live counts whenever the delete modal opens
  useEffect(() => {
    if (!showDeleteModal) return;
    const session = getAdminSession();
    if (!session) return;
    setPreviewCounts(null);
    fetch("/api/admin/delete-demo-data", {
      method: "GET",
      headers: { "x-admin-email": session.email },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setPreviewCounts(j.counts as DemoCounts))
      .catch(() => setPreviewCounts(null));
  }, [showDeleteModal]);

  async function handleDeleteDemoData() {
    const session = getAdminSession();
    if (!session) {
      setDeleteError("Not signed in.");
      return;
    }
    setDeletePending(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/admin/delete-demo-data", {
        method: "POST",
        headers: { "x-admin-email": session.email },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDeleteError(data?.error || `Delete failed (${res.status})`);
        setDeletePending(false);
        return;
      }
      // Also clear legacy localStorage seed
      clearAllData();
      triggerStoreUpdate();
      setLastResult(data.deleted as DemoCounts);
      setShowDeleteModal(false);
      setDeleteConfirm("");
      setDataCleared(true);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Network error");
    } finally {
      setDeletePending(false);
    }
  }

  function handleResetDemoData() {
    resetDemoData();
    triggerStoreUpdate();
    setDataCleared(false);
    setLastResult(null);
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Configuration
        </p>
        <h1 className="font-display uppercase text-3xl tracking-tight">Settings</h1>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-4xl">
        {/* Company Profile */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
            <Settings size={14} className="text-pink-300" /> Company Profile
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Company Name</label>
              <input
                type="text"
                defaultValue="HighLife Live"
                className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground focus:outline-none focus:border-pink-500/40"
              />
            </div>
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Booking Contact Email</label>
              <input
                type="email"
                defaultValue="booking@highlifedmv.com"
                className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground focus:outline-none focus:border-pink-500/40"
              />
            </div>
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Default Region</label>
              <select
                defaultValue="Washington, DC"
                className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none"
              >
                <option className="bg-zinc-900">Washington, DC</option>
                <option className="bg-zinc-900">Baltimore, MD</option>
                <option className="bg-zinc-900">Montgomery County, MD</option>
                <option className="bg-zinc-900">Prince George&apos;s County, MD</option>
                <option className="bg-zinc-900">Northern Virginia</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Website</label>
              <input
                type="text"
                defaultValue="highlifedmv.com"
                className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground focus:outline-none focus:border-pink-500/40"
              />
            </div>
          </div>
          <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold">
            Save Changes
          </button>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
              <Users size={14} className="text-pink-300" /> Team Members
            </h2>
            <button className="px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors">
              Invite Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                  <th className="text-left font-normal py-2">Name</th>
                  <th className="text-left font-normal py-2">Email</th>
                  <th className="text-left font-normal py-2">Role</th>
                  <th className="text-left font-normal py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m) => (
                  <tr key={m.email} className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="py-3 text-zinc-200">{m.name}</td>
                    <td className="py-3 text-zinc-400">{m.email}</td>
                    <td className="py-3">
                      <span className="text-[9px] tracking-[0.18em] uppercase text-pink-200 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] tracking-[0.18em] uppercase ${
                        m.status === "Active"
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Role Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
            <Shield size={14} className="text-pink-300" /> Role Permissions
          </h2>
          <div className="space-y-3">
            {roles.map((r) => (
              <div key={r.name} className="py-2.5 border-b border-white/4 last:border-0">
                <div className="text-sm text-zinc-200 font-medium mb-0.5">{r.name}</div>
                <div className="text-xs text-zinc-500">{r.perms}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Outreach Provider */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
            <Mail size={14} className="text-pink-300" /> Outreach Provider
          </h2>
          <div>
            <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Primary Provider</label>
            <select
              defaultValue="smartlead"
              className="w-full max-w-sm px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none"
            >
              <option value="none" className="bg-zinc-900">None / Manual</option>
              <option value="smartlead" className="bg-zinc-900">Smartlead</option>
              <option value="instantly" className="bg-zinc-900">Instantly</option>
              <option value="apollo" className="bg-zinc-900">Apollo</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Daily Send Limit</label>
              <input
                type="number"
                defaultValue={50}
                className="w-full px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground focus:outline-none focus:border-pink-500/40"
              />
            </div>
            <div>
              <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1">Auto-send (Trusted)</label>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-10 h-5 bg-white/6 rounded-full relative">
                  <div className="w-4 h-4 bg-zinc-500 rounded-full absolute left-0.5 top-0.5" />
                </div>
                <span className="text-xs text-zinc-500">Disabled (approval required)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5 space-y-4"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
            <Key size={14} className="text-pink-300" /> API Keys
          </h2>
          <div className="space-y-3">
            {[
              ["Smartlead API Key", "sk-••••••••••••••••"],
              ["Instantly API Key", "Not configured"],
              ["OpenAI API Key", "sk-••••••••••••••••"],
              ["Email Verification API Key", "Not configured"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                <span className="text-sm text-zinc-300">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">{value}</span>
                  <button className="text-[9px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200 transition-colors">
                    {value === "Not configured" ? "Add" : "Update"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Suppression List */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 flex items-center gap-2">
              <AlertTriangle size={14} className="text-pink-300" /> Suppression List
            </h2>
            <button className="px-3.5 py-2 rounded-lg border border-white/10 hover:border-white/25 bg-black/40 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors">
              Add Entry
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                  <th className="text-left font-normal py-2">Email</th>
                  <th className="text-left font-normal py-2">Reason</th>
                  <th className="text-left font-normal py-2">Added</th>
                </tr>
              </thead>
              <tbody>
                {suppressionList.map((s) => (
                  <tr key={s.email} className="border-b border-white/4 last:border-0">
                    <td className="py-2.5 text-zinc-300 font-mono text-xs">{s.email}</td>
                    <td className="py-2.5 text-zinc-500">{s.reason}</td>
                    <td className="py-2.5 text-zinc-600">{s.addedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Danger Zone — Delete Demo Data */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="glass-card rounded-2xl p-5 border border-red-500/20"
        >
          <h2 className="text-[11px] tracking-[0.22em] uppercase text-red-400 mb-3 flex items-center gap-2">
            <Trash size={14} /> Danger Zone
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Delete all demo/seed data from the system. Only use this when you are ready to replace demo records with real data. You can re-seed with demo data afterwards.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-2"
            >
              <Trash size={14} /> Delete All Demo Data
            </button>
            {dataCleared && (
              <button
                onClick={handleResetDemoData}
                className="px-4 py-2 rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-sm text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw size={14} /> Re-seed Demo Data
              </button>
            )}
          </div>
          {lastResult && (
            <p className="mt-3 text-xs text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <Check size={12} /> Deleted {lastResult.artists} artists, {lastResult.venues} venues, {lastResult.contacts} contacts, {lastResult.campaigns} campaigns, {lastResult.opportunities} opportunities, {lastResult.epks} EPKs.
            </p>
          )}
        </motion.div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Demo data — replace before launching outreach
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative glass-card rounded-2xl p-6 max-w-md w-full border border-red-500/20"
            >
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="absolute top-4 right-4 text-zinc-500 hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-display uppercase tracking-tight">Delete Demo Data</h3>
                  <p className="text-[11px] text-zinc-500">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 mb-4">
                Are you sure? This will permanently delete all <code className="text-pink-300">isDemo=true</code> records from the database. Real partner data (inquiries, events, bookings, agent applications, venue logins) will NOT be touched.
              </p>
              <ul className="text-sm text-zinc-500 space-y-1 mb-4 pl-4">
                {previewCounts ? (
                  <>
                    <li>- {previewCounts.artists} demo artists</li>
                    <li>- {previewCounts.venues} demo venues</li>
                    <li>- {previewCounts.contacts} demo contacts</li>
                    <li>- {previewCounts.campaigns} demo campaigns</li>
                    <li>- {previewCounts.opportunities} demo opportunities</li>
                    <li>- {previewCounts.epks} demo EPKs</li>
                  </>
                ) : (
                  <li className="text-zinc-600 italic">Loading current demo counts...</li>
                )}
              </ul>
              {deleteError && (
                <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}

              <div className="mb-4">
                <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 block mb-1.5">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-xl bg-white/4 border border-red-500/20 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-400 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirm !== "DELETE" || deletePending}
                  onClick={handleDeleteDemoData}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                    deleteConfirm === "DELETE" && !deletePending
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-red-500/20 text-red-500/40 cursor-not-allowed"
                  }`}
                >
                  <Trash size={14} /> {deletePending ? "Deleting..." : "Delete Demo Data"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
