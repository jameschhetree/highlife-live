"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Upload, RefreshCw, Lock } from "lucide-react";
import { useVenues, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { createVenue, updateVenue, deleteVenue } from "@/lib/admin-store";
import { getAdminSession, isOwnerAdmin } from "@/lib/admin-auth";
import type { VenueType, ReviewStatus, RelationshipStatus, AdminVenue } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldTextArea, FieldSelect, FieldNumber, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const regions = ["All Regions", "Washington, DC", "Baltimore, MD", "Prince George's County, MD", "Montgomery County, MD", "Northern Virginia"];
const venueTypes: VenueType[] = ["Club", "Lounge", "Festival", "Theater", "College", "Restaurant/Bar", "Private Event Buyer", "Promoter", "Cultural Center", "Church/Event Hall", "Other"];
const reviewStatuses: ReviewStatus[] = ["Needs Review", "Verified", "Do Not Contact", "Duplicate"];
const relationStatuses: RelationshipStatus[] = ["Cold", "Warm", "Active Relationship", "Booked Before", "Not a Fit", "Do Not Contact"];

const reviewColor: Record<ReviewStatus, string> = {
  "Needs Review": "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Verified: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  "Do Not Contact": "text-red-400 bg-red-400/10 border-red-400/20",
  Duplicate: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const relationColor: Record<RelationshipStatus, string> = {
  Cold: "text-blue-300",
  Warm: "text-amber-300",
  "Active Relationship": "text-emerald-300",
  "Booked Before": "text-pink-300",
  "Not a Fit": "text-zinc-500",
  "Do Not Contact": "text-red-400",
};

const defaultVenue: Partial<AdminVenue> = {
  name: "",
  contactPerson: "",
  contactTitle: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  address: "",
  city: "",
  state: "",
  region: "Washington, DC",
  venueType: "Club",
  capacity: 0,
  typicalGenres: [],
  bookingEmail: "",
  talentBuyerEmail: "",
  source: "Manual",
  sourceUrl: "",
  sourceDate: new Date().toISOString().slice(0, 10),
  contactConfidence: 5,
  reviewStatus: "Needs Review",
  notes: "",
  tags: [],
  lastContacted: null,
  nextFollowUp: null,
  relationshipStatus: "Cold",
};

export default function VenuesPage() {
  const venues = useVenues();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Partial<AdminVenue>>(defaultVenue);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVenue | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Owner-admin gate for sensitive controls (CSV import, cron sync, edit, delete) +
  // contact-info preview in the list. Agents see the venue list but no contacts (Phase 3.7 D).
  // Default-deny while session loads (Dok HL Live 2026-06-03 "100ms buffer" rule).
  const [permState, setPermState] = useState<{ loaded: boolean; isOwnerAdmin: boolean }>({ loaded: false, isOwnerAdmin: false });
  useEffect(() => {
    const start = performance.now();
    let cancelled = false;
    const session = getAdminSession();
    const isOwner = isOwnerAdmin(session);
    const elapsed = performance.now() - start;
    const wait = Math.max(0, 100 - elapsed);
    setTimeout(() => {
      if (cancelled) return;
      setPermState({ loaded: true, isOwnerAdmin: isOwner });
    }, wait);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase();
    // Search across contact name is owner-only — agents shouldn't be able to
    // discover hidden contact data via guess-typing.
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      (permState.isOwnerAdmin && v.contactPerson.toLowerCase().includes(q));
    const matchesRegion = regionFilter === "All Regions" || v.region === regionFilter;
    const matchesType = typeFilter === "All Types" || v.venueType === typeFilter;
    return matchesSearch && matchesRegion && matchesType;
  });

  function openNew() {
    setEditingId(null);
    setEditingVenue({ ...defaultVenue });
    setDrawerOpen(true);
  }

  function openEdit(venue: AdminVenue) {
    setEditingId(venue.id);
    setEditingVenue({ ...venue });
    setDrawerOpen(true);
  }

  function handleSave() {
    if (!editingVenue.name) return;
    if (editingId) {
      updateVenue(editingId, editingVenue);
    } else {
      createVenue(editingVenue as Omit<AdminVenue, "id" | "isDemo">);
    }
    triggerStoreUpdate();
    setDrawerOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteVenue(deleteTarget.id);
    triggerStoreUpdate();
    setDeleteTarget(null);
  }

  function patch(field: string, value: unknown) {
    setEditingVenue((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSyncCron() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/cron/venue-refresh");
      if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
      const data = (await res.json()) as {
        venues: Array<Partial<AdminVenue> & { name: string; city: string }>;
      };

      const existingKeys = new Set(
        venues.map((v) => `${v.name.toLowerCase()}|${v.city.toLowerCase()}`)
      );
      let added = 0;
      for (const v of data.venues) {
        const key = `${v.name.toLowerCase()}|${v.city.toLowerCase()}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        createVenue({
          ...(defaultVenue as Omit<AdminVenue, "id" | "isDemo">),
          ...v,
          source: "Public Research",
          sourceUrl: v.website ?? "",
          sourceDate: new Date().toISOString().slice(0, 10),
          reviewStatus: "Needs Review",
        } as Omit<AdminVenue, "id" | "isDemo">);
        added++;
      }
      triggerStoreUpdate();
      setSyncResult(
        added > 0
          ? `Synced from cron: ${added} new venue${added === 1 ? "" : "s"} added (deduped from ${data.venues.length} source rows).`
          : `Already in sync — no new venues from ${data.venues.length} source rows.`
      );
    } catch (e) {
      setSyncResult(`Sync error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Venue CRM
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display uppercase text-3xl tracking-tight">Venues</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Owner-only data ingest controls (Phase 3.7 D). Agents see neither. */}
            {permState.loaded && permState.isOwnerAdmin && (
              <>
                <button
                  onClick={handleSyncCron}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing…" : "Sync from Cron"}
                </button>
                <Link
                  href="/admin/venues/import"
                  className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2"
                >
                  <Upload size={14} /> Import CSV
                </Link>
                <button
                  onClick={openNew}
                  className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Add Venue
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search venues, contacts, or cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/40"
            />
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer"
          >
            {regions.map((r) => (
              <option key={r} value={r} className="bg-zinc-900">{r}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer"
          >
            <option value="All Types" className="bg-zinc-900">All Types</option>
            {venueTypes.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">
            {filtered.length} venue{filtered.length !== 1 ? "s" : ""}
          </p>
          {syncResult && (
            <p className="text-[11px] text-zinc-400 italic">{syncResult}</p>
          )}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                  <th className="text-left font-normal px-4 py-3">Venue</th>
                  <th className="text-left font-normal px-4 py-3 hidden md:table-cell">Type</th>
                  <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Region</th>
                  <th className="text-left font-normal px-4 py-3 hidden xl:table-cell">Capacity</th>
                  <th className="text-left font-normal px-4 py-3">Status</th>
                  <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Relationship</th>
                  <th className="text-left font-normal px-4 py-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((venue, i) => (
                  <motion.tr
                    key={venue.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/venues/${venue.id}`} className="block">
                        <div className="text-zinc-200 font-medium hover:text-pink-200 transition-colors">{venue.name}</div>
                        {/* Contact preview: owner-only. Agents see city/state instead so they
                            can still recognize the venue without seeing names/emails. */}
                        {permState.loaded && permState.isOwnerAdmin ? (
                          <div className="text-[11px] text-zinc-500 mt-0.5">{venue.contactPerson} · {venue.email}</div>
                        ) : permState.loaded ? (
                          <div className="text-[11px] text-zinc-500 mt-0.5 inline-flex items-center gap-1.5">
                            {venue.city ? `${venue.city}, ${venue.state}` : "Contact hidden"}
                            <Lock size={9} className="text-zinc-600" />
                          </div>
                        ) : (
                          // 100ms loading buffer — default-deny render so contacts don't flash
                          <div className="text-[11px] text-zinc-700 mt-0.5">...</div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="chip text-[9px]">{venue.venueType}</span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-400 hidden lg:table-cell">{venue.region}</td>
                    <td className="px-4 py-3.5 text-zinc-400 hidden xl:table-cell">
                      {venue.capacity > 0 ? venue.capacity.toLocaleString() : "N/A"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${reviewColor[venue.reviewStatus]}`}>
                        {venue.reviewStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs ${relationColor[venue.relationshipStatus]}`}>
                        {venue.relationshipStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {permState.loaded && permState.isOwnerAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(venue)}
                          className="p-1.5 rounded-lg border border-white/10 hover:border-white/25 text-zinc-400 hover:text-foreground transition-colors"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(venue)}
                          className="p-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit / New Drawer */}
      <EditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit Venue" : "New Venue"}
      >
        <FieldText label="Venue Name" value={editingVenue.name ?? ""} onChange={(v) => patch("name", v)} placeholder="Venue name" />
        <FieldText label="Contact Person" value={editingVenue.contactPerson ?? ""} onChange={(v) => patch("contactPerson", v)} />
        <FieldText label="Contact Title" value={editingVenue.contactTitle ?? ""} onChange={(v) => patch("contactTitle", v)} />
        <FieldText label="Email" value={editingVenue.email ?? ""} onChange={(v) => patch("email", v)} type="email" />
        <FieldText label="Phone" value={editingVenue.phone ?? ""} onChange={(v) => patch("phone", v)} />
        <FieldText label="Website" value={editingVenue.website ?? ""} onChange={(v) => patch("website", v)} />
        <FieldText label="Instagram" value={editingVenue.instagram ?? ""} onChange={(v) => patch("instagram", v)} />
        <FieldText label="Address" value={editingVenue.address ?? ""} onChange={(v) => patch("address", v)} />
        <div className="grid grid-cols-2 gap-3">
          <FieldText label="City" value={editingVenue.city ?? ""} onChange={(v) => patch("city", v)} />
          <FieldText label="State" value={editingVenue.state ?? ""} onChange={(v) => patch("state", v)} />
        </div>
        <FieldSelect label="Region" value={editingVenue.region ?? "Washington, DC"} onChange={(v) => patch("region", v)} options={regions.filter((r) => r !== "All Regions")} />
        <FieldSelect label="Venue Type" value={editingVenue.venueType ?? "Club"} onChange={(v) => patch("venueType", v)} options={venueTypes} />
        <FieldNumber label="Capacity" value={editingVenue.capacity ?? 0} onChange={(v) => patch("capacity", v)} />
        <FieldTags label="Typical Genres" value={editingVenue.typicalGenres ?? []} onChange={(v) => patch("typicalGenres", v)} />
        <FieldText label="Booking Email" value={editingVenue.bookingEmail ?? ""} onChange={(v) => patch("bookingEmail", v)} type="email" />
        <FieldSelect label="Review Status" value={editingVenue.reviewStatus ?? "Needs Review"} onChange={(v) => patch("reviewStatus", v)} options={reviewStatuses} />
        <FieldSelect label="Relationship" value={editingVenue.relationshipStatus ?? "Cold"} onChange={(v) => patch("relationshipStatus", v)} options={relationStatuses} />
        <FieldNumber label="Contact Confidence (1-10)" value={editingVenue.contactConfidence ?? 5} onChange={(v) => patch("contactConfidence", v)} />
        <FieldTags label="Tags" value={editingVenue.tags ?? []} onChange={(v) => patch("tags", v)} />
        <FieldTextArea label="Notes" value={editingVenue.notes ?? ""} onChange={(v) => patch("notes", v)} />

        <button onClick={handleSave} className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-semibold mt-2">
          {editingId ? "Save Changes" : "Create Venue"}
        </button>
      </EditDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Venue"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
