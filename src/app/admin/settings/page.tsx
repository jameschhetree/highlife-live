"use client";

import { motion } from "framer-motion";
import { Settings, Users, Shield, Key, Mail, AlertTriangle } from "lucide-react";

const teamMembers = [
  { name: "James Carter", email: "james@highlifedmv.com", role: "Owner/Admin", status: "Active" },
  { name: "Maria Lopez", email: "maria@highlifedmv.com", role: "Booker", status: "Active" },
  { name: "Devon Clark", email: "devon@highlifedmv.com", role: "Researcher", status: "Active" },
  { name: "Sarah Kim", email: "sarah@highlifedmv.com", role: "Viewer", status: "Invited" },
];

const roles = [
  { name: "Owner/Admin", perms: "Full access: CRUD all data, approve campaigns, manage team, API keys, settings" },
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

// 2026-06-03 — Dok directive: 'remove delete demo data button completely... make it empty
// so we can start to populate'. Danger Zone block + Re-seed button + modal removed.
// API endpoints kept but no longer reachable from the UI.
export default function SettingsPage() {
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

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-600 pt-4 border-t border-white/5">
          Settings · clean slate, populate via the admin portal
        </p>
      </div>
    </div>
  );
}
