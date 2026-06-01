"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash,
  Megaphone,
  Plus,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { useVenues, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateVenue, deleteVenue } from "@/lib/admin-store";
import type { ReviewStatus, RelationshipStatus, AdminVenue, VenueType } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldTextArea, FieldSelect, FieldNumber, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const venueTypes: VenueType[] = ["Club", "Lounge", "Festival", "Theater", "College", "Restaurant/Bar", "Private Event Buyer", "Promoter", "Cultural Center", "Church/Event Hall", "Other"];
const reviewStatuses: ReviewStatus[] = ["Needs Review", "Verified", "Do Not Contact", "Duplicate"];
const relationStatuses: RelationshipStatus[] = ["Cold", "Warm", "Active Relationship", "Booked Before", "Not a Fit", "Do Not Contact"];
const regions = ["Washington, DC", "Baltimore, MD", "Prince George's County, MD", "Montgomery County, MD", "Northern Virginia"];

const reviewColor: Record<ReviewStatus, string> = {
  "Needs Review": "text-amber-300 bg-amber-400/10 border-amber-400/20",
  Verified: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  "Do Not Contact": "text-red-400 bg-red-400/10 border-red-400/20",
  Duplicate: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const relationColor: Record<RelationshipStatus, string> = {
  Cold: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  Warm: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  "Active Relationship": "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  "Booked Before": "text-pink-300 bg-pink-400/10 border-pink-400/20",
  "Not a Fit": "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  "Do Not Contact": "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const venues = useVenues();
  const venue = venues.find((v) => v.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminVenue>>({});
  const [showDelete, setShowDelete] = useState(false);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl uppercase mb-2">Venue Not Found</h1>
          <Link href="/admin/venues" className="text-pink-300 text-sm hover:underline">Back to Venues</Link>
        </div>
      </div>
    );
  }

  function openEdit() {
    setEditForm({ ...venue });
    setDrawerOpen(true);
  }

  function handleSave() {
    updateVenue(id, editForm);
    triggerStoreUpdate();
    setDrawerOpen(false);
  }

  function handleDelete() {
    deleteVenue(id);
    triggerStoreUpdate();
    router.push("/admin/venues");
  }

  function patch(field: string, value: unknown) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-6 lg:px-10 py-6">
        <Link href="/admin/venues" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors">
          <ArrowLeft size={12} /> Back to Venues
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display uppercase text-3xl tracking-tight">{venue.name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${reviewColor[venue.reviewStatus]}`}>
                {venue.reviewStatus}
              </span>
              <span className={`text-[9px] tracking-[0.18em] uppercase border rounded-full px-2 py-0.5 ${relationColor[venue.relationshipStatus]}`}>
                {venue.relationshipStatus}
              </span>
              <span className="chip text-[9px]">{venue.venueType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openEdit} className="p-2 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
              <Trash size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} className="flex flex-wrap gap-2">
          <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Megaphone size={14} /> Add to Campaign
          </button>
          <button className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Match Artists
          </button>
          <button className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Add Note
          </button>
          {venue.reviewStatus !== "Do Not Contact" && (
            <button
              onClick={() => { updateVenue(id, { reviewStatus: "Do Not Contact" }); triggerStoreUpdate(); }}
              className="px-4 py-2 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-black/40 text-sm text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-2"
            >
              <AlertTriangle size={14} /> Mark Do Not Contact
            </button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-pink-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Contact Person</div>
                    <div className="text-sm text-zinc-200">{venue.contactPerson}</div>
                    <div className="text-xs text-zinc-500">{venue.contactTitle}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-pink-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Email</div>
                    <div className="text-sm text-zinc-200">{venue.email}</div>
                    {venue.talentBuyerEmail !== venue.email && (
                      <div className="text-xs text-zinc-500 mt-0.5">Talent: {venue.talentBuyerEmail}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={14} className="text-pink-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Phone</div>
                    <div className="text-sm text-zinc-200">{venue.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe size={14} className="text-pink-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Website</div>
                    <div className="text-sm text-pink-300 inline-flex items-center gap-1">
                      {venue.website} <ExternalLink size={10} />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin size={14} className="text-pink-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Address</div>
                    <div className="text-sm text-zinc-200">{venue.address}, {venue.city}, {venue.state}</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Venue Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Type", venue.venueType],
                  ["Region", venue.region],
                  ["Capacity", venue.capacity > 0 ? venue.capacity.toLocaleString() : "N/A"],
                  ["Instagram", venue.instagram],
                  ["Booking Email", venue.bookingEmail],
                  ["Talent Buyer", venue.talentBuyerEmail],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                    <div className="text-sm text-zinc-300">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1.5">Typical Genres Booked</div>
                <div className="flex flex-wrap gap-1.5">
                  {venue.typicalGenres.map((g) => (
                    <span key={g} className="chip text-[9px]">{g}</span>
                  ))}
                </div>
              </div>
              {venue.tags.length > 0 && (
                <div className="mt-3">
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1.5">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {venue.tags.map((t) => (
                      <span key={t} className="text-[9px] tracking-[0.18em] uppercase text-pink-300 bg-pink-500/10 border border-pink-500/20 rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Notes</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{venue.notes}</p>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 text-center">
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2">Contact Confidence</div>
              <div className="font-display text-5xl text-gradient-hero leading-none mb-1">{venue.contactConfidence}</div>
              <div className="text-[10px] text-zinc-500">out of 10</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Source & Compliance</h2>
              {[
                ["Source", venue.source],
                ["Source Date", venue.sourceDate],
                ["Source URL", venue.sourceUrl || "N/A"],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                  <div className="text-sm text-zinc-300 break-all">{value}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Timeline</h2>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Last Contacted</div>
                <div className="text-sm text-zinc-300">{venue.lastContacted || "Never"}</div>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Next Follow-up</div>
                <div className="text-sm text-zinc-300">{venue.nextFollowUp || "Not scheduled"}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Venue">
        <FieldText label="Name" value={editForm.name ?? ""} onChange={(v) => patch("name", v)} />
        <FieldText label="Contact Person" value={editForm.contactPerson ?? ""} onChange={(v) => patch("contactPerson", v)} />
        <FieldText label="Email" value={editForm.email ?? ""} onChange={(v) => patch("email", v)} type="email" />
        <FieldText label="Phone" value={editForm.phone ?? ""} onChange={(v) => patch("phone", v)} />
        <FieldSelect label="Venue Type" value={editForm.venueType ?? "Club"} onChange={(v) => patch("venueType", v)} options={venueTypes} />
        <FieldNumber label="Capacity" value={editForm.capacity ?? 0} onChange={(v) => patch("capacity", v)} />
        <FieldSelect label="Region" value={editForm.region ?? "Washington, DC"} onChange={(v) => patch("region", v)} options={regions} />
        <FieldSelect label="Review Status" value={editForm.reviewStatus ?? "Needs Review"} onChange={(v) => patch("reviewStatus", v)} options={reviewStatuses} />
        <FieldSelect label="Relationship" value={editForm.relationshipStatus ?? "Cold"} onChange={(v) => patch("relationshipStatus", v)} options={relationStatuses} />
        <FieldTextArea label="Notes" value={editForm.notes ?? ""} onChange={(v) => patch("notes", v)} />
        <button onClick={handleSave} className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-semibold mt-2">
          Save Changes
        </button>
      </EditDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete "${venue.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
