"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useArtists, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { createArtist, updateArtist, deleteArtist } from "@/lib/admin-store";
import {
  canManageArtists,
  filterArtistsForSession,
  getAdminSession,
  isAgentAdmin,
  type AdminSession,
} from "@/lib/admin-auth";
import type { ArtistStatus, AdminArtist } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldTextArea, FieldSelect, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const statuses: ArtistStatus[] = ["Testing", "Active", "Priority", "Paused", "Archived"];

const statusColor: Record<ArtistStatus, string> = {
  Testing: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Active: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  Priority: "text-pink-300 bg-pink-400/10 border-pink-400/20",
  Paused: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  Archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

const defaultArtist: Partial<AdminArtist> = {
  name: "",
  status: "Testing",
  legalName: "",
  email: "",
  phone: "",
  managerContact: "",
  homeCity: "",
  homeState: "",
  primaryMarket: "",
  primaryGenre: "",
  secondaryGenres: [],
  performanceType: "Solo Artist",
  typicalSetLength: "",
  bookingFeeRange: "",
  travelWillingness: "",
  targetVenueTypes: [],
  ageDemoAppeal: "",
  cleanExplicit: "",
  bio: "",
  shortPitch: "",
  longPitch: "",
  pressQuotes: [],
  highlights: [],
  internalNotes: "",
  reliabilityNotes: "",
  bestFitVenueNotes: "",
  socials: {},
  stats: { instagramFollowers: 0, tiktokFollowers: 0, youtubeSubscribers: 0, spotifyMonthlyListeners: 0, avgEngagement: "0%", estimatedTotalAudience: 0, lastRefreshed: new Date().toISOString().slice(0, 10) },
  scoring: { potential: 5, livePerformance: 5, marketability: 5, reliability: 5, bookingPriority: 5, overall: 5, notes: "" },
  image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80",
};

export default function ArtistsPage() {
  const artists = useArtists();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ArtistStatus | "All">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Partial<AdminArtist>>(defaultArtist);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminArtist | null>(null);
  const canManage = canManageArtists(session);
  const agentView = isAgentAdmin(session);
  const visibleArtists = filterArtistsForSession(artists, session);

  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  const filtered = visibleArtists.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.primaryGenre.toLowerCase().includes(search.toLowerCase()) ||
      a.homeCity.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || a.status === filter;
    return matchesSearch && matchesFilter;
  });

  function openNew() {
    if (!canManage) return;
    setEditingId(null);
    setEditingArtist({ ...defaultArtist });
    setDrawerOpen(true);
  }

  function openEdit(artist: AdminArtist) {
    if (!canManage) return;
    setEditingId(artist.id);
    setEditingArtist({ ...artist });
    setDrawerOpen(true);
  }

  function handleSave() {
    if (!canManage) return;
    if (!editingArtist.name) return;
    if (editingId) {
      updateArtist(editingId, editingArtist);
    } else {
      createArtist(editingArtist as Omit<AdminArtist, "id" | "isDemo">);
    }
    triggerStoreUpdate();
    setDrawerOpen(false);
  }

  function handleDelete() {
    if (!canManage) return;
    if (!deleteTarget) return;
    deleteArtist(deleteTarget.id);
    triggerStoreUpdate();
    setDeleteTarget(null);
  }

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500">Checking access...</span>
      </div>
    );
  }

  function patch(field: string, value: unknown) {
    setEditingArtist((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Artist Roster
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display uppercase text-3xl tracking-tight">Artists</h1>
          {canManage && (
            <button
              onClick={openNew}
              className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus size={14} /> Add Artist
            </button>
          )}
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search artists by name, genre, or city..."
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
          {filtered.length} artist{filtered.length !== 1 ? "s" : ""}
          {agentView ? " assigned to this account" : ""}
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="glass-card rounded-2xl p-5 hover:border-white/16 transition-colors group relative">
                <Link href={`/admin/artists/${artist.id}`} className="block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url(${artist.image})` }}
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground group-hover:text-pink-200 transition-colors">
                          {artist.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {artist.primaryGenre}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${statusColor[artist.status]}`}>
                      {artist.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Market</div>
                      <div className="text-xs text-zinc-300">{artist.primaryMarket}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">Fee Range</div>
                      <div className="text-xs text-zinc-300">{artist.bookingFeeRange}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/6">
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">
                      Score: <span className="text-pink-300 font-medium">{artist.scoring.overall}</span>/10
                    </div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600">
                      {(artist.stats.estimatedTotalAudience / 1000).toFixed(0)}K audience
                    </div>
                  </div>
                </Link>

                {canManage && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); openEdit(artist); }}
                      className="p-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); setDeleteTarget(artist); }}
                      className="p-1.5 rounded-lg bg-black/60 border border-red-500/20 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit / New Drawer */}
      <EditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Artist" : "New Artist"}
      >
        <FieldText label="Name" value={editingArtist.name ?? ""} onChange={(v) => patch("name", v)} placeholder="Artist name" />
        <FieldSelect label="Status" value={editingArtist.status ?? "Testing"} onChange={(v) => patch("status", v)} options={statuses} />
        <FieldText label="Legal Name" value={editingArtist.legalName ?? ""} onChange={(v) => patch("legalName", v)} />
        <FieldText label="Email" value={editingArtist.email ?? ""} onChange={(v) => patch("email", v)} type="email" />
        <FieldText label="Phone" value={editingArtist.phone ?? ""} onChange={(v) => patch("phone", v)} />
        <FieldText label="Manager Contact" value={editingArtist.managerContact ?? ""} onChange={(v) => patch("managerContact", v)} />
        <div className="grid grid-cols-2 gap-3">
          <FieldText label="Home City" value={editingArtist.homeCity ?? ""} onChange={(v) => patch("homeCity", v)} />
          <FieldText label="Home State" value={editingArtist.homeState ?? ""} onChange={(v) => patch("homeState", v)} />
        </div>
        <FieldText label="Primary Market" value={editingArtist.primaryMarket ?? ""} onChange={(v) => patch("primaryMarket", v)} />
        <FieldText label="Primary Genre" value={editingArtist.primaryGenre ?? ""} onChange={(v) => patch("primaryGenre", v)} />
        <FieldTags label="Secondary Genres" value={editingArtist.secondaryGenres ?? []} onChange={(v) => patch("secondaryGenres", v)} />
        <FieldSelect
          label="Performance Type"
          value={editingArtist.performanceType ?? "Solo Artist"}
          onChange={(v) => patch("performanceType", v)}
          options={["Solo Artist", "Band", "DJ", "Rapper", "Singer", "Opera Vocalist", "RnB Vocalist", "Dembow/Latin Club Act", "Producer/DJ Hybrid", "Other"]}
        />
        <FieldText label="Typical Set Length" value={editingArtist.typicalSetLength ?? ""} onChange={(v) => patch("typicalSetLength", v)} />
        <FieldText label="Booking Fee Range" value={editingArtist.bookingFeeRange ?? ""} onChange={(v) => patch("bookingFeeRange", v)} />
        <FieldText label="Travel Willingness" value={editingArtist.travelWillingness ?? ""} onChange={(v) => patch("travelWillingness", v)} />
        <FieldTextArea label="Bio" value={editingArtist.bio ?? ""} onChange={(v) => patch("bio", v)} rows={4} />
        <FieldTextArea label="Short Pitch" value={editingArtist.shortPitch ?? ""} onChange={(v) => patch("shortPitch", v)} />
        <FieldTextArea label="Internal Notes" value={editingArtist.internalNotes ?? ""} onChange={(v) => patch("internalNotes", v)} />
        <FieldText label="Image URL" value={editingArtist.image ?? ""} onChange={(v) => patch("image", v)} />

        <button onClick={handleSave} className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-semibold mt-2">
          {editingId ? "Save Changes" : "Create Artist"}
        </button>
      </EditDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Artist"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
