"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Upload, RefreshCw, Lock, ChevronUp, ChevronDown, EyeOff } from "lucide-react";
import { useVenues, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { createVenue, updateVenue, deleteVenue } from "@/lib/admin-store";
import { getAdminSession, isOwnerAdmin } from "@/lib/admin-auth";
import type { VenueType, ReviewStatus, RelationshipStatus, AdminVenue } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldSelect, FieldNumber, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const venueTypes: VenueType[] = ["Club", "Lounge", "Festival", "Theater", "College", "Restaurant/Bar", "Private Event Buyer", "Promoter", "Cultural Center", "Church/Event Hall", "Amphitheater", "Stadium", "Other"];
const reviewStatuses: ReviewStatus[] = ["Needs Review", "Verified", "Do Not Contact", "Duplicate"];
// "Not a Fit" removed from UI dropdown (Phase 3.9 Scope 8). Existing rows still display.
const relationStatusesForForm: RelationshipStatus[] = ["Cold", "Warm", "Active Relationship", "Booked Before", "Recent Flop", "Do Not Contact"];

type SortKey = "name" | "capacity" | "status" | "relationship" | "type";

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
  "Recent Flop": "text-orange-400",
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
  region: "",
  zipCode: "",
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
  tags: [],
  lastContacted: null,
  nextFollowUp: null,
  relationshipStatus: "Cold",
};

export default function VenuesPage() {
  const venues = useVenues();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showDnc, setShowDnc] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hideNeedsReview, setHideNeedsReview] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Partial<AdminVenue>>(defaultVenue);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVenue | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Owner-admin gate for sensitive controls (CSV import, cron sync, edit, delete) +
  // contact-info preview in the list. Agents see the venue list but no contacts (Phase 3.7 D).
  // Default-deny while session loads (Dok HL Live 2026-06-03 "100ms buffer" rule).
  const [permState, setPermState] = useState<{ loaded: boolean; isOwnerAdmin: boolean; grantedVenueIds: string[] }>({ loaded: false, isOwnerAdmin: false, grantedVenueIds: [] });
  useEffect(() => {
    let cancelled = false;
    const session = getAdminSession();
    const isOwner = isOwnerAdmin(session);
    if (isOwner) {
      setPermState({ loaded: true, isOwnerAdmin: true, grantedVenueIds: [] });
      return;
    }
    if (!session) {
      setPermState({ loaded: true, isOwnerAdmin: false, grantedVenueIds: [] });
      return;
    }
    fetch("/api/venue-access", { headers: { "x-admin-email": session.email }, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const granted: string[] = Array.isArray(j?.grantedVenueIds) ? j.grantedVenueIds : [];
        setPermState({ loaded: true, isOwnerAdmin: false, grantedVenueIds: granted });
      })
      .catch(() => {
        if (cancelled) return;
        setPermState({ loaded: true, isOwnerAdmin: false, grantedVenueIds: [] });
      });
    return () => { cancelled = true; };
  }, []);

  function handleSort(col: SortKey) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir(col === "capacity" ? "desc" : "asc");
    }
  }

  const filtered = venues
    .filter((v) => {
      const q = search.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        (permState.isOwnerAdmin && v.contactPerson.toLowerCase().includes(q));
      const matchesType = typeFilter === "All Types" || v.venueType === typeFilter;
      const matchesDnc =
        showDnc || (v.reviewStatus !== "Do Not Contact" && v.relationshipStatus !== "Do Not Contact");
      const matchesReview = !hideNeedsReview || v.reviewStatus !== "Needs Review";
      return matchesSearch && matchesType && matchesDnc && matchesReview;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "capacity") return ((a.capacity ?? 0) - (b.capacity ?? 0)) * dir;
      if (sortBy === "status") return a.reviewStatus.localeCompare(b.reviewStatus) * dir;
      if (sortBy === "relationship") return a.relationshipStatus.localeCompare(b.relationshipStatus) * dir;
      if (sortBy === "type") return a.venueType.localeCompare(b.venueType) * dir;
      return a.name.localeCompare(b.name) * dir;
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
            <button
              onClick={() => setHideNeedsReview((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-[10px] tracking-[0.18em] uppercase transition-colors inline-flex items-center gap-1.5 ${
                hideNeedsReview
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                  : "border-white/10 bg-black/40 text-zinc-300 hover:text-foreground hover:border-white/25"
              }`}
            >
              <EyeOff size={11} />
              {hideNeedsReview ? "Review: hidden" : "Hide Needs Review"}
            </button>
            <button
              onClick={() => setShowDnc((v) => !v)}
              className={`px-3 py-2 rounded-xl border text-[10px] tracking-[0.18em] uppercase transition-colors inline-flex items-center gap-1.5 ${
                showDnc
                  ? "border-red-400/40 bg-red-400/10 text-red-300"
                  : "border-white/10 bg-black/40 text-zinc-300 hover:text-foreground hover:border-white/25"
              }`}
            >
              {showDnc ? "DNC: shown" : "Show DNC"}
            </button>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer"
          >
            <option value="All Types" className="bg-zinc-900">All Types</option>
            {venueTypes.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">{t}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              const next = e.target.value as SortKey;
              setSortBy(next);
              setSortDir(next === "capacity" ? "desc" : "asc");
            }}
            className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 focus:outline-none focus:border-pink-500/40 appearance-none cursor-pointer"
          >
            <option value="name" className="bg-zinc-900">Sort: Name</option>
            <option value="capacity" className="bg-zinc-900">Sort: Capacity</option>
            <option value="status" className="bg-zinc-900">Sort: Status</option>
            <option value="relationship" className="bg-zinc-900">Sort: Relationship</option>
            <option value="type" className="bg-zinc-900">Sort: Type</option>
          </select>
          <button
            onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
            className="px-3 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-zinc-300 hover:text-foreground hover:border-white/25 transition-colors inline-flex items-center gap-1.5"
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            {sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="text-[10px] tracking-[0.12em] uppercase">{sortDir === "asc" ? "ASC" : "DESC"}</span>
          </button>
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
                  {([
                    { key: "name" as SortKey, label: "Venue", hide: "" },
                    { key: "type" as SortKey, label: "Type", hide: "hidden md:table-cell" },
                    { key: null, label: "Zip / Region", hide: "hidden lg:table-cell" },
                    { key: "capacity" as SortKey, label: "Capacity", hide: "hidden xl:table-cell" },
                    { key: "status" as SortKey, label: "Status", hide: "" },
                    { key: "relationship" as SortKey, label: "Relationship", hide: "hidden lg:table-cell" },
                  ] as const).map(({ key, label, hide }) => (
                    <th
                      key={label}
                      className={`text-left font-normal px-4 py-3 ${hide} ${key ? "cursor-pointer select-none group/th hover:text-zinc-300 transition-colors" : ""}`}
                      onClick={key ? () => handleSort(key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {key && sortBy === key && (
                          sortDir === "asc"
                            ? <ChevronUp size={10} className="text-pink-400" />
                            : <ChevronDown size={10} className="text-pink-400" />
                        )}
                        {key && sortBy !== key && (
                          <ChevronUp size={10} className="text-zinc-700 opacity-0 group-hover/th:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </th>
                  ))}
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
                            {permState.grantedVenueIds.includes(venue.id) ? null : <Lock size={9} className="text-zinc-600" />}
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
                    <td className="px-4 py-3.5 text-zinc-400 hidden lg:table-cell">{venue.zipCode || venue.region || "—"}</td>
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
        <div className="grid grid-cols-2 gap-3">
          <FieldText label="Zip Code" value={editingVenue.zipCode ?? ""} onChange={(v) => patch("zipCode", v)} placeholder="20001" />
          <FieldText label="Region" value={editingVenue.region ?? ""} onChange={(v) => patch("region", v)} placeholder="Washington, DC" />
        </div>
        <FieldSelect label="Venue Type" value={editingVenue.venueType ?? "Club"} onChange={(v) => patch("venueType", v)} options={venueTypes} />
        <FieldNumber label="Capacity" value={editingVenue.capacity ?? 0} onChange={(v) => patch("capacity", v)} />
        <FieldTags label="Typical Genres" value={editingVenue.typicalGenres ?? []} onChange={(v) => patch("typicalGenres", v)} />
        <FieldText label="Booking Email" value={editingVenue.bookingEmail ?? ""} onChange={(v) => patch("bookingEmail", v)} type="email" />
        <FieldSelect label="Review Status" value={editingVenue.reviewStatus ?? "Needs Review"} onChange={(v) => patch("reviewStatus", v)} options={reviewStatuses} />
        <FieldSelect label="Relationship" value={editingVenue.relationshipStatus ?? "Cold"} onChange={(v) => patch("relationshipStatus", v)} options={relationStatusesForForm} />
        <FieldNumber label="Contact Confidence (1-10)" value={editingVenue.contactConfidence ?? 5} onChange={(v) => patch("contactConfidence", v)} />
        <FieldTags label="Tags" value={editingVenue.tags ?? []} onChange={(v) => patch("tags", v)} />
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
