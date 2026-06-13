"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash,
  Download,
  Megaphone,
  FileImage,
  Plus,
  ExternalLink,
  Star,
} from "lucide-react";
import { useArtists, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateArtist, deleteArtist } from "@/lib/admin-store";
import {
  canManageArtists,
  canViewArtist,
  getAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";
import type { ArtistStatus, AdminArtist } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldTextArea, FieldSelect, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import NotesThread from "@/components/admin/notes-thread";

// Phase 3.9 Scope 11 — Archived removed from edit form; Developing + Left added.
const statuses: ArtistStatus[] = ["Testing", "Active", "Priority", "Developing", "Paused", "Left"];

const statusColor: Record<ArtistStatus, string> = {
  Testing: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Active: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Priority: "text-pink-300 bg-pink-400/10 border-pink-400/20",
  Developing: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  Paused: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  Left: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-xs text-zinc-300 w-6 text-right">{value}</span>
    </div>
  );
}

export default function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const artists = useArtists();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const artist = artists.find((a) => a.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminArtist>>({});
  const [showDelete, setShowDelete] = useState(false);
  const canManage = canManageArtists(session);
  const canView = artist ? canViewArtist(artist, session) : false;

  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  if (!artist || !canView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Artist Not Found</h1>
          <Link href="/admin/artists" className="text-pink-300 text-sm hover:underline">Back to Artists</Link>
        </div>
      </div>
    );
  }

  function openEdit() {
    if (!canManage) return;
    setEditForm({ ...artist });
    setDrawerOpen(true);
  }

  function handleSave() {
    if (!canManage) return;
    updateArtist(id, editForm);
    triggerStoreUpdate();
    setDrawerOpen(false);
  }

  function handleDelete() {
    if (!canManage) return;
    deleteArtist(id);
    triggerStoreUpdate();
    router.push("/admin/artists");
  }

  function patch(field: string, value: unknown) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  const socialLinks = Object.entries(artist.socials).filter(([, v]) => v);

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link href="/admin/artists" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Artists
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url(${artist.image})` }}
            />
            <div>
              <h1 className="font-display uppercase text-3xl tracking-tight">{artist.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${statusColor[artist.status]}`}>
                  {artist.status}
                </span>
                <span className="text-[11px] text-zinc-500">{artist.primaryGenre} / {artist.performanceType}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <button onClick={openEdit} className="p-2 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors">
                <Edit size={14} />
              </button>
            )}
            <button className="p-2 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors">
              <Download size={14} />
            </button>
            {canManage && (
              <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
                <Trash size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-wrap gap-2"
        >
          <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Megaphone size={14} /> Create Campaign
          </button>
          <button className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2">
            <FileImage size={14} /> Generate EPK
          </button>
          <button
            onClick={() => {
              const note = prompt("Add a quick internal note for this artist:");
              if (!note || !note.trim()) return;
              const ts = new Date().toLocaleString();
              const prev = (editForm.internalNotes ?? artist.internalNotes) || "";
              const next = prev ? `${prev}\n\n[${ts}] ${note.trim()}` : `[${ts}] ${note.trim()}`;
              updateArtist(id, { internalNotes: next });
              triggerStoreUpdate();
            }}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <Plus size={14} /> Add Note
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Bio</h2>
              <p className="text-sm text-zinc-300 leading-relaxed">{artist.bio}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Pitches</h2>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1">Short Pitch</div>
                <p className="text-sm text-zinc-300">{artist.shortPitch}</p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1">Long Pitch</div>
                <p className="text-sm text-zinc-300 leading-relaxed">{artist.longPitch}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Contact & Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Legal Name", artist.legalName],
                  ["Email", artist.email],
                  ["Phone", artist.phone],
                  ["Manager", artist.managerContact],
                  ["Home City", `${artist.homeCity}, ${artist.homeState}`],
                  ["Primary Market", artist.primaryMarket],
                  ["Set Length", artist.typicalSetLength],
                  ["Fee Range", artist.bookingFeeRange],
                  ["Travel", artist.travelWillingness],
                  ["Clean/Explicit", artist.cleanExplicit],
                  ["Age Appeal", artist.ageDemoAppeal],
                  // Phase 3.9 Scope 11 — "Target Venues" removed per Liam directive.
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                    <div className="text-sm text-zinc-300">{value}</div>
                  </div>
                ))}
              </div>
              {artist.secondaryGenres.length > 0 && (
                <div className="mt-4">
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1.5">Secondary Genres</div>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.secondaryGenres.map((g) => (
                      <span key={g} className="chip text-[9px]">{g}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Press & Highlights</h2>
              {artist.pressQuotes.length > 0 && (
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-2">Press Quotes</div>
                  <div className="space-y-2">
                    {artist.pressQuotes.map((q, i) => (
                      <p key={i} className="text-sm text-zinc-400 italic border-l-2 border-pink-500/30 pl-3">{q}</p>
                    ))}
                  </div>
                </div>
              )}
              {artist.highlights.length > 0 && (
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-2">Highlights</div>
                  <ul className="space-y-1">
                    {artist.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                        <Star size={10} className="text-pink-400 shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Internal Notes</h2>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1">General</div>
                <p className="text-sm text-zinc-400">{artist.internalNotes}</p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1">Reliability</div>
                <p className="text-sm text-zinc-400">{artist.reliabilityNotes}</p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 mb-1">Best-Fit Venues</div>
                <p className="text-sm text-zinc-400">{artist.bestFitVenueNotes}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <NotesThread entityType="artist" entityId={id} />
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 text-center">
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2">Overall Score</div>
              <div className="font-display text-5xl text-gradient-hero leading-none mb-1">{artist.scoring.overall}</div>
              <div className="text-[10px] text-zinc-500">out of 10</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-1">Scoring</h2>
              <ScoreBar label="Potential" value={artist.scoring.potential} />
              <ScoreBar label="Live Show" value={artist.scoring.livePerformance} />
              <ScoreBar label="Marketability" value={artist.scoring.marketability} />
              <ScoreBar label="Reliability" value={artist.scoring.reliability} />
              <ScoreBar label="Booking Priority" value={artist.scoring.bookingPriority} />
              <p className="text-[10px] text-zinc-500 pt-2 border-t border-white/6">{artist.scoring.notes}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Social Stats</h2>
              <div className="space-y-2.5">
                {[
                  ["Instagram", artist.stats.instagramFollowers],
                  ["TikTok", artist.stats.tiktokFollowers],
                  ["YouTube", artist.stats.youtubeSubscribers],
                  ["Spotify Monthly", artist.stats.spotifyMonthlyListeners],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">{label}</span>
                    <span className="text-sm text-zinc-300">{(val as number).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Engagement</span>
                  <span className="text-sm text-emerald-300">{artist.stats.avgEngagement}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">Total Audience</span>
                  <span className="text-sm text-foreground font-medium">{artist.stats.estimatedTotalAudience.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-[9px] text-zinc-600 mt-3">Last refreshed: {artist.stats.lastRefreshed}</div>
            </motion.div>

            {socialLinks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Links</h2>
                <div className="space-y-2">
                  {socialLinks.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 capitalize">{key}</span>
                      <span className="text-xs text-pink-300 inline-flex items-center gap-1">
                        {value} <ExternalLink size={10} />
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Assets</h2>
              <div className="space-y-2 text-sm text-zinc-500">
                {["Press Photos", "Logo", "Music Links", "Videos", "Stage Plot", "Tech Rider", "Hospitality Rider"].map((a) => (
                  <div key={a} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                    <span>{a}</span>
                    <span className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 bg-white/4 rounded-full px-2 py-0.5">Not uploaded</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-400 hover:text-foreground transition-colors inline-flex items-center justify-center gap-2">
                <Plus size={14} /> Upload Assets
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Artist">
        <FieldText label="Name" value={editForm.name ?? ""} onChange={(v) => patch("name", v)} />
        <FieldSelect label="Status" value={editForm.status ?? "Testing"} onChange={(v) => patch("status", v)} options={statuses} />
        <FieldText label="Profile Photo URL" value={editForm.image ?? ""} onChange={(v) => patch("image", v)} placeholder="https://..." />
        <FieldText label="Legal Name" value={editForm.legalName ?? ""} onChange={(v) => patch("legalName", v)} />
        <FieldText label="Email" value={editForm.email ?? ""} onChange={(v) => patch("email", v)} type="email" />
        <FieldText label="Phone" value={editForm.phone ?? ""} onChange={(v) => patch("phone", v)} />
        <FieldText label="Manager Contact" value={editForm.managerContact ?? ""} onChange={(v) => patch("managerContact", v)} />
        <FieldText label="Primary Genre" value={editForm.primaryGenre ?? ""} onChange={(v) => patch("primaryGenre", v)} />
        <FieldTags label="Secondary Genres" value={editForm.secondaryGenres ?? []} onChange={(v) => patch("secondaryGenres", v)} />
        <FieldText label="Booking Fee Range" value={editForm.bookingFeeRange ?? ""} onChange={(v) => patch("bookingFeeRange", v)} />
        <FieldTextArea label="Bio" value={editForm.bio ?? ""} onChange={(v) => patch("bio", v)} rows={4} />
        <FieldTextArea label="Short Pitch" value={editForm.shortPitch ?? ""} onChange={(v) => patch("shortPitch", v)} />
        <FieldTextArea label="Internal Notes" value={editForm.internalNotes ?? ""} onChange={(v) => patch("internalNotes", v)} />
        <button onClick={handleSave} className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-semibold mt-2">
          Save Changes
        </button>
      </EditDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDelete}
        title="Delete Artist"
        message={`Are you sure you want to delete "${artist.name}"? This will remove them from the roster permanently.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
