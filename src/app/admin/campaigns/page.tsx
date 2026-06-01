"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useCampaigns, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { deleteCampaign } from "@/lib/admin-store";
import type { CampaignStatus } from "@/lib/admin-data";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const statuses: CampaignStatus[] = ["Draft", "Needs Approval", "Approved", "Running", "Completed", "Paused", "Archived"];

const statusColor: Record<CampaignStatus, string> = {
  Draft: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  "Needs Approval": "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Approved: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  Running: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Paused: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  Completed: "text-purple-300 bg-purple-400/10 border-purple-400/20",
  Archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

export default function CampaignsPage() {
  const campaigns = useCampaigns();
  const [filter, setFilter] = useState<CampaignStatus | "All">("All");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = campaigns.filter((c) => {
    const matchesFilter = filter === "All" || c.status === filter;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.artistName.toLowerCase().includes(search.toLowerCase()) ||
      c.targetSegment.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  function handleDelete() {
    if (!deleteTarget) return;
    deleteCampaign(deleteTarget.id);
    triggerStoreUpdate();
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Outreach
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display uppercase text-3xl tracking-tight">Campaigns</h1>
          <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Plus size={14} /> New Campaign
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter("All")}
              className={`chip cursor-pointer ${filter === "All" ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
            >
              All
            </button>
            {statuses.map((s) => (
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
          {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-3">
          {filtered.map((campaign, i) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="glass-card rounded-2xl p-5 hover:border-white/16 transition-colors group relative">
                <Link href={`/admin/campaigns/${campaign.id}`} className="block">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-pink-200 transition-colors">
                        {campaign.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {campaign.id} · {campaign.objective} · {campaign.owner}
                      </div>
                    </div>
                    <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 shrink-0 ${statusColor[campaign.status]}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Artist</div>
                      <div className="text-xs text-zinc-300">{campaign.artistName}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Segment</div>
                      <div className="text-xs text-zinc-300">{campaign.targetSegment}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Contacts</div>
                      <div className="text-xs text-zinc-300">{campaign.contactCount}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Platform</div>
                      <div className="text-xs text-zinc-300">{campaign.outreachPlatform}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/6 text-[10px] text-zinc-500">
                    <span>Created: {campaign.createdDate}</span>
                    {campaign.approvedBy && <span>Approved by: {campaign.approvedBy}</span>}
                    {campaign.sentDate && <span>Sent: {campaign.sentDate}</span>}
                  </div>
                </Link>

                <div className="absolute top-4 right-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.preventDefault(); setDeleteTarget({ id: campaign.id, name: campaign.name }); }}
                    className="p-1.5 rounded-lg bg-black/60 border border-red-500/20 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
