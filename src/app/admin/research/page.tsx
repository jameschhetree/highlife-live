"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";
import { useResearchQueue, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateResearchContact, deleteResearchContact } from "@/lib/admin-store";
import type { ResearchAction } from "@/lib/admin-data";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { getAdminSession, isAgentAdmin, type AdminSession } from "@/lib/admin-auth";
import { AgentStagedNotice } from "@/components/admin/AgentStagedNotice";

const actionColor: Record<ResearchAction, string> = {
  Pending: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Verified: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Duplicate: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  "Do Not Contact": "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function ResearchPage() {
  const contacts = useResearchQueue();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ResearchAction | "All">("All");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  // Phase 3.8 — Research Queue holds raw contact data (emails, source URLs)
  // that's owner-only. Staged for agents until Phase 5.5 defines an agent-safe
  // assignment-scoped contact view.
  if (accessChecked && isAgentAdmin(session)) {
    return (
      <AgentStagedNotice
        pageTitle="Research Queue"
        description="The research queue surfaces raw contact data (emails, source URLs, owner notes) that agents shouldn't see unfiltered. Agent-scoped contact access coming in a future update alongside the venue-contact-grant flow expansion."
      />
    );
  }

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || c.action === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAction = (id: string, action: ResearchAction) => {
    updateResearchContact(id, { action });
    triggerStoreUpdate();
  };

  function handleDelete() {
    if (!deleteTarget) return;
    deleteResearchContact(deleteTarget.id);
    triggerStoreUpdate();
    setDeleteTarget(null);
  }

  const pendingCount = contacts.filter((c) => c.action === "Pending").length;

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Contact Research
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display uppercase text-3xl tracking-tight">Research Queue</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.18em] uppercase text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">
              {pendingCount} pending review
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="glass-card rounded-2xl p-4 border-l-2 border-l-amber-400">
          <p className="text-xs text-zinc-400 leading-relaxed">
            All imported and scraped contacts must be reviewed before they can be used in outreach campaigns.
            Verify contact accuracy, check for duplicates, and mark any contacts that should not be contacted.
            Source URLs and dates are preserved for compliance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search contacts, organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["All", "Pending", "Verified", "Duplicate", "Do Not Contact"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`chip cursor-pointer ${filter === s ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-3">
          {filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] }}
              className="glass-card rounded-2xl p-5 group relative"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{contact.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {contact.role} at {contact.organization}
                  </div>
                </div>
                <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 shrink-0 ${actionColor[contact.action]}`}>
                  {contact.action}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Email</div>
                  <div className="text-xs text-zinc-300">{contact.email}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Region</div>
                  <div className="text-xs text-zinc-300">{contact.region}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Type</div>
                  <div className="text-xs text-zinc-300">{contact.venueType}</div>
                </div>
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Source Date</div>
                  <div className="text-xs text-zinc-300">{contact.sourceDate}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Source URL</div>
                <div className="text-xs text-pink-300 inline-flex items-center gap-1 break-all">
                  {contact.sourceUrl} <ExternalLink size={10} />
                </div>
              </div>

              {contact.notes && (
                <div className="mb-3">
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Notes</div>
                  <div className="text-xs text-zinc-500">{contact.notes}</div>
                </div>
              )}

              {contact.action === "Pending" && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/6">
                  <button
                    onClick={() => handleAction(contact.id, "Verified")}
                    className="px-3.5 py-2 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5 text-[10px] tracking-[0.18em] uppercase text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1.5"
                  >
                    <CheckCircle size={10} /> Verify
                  </button>
                  <button
                    onClick={() => handleAction(contact.id, "Duplicate")}
                    className="px-3.5 py-2 rounded-lg border border-zinc-500/20 hover:border-zinc-500/40 bg-zinc-500/5 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Copy size={10} /> Duplicate
                  </button>
                  <button
                    onClick={() => handleAction(contact.id, "Do Not Contact")}
                    className="px-3.5 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/5 text-[10px] tracking-[0.18em] uppercase text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1.5"
                  >
                    <XCircle size={10} /> Do Not Contact
                  </button>
                </div>
              )}

              <button
                onClick={() => setDeleteTarget({ id: contact.id, name: contact.name })}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/60 border border-red-500/20 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deleteTarget?.name}" from the research queue?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
