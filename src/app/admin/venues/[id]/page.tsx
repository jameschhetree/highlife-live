"use client";

import { use, useEffect, useState } from "react";
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
  Lock,
  Clock,
} from "lucide-react";
import { useVenues, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateVenue, deleteVenue } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";
import type { ReviewStatus, RelationshipStatus, AdminVenue, VenueType } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldTextArea, FieldSelect, FieldNumber, FieldTags } from "@/components/admin/EditDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import NotesThread from "@/components/admin/notes-thread";

const venueTypes: VenueType[] = ["Club", "Lounge", "Festival", "Theater", "College", "Restaurant/Bar", "Private Event Buyer", "Promoter", "Cultural Center", "Church/Event Hall", "Amphitheater", "Stadium", "Other"];
const reviewStatuses: ReviewStatus[] = ["Needs Review", "Verified", "Do Not Contact", "Duplicate"];
// Phase 3.9 Scope 8 — "Not a Fit" removed from form options; "Recent Flop" added.
const relationStatusesForForm: RelationshipStatus[] = ["Cold", "Warm", "Active Relationship", "Booked Before", "Recent Flop", "Do Not Contact"];

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
  "Recent Flop": "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "Do Not Contact": "text-red-400 bg-red-400/10 border-red-400/20",
};

type TimelineRow = {
  id: string;
  kind: string;
  refId: string | null;
  body: string;
  authorEmail: string;
  createdAt: string;
};

function authorLabel(email: string): string {
  if (!email) return "system";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

function ensureUrl(s: string): string {
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const venues = useVenues();
  const venue = venues.find((v) => v.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminVenue>>({});
  const [showDelete, setShowDelete] = useState(false);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [noteText, setNoteText] = useState("");
  const [posting, setPosting] = useState(false);

  // Venue contact access gate (Phase 3.6 / Workflow C)
  const [accessState, setAccessState] = useState<{
    loaded: boolean;
    canSeeContacts: boolean;
    requestPending: boolean;
    isOwnerAdmin: boolean;
  }>({ loaded: false, canSeeContacts: false, requestPending: false, isOwnerAdmin: false });
  const [requestingAccess, setRequestingAccess] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;
    let cancelled = false;
    const start = performance.now();
    fetch("/api/venue-access", { headers: { "x-admin-email": session.email }, cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const isOwner = Boolean(j?.ownerAdmin);
        const granted: string[] = Array.isArray(j?.grantedVenueIds) ? j.grantedVenueIds : [];
        const pending: string[] = Array.isArray(j?.pendingVenueIds) ? j.pendingVenueIds : [];
        // 100ms minimum render-gate so contacts never flash visible before the
        // access check returns (Dok HL Live 2026-06-03 — "i caught a quick glimpse").
        const elapsed = performance.now() - start;
        const wait = Math.max(0, 100 - elapsed);
        setTimeout(() => {
          if (cancelled) return;
          setAccessState({
            loaded: true,
            isOwnerAdmin: isOwner,
            canSeeContacts: isOwner || granted.includes(id),
            requestPending: pending.includes(id),
          });
        }, wait);
      })
      .catch(() => {
        if (cancelled) return;
        setAccessState({ loaded: true, canSeeContacts: false, requestPending: false, isOwnerAdmin: false });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load timeline whenever access is loaded.
  useEffect(() => {
    if (!accessState.loaded) return;
    const session = getAdminSession();
    if (!session) return;
    fetch(`/api/admin/venues/${id}/timeline`, {
      headers: { "x-admin-email": session.email },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => setTimeline(Array.isArray(rows) ? rows : []))
      .catch(() => setTimeline([]));
  }, [id, accessState.loaded]);

  async function postNote() {
    const session = getAdminSession();
    if (!session || !noteText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/admin/venues/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ body: noteText.trim(), kind: "note" }),
      });
      if (res.ok) {
        const created = await res.json();
        setTimeline((prev) => [created, ...prev]);
        setNoteText("");
      }
    } finally {
      setPosting(false);
    }
  }

  async function handleRequestAccess() {
    const session = getAdminSession();
    if (!session) return;
    setRequestingAccess(true);
    try {
      await fetch("/api/venue-access", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ venueId: id }),
      });
      setAccessState((s) => ({ ...s, requestPending: true }));
    } finally {
      setRequestingAccess(false);
    }
  }

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
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
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
            {accessState.isOwnerAdmin && (
              <>
                <button onClick={openEdit} className="p-2 rounded-lg border border-white/8 hover:bg-white/4 text-zinc-400 hover:text-foreground transition-colors">
                  <Edit size={14} />
                </button>
                <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
                  <Trash size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }} className="flex flex-wrap gap-2">
          <button className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
            <Megaphone size={14} /> Add to Campaign
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

              {!accessState.loaded ? (
                // Default-deny render until access check returns (+100ms buffer).
                // Prevents the "I caught a glimpse" flash bug Dok reported 2026-06-03.
                <div className="py-8 text-center">
                  <Lock size={18} className="text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Loading access state...</p>
                </div>
              ) : !accessState.canSeeContacts ? (
                // Agent view without an active grant → contacts hidden, request CTA shown
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
                    <Lock size={16} className="text-amber-300 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm text-amber-200 font-medium">Contact details hidden</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Venue contacts (name, email, phone, booking + talent buyer addresses) are restricted to owner-admins by default. Request access below and an owner-admin will review.
                      </div>
                    </div>
                  </div>

                  {accessState.requestPending ? (
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm text-amber-300 cursor-not-allowed"
                    >
                      <Clock size={14} /> Request pending owner-admin approval
                    </button>
                  ) : (
                    <button
                      onClick={handleRequestAccess}
                      disabled={requestingAccess}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-400/30 hover:border-pink-400/60 bg-pink-500/10 hover:bg-pink-500/20 text-sm text-pink-300 hover:text-pink-200 transition-colors disabled:opacity-50"
                    >
                      <Mail size={14} /> {requestingAccess ? "Sending..." : "Request venue contacts"}
                    </button>
                  )}

                  {/* Non-sensitive fields still visible to agents */}
                  <div className="flex items-start gap-3 sm:col-span-2 pt-2 border-t border-white/5">
                    <MapPin size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Address</div>
                      <div className="text-sm text-zinc-200">{venue.address}, {venue.city}, {venue.state}</div>
                    </div>
                  </div>
                </div>
              ) : (
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
                      {venue.website ? (
                        <a
                          href={ensureUrl(venue.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-300 hover:text-pink-200 inline-flex items-center gap-1 break-all"
                        >
                          {venue.website} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <div className="text-sm text-zinc-500">—</div>
                      )}
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
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Venue Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(!accessState.loaded || !accessState.canSeeContacts
                  ? [
                      ["Type", venue.venueType],
                      ["Region", venue.region],
                      ["Capacity", venue.capacity > 0 ? venue.capacity.toLocaleString() : "N/A"],
                    ]
                  : [
                      ["Type", venue.venueType],
                      ["Region", venue.region],
                      ["Capacity", venue.capacity > 0 ? venue.capacity.toLocaleString() : "N/A"],
                      ["Instagram", venue.instagram],
                      ["Booking Email", venue.bookingEmail],
                      ["Talent Buyer", venue.talentBuyerEmail],
                    ]
                ).map(([label, value]) => (
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
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Notes & Timeline</h2>
              {venue.notes && (
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words mb-4">{venue.notes}</p>
              )}
              <div className="space-y-2 mb-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  placeholder="Add a quick note (visible to owners + scoped agents)"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                />
                <button
                  onClick={postNote}
                  disabled={posting || !noteText.trim()}
                  className="inline-flex items-center gap-1.5 btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-4 py-1.5 disabled:opacity-50"
                >
                  <Plus size={11} /> {posting ? "Posting…" : "Add Note"}
                </button>
              </div>
              {timeline.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No timeline activity yet.</p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                  {timeline.map((t) => (
                    <li key={t.id} className="p-3 rounded-lg border border-white/8 bg-black/30">
                      <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1 flex items-center justify-between gap-2">
                        <span>
                          {t.kind === "note" ? authorLabel(t.authorEmail) : t.kind}
                        </span>
                        <span>{new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{t.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}>
              <NotesThread entityType="venue" entityId={id} />
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
        <FieldText label="Zip Code" value={editForm.zipCode ?? ""} onChange={(v) => patch("zipCode", v)} placeholder="20001" />
        <FieldSelect label="Review Status" value={editForm.reviewStatus ?? "Needs Review"} onChange={(v) => patch("reviewStatus", v)} options={reviewStatuses} />
        <FieldSelect label="Relationship" value={editForm.relationshipStatus ?? "Cold"} onChange={(v) => patch("relationshipStatus", v)} options={relationStatusesForForm} />
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
