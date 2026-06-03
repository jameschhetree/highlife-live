"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Edit, Plus, Trash2 } from "lucide-react";
import { useEpks, useArtists, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { deleteEpk } from "@/lib/admin-store";
import type { EpkStatus } from "@/lib/admin-data";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { getAdminSession, isAgentAdmin, type AdminSession } from "@/lib/admin-auth";
import { AgentStagedNotice } from "@/components/admin/AgentStagedNotice";
import { StagedActionModal } from "@/components/admin/StagedActionModal";
import { FileImage } from "lucide-react";

const statusColor: Record<EpkStatus, string> = {
  Draft: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  Approved: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  Published: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

const statusList: EpkStatus[] = ["Draft", "Approved", "Published", "Archived"];

export default function EpksPage() {
  const epks = useEpks();
  const artists = useArtists();
  const [filter, setFilter] = useState<EpkStatus | "All">("All");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  if (accessChecked && isAgentAdmin(session)) {
    return (
      <AgentStagedNotice
        pageTitle="EPKs"
        description="EPK generation is owner-only today. Agent-facing EPK approvals + the generation pipeline ship in Phase 5.5 after the artist-conversion workflow lands."
      />
    );
  }

  const filtered = epks.filter((e) => filter === "All" || e.status === filter);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteEpk(deleteTarget.id);
    triggerStoreUpdate();
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Electronic Press Kits
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display uppercase text-3xl tracking-tight">EPKs</h1>
          <button
            onClick={() => setGenerateOpen(true)}
            className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus size={14} /> Generate EPK
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter("All")}
            className={`chip cursor-pointer ${filter === "All" ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
          >
            All
          </button>
          {statusList.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`chip cursor-pointer ${filter === s ? "!bg-white/12 !text-foreground !border-white/20" : ""}`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
          {filtered.length} EPK{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((epk, i) => {
            const artist = artists.find((a) => a.id === epk.artistId);
            return (
              <motion.div
                key={epk.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
                className="glass-card rounded-2xl p-5 hover:border-white/16 transition-colors group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {artist && (
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${artist.image})` }}
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-foreground">{epk.artistName}</div>
                      <div className="text-[11px] text-zinc-500">{epk.id}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${statusColor[epk.status]}`}>
                    {epk.status}
                  </span>
                </div>

                {artist && (
                  <div className="mb-4 space-y-2">
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Genre</div>
                      <div className="text-xs text-zinc-300">{artist.primaryGenre}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Short Pitch</div>
                      <div className="text-xs text-zinc-400 line-clamp-2">{artist.shortPitch}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-white/6">
                  <div className="text-[10px] text-zinc-600">
                    Created: {epk.createdDate} · Edited: {epk.lastEdited}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button className="flex-1 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-[10px] tracking-[0.18em] uppercase text-zinc-400 hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5">
                    <Edit size={10} /> Edit
                  </button>
                  {epk.publishUrl && (
                    <button className="flex-1 py-2 rounded-xl border border-pink-500/20 hover:border-pink-500/40 bg-pink-500/5 text-[10px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200 transition-colors inline-flex items-center justify-center gap-1.5">
                      <ExternalLink size={10} /> View
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setDeleteTarget({ id: epk.id, name: epk.artistName })}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/60 border border-red-500/20 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete EPK"
        message={`Are you sure you want to delete the EPK for "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <StagedActionModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="EPK generator coming soon"
        targetPhase="Phase 5.5"
        icon={<FileImage size={16} className="text-pink-200" />}
        body={
          <>
            <p>
              Automatic EPK generation — assembling artist bio, press quotes, social stats, performance highlights, and pulling cover art — ships in Phase 5.5.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              No AI drafting is wired yet. For now, EPK rows can be created and edited manually via the artist detail screen.
            </p>
          </>
        }
      />
    </div>
  );
}
