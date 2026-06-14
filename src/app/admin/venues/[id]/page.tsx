"use client";

import { use, useEffect, useState, useCallback } from "react";
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
  Check,
  X,
  Link2,
  Unlink,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useVenues, triggerStoreUpdate } from "@/hooks/useAdminStore";
import { updateVenue, deleteVenue } from "@/lib/admin-store";
import { getAdminSession } from "@/lib/admin-auth";
import type { ReviewStatus, RelationshipStatus, AdminVenue, VenueType } from "@/lib/admin-data";
import EditDrawer, { FieldText, FieldSelect, FieldNumber, FieldTags } from "@/components/admin/EditDrawer";
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
  eventDate: string | null;
  createdAt: string;
};

const TIMELINE_KINDS = [
  { value: "added", label: "Added" },
  { value: "inquiry", label: "Inquiry" },
  { value: "responded", label: "Responded" },
  { value: "booked", label: "Booked" },
  { value: "event_hosted", label: "Event Hosted" },
  { value: "fell_through", label: "Fell Through" },
  { value: "pushed_back", label: "Pushed Back" },
  { value: "negotiating", label: "Negotiating / Discussion" },
  { value: "note", label: "Note" },
  { value: "other", label: "Other" },
];

const KIND_COLORS: Record<string, string> = {
  added: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  inquiry: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  responded: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  booked: "text-pink-300 bg-pink-400/10 border-pink-400/20",
  event_hosted: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  fell_through: "text-red-400 bg-red-400/10 border-red-400/20",
  pushed_back: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  negotiating: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  note: "text-zinc-300 bg-zinc-400/10 border-zinc-400/20",
  booking: "text-pink-300 bg-pink-400/10 border-pink-400/20",
  email: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  event: "text-violet-300 bg-violet-400/10 border-violet-400/20",
  other: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
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

function kindLabel(kind: string): string {
  const found = TIMELINE_KINDS.find((k) => k.value === kind);
  if (found) return found.label;
  return kind.replace(/_/g, " ");
}

// ── Inline Editable Field Component ─────────────────────────
function InlineEditable({
  value,
  fieldKey,
  venueId,
  label,
  type = "text",
  onSaved,
}: {
  value: string;
  fieldKey: string;
  venueId: string;
  label: string;
  type?: string;
  onSaved?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const session = getAdminSession();
      if (!session) return;
      const res = await fetch(`/api/admin/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ [fieldKey]: draft }),
      });
      if (res.ok) {
        triggerStoreUpdate();
        setEditing(false);
        onSaved?.();
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          className="p-1 rounded border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-50"
          title="Save"
        >
          <Check size={12} />
        </button>
        <button
          onClick={cancel}
          className="p-1 rounded border border-zinc-500/30 hover:border-zinc-500/60 bg-zinc-500/10 text-zinc-300 hover:text-zinc-200 transition-colors"
          title="Cancel"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="text-sm text-zinc-200 cursor-pointer hover:text-pink-200 transition-colors group"
      onClick={startEdit}
      title={`Click to edit ${label}`}
    >
      {value || <span className="text-zinc-500 italic">Click to add</span>}
      <Edit size={10} className="inline ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </div>
  );
}

// ── Inline Genres Editor ────────────────────────────────────
function InlineGenresEdit({
  genres,
  venueId,
}: {
  genres: string[];
  venueId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(genres.join(", "));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(genres.join(", "));
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const session = getAdminSession();
      if (!session) return;
      const parsed = draft.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify({ typicalGenres: parsed }),
      });
      if (res.ok) {
        triggerStoreUpdate();
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setDraft(genres.join(", "));
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
          autoFocus
          placeholder="Hip-Hop, R&B, Jazz"
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="p-1 rounded border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-50"
            title="Save"
          >
            <Check size={12} />
          </button>
          <button
            onClick={cancel}
            className="p-1 rounded border border-zinc-500/30 hover:border-zinc-500/60 bg-zinc-500/10 text-zinc-300 hover:text-zinc-200 transition-colors"
            title="Cancel"
          >
            <X size={12} />
          </button>
          <span className="text-[9px] text-zinc-500">Comma-separated</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 cursor-pointer group"
      onClick={startEdit}
      title="Click to edit genres"
    >
      {genres.length > 0 ? (
        genres.map((g) => (
          <span key={g} className="chip text-[9px]">{g}</span>
        ))
      ) : (
        <span className="text-zinc-500 italic text-sm">Click to add genres</span>
      )}
      <Edit size={10} className="self-center text-zinc-600 opacity-0 group-hover:opacity-60 transition-opacity ml-1" />
    </div>
  );
}

// ── Stage Info Types ────────────────────────────────────────
type StageInfoData = {
  logins: { id: string; email: string; displayName: string; isActive: boolean }[];
  inquiries: { id: string; inquiryNumber: string; artistName: string; eventDate: string; status: string; submittedAt: string }[];
};

export default function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const venues = useVenues();
  const venue = venues.find((v) => v.id === id);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AdminVenue>>({});
  const [showDelete, setShowDelete] = useState(false);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);

  // Timeline entry form state
  const [showTimelineForm, setShowTimelineForm] = useState(false);
  const [tlKind, setTlKind] = useState("note");
  const [tlBody, setTlBody] = useState("");
  const [tlDate, setTlDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tlArtist, setTlArtist] = useState("");
  const [tlPosting, setTlPosting] = useState(false);

  // Stage & Info sidebar state
  const [stageInfo, setStageInfo] = useState<StageInfoData | null>(null);

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

  // Load stage info
  useEffect(() => {
    if (!accessState.loaded) return;
    const session = getAdminSession();
    if (!session) return;
    fetch(`/api/admin/venues/${id}/stage-info`, {
      headers: { "x-admin-email": session.email },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStageInfo(data))
      .catch(() => setStageInfo(null));
  }, [id, accessState.loaded]);

  async function postTimelineEntry() {
    const session = getAdminSession();
    if (!session) return;
    setTlPosting(true);
    try {
      const payload: Record<string, string> = {
        kind: tlKind,
        body: tlKind === "inquiry" && tlArtist ? `${tlArtist}${tlBody ? ` - ${tlBody}` : ""}` : tlBody,
        eventDate: tlDate,
      };
      if (tlKind === "inquiry" && tlArtist) {
        payload.refId = tlArtist;
      }
      const res = await fetch(`/api/admin/venues/${id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-email": session.email },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setTimeline((prev) => [created, ...prev]);
        setTlBody("");
        setTlArtist("");
        setTlKind("note");
        setTlDate(new Date().toISOString().slice(0, 10));
        setShowTimelineForm(false);
      }
    } finally {
      setTlPosting(false);
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
            {/* Contact Information Card */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Contact Information</h2>

              {!accessState.loaded ? (
                <div className="py-8 text-center">
                  <Lock size={18} className="text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Loading access state...</p>
                </div>
              ) : !accessState.canSeeContacts ? (
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

                  <div className="flex items-start gap-3 sm:col-span-2 pt-2 border-t border-white/5">
                    <MapPin size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Address</div>
                      <div className="text-sm text-zinc-200">{venue.address}, {venue.city}, {venue.state}{venue.zipCode ? ` ${venue.zipCode}` : ""}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Contact Person</div>
                      {accessState.isOwnerAdmin ? (
                        <>
                          <InlineEditable value={venue.contactPerson} fieldKey="contactPerson" venueId={id} label="Contact Person" />
                          <div className="mt-0.5">
                            <InlineEditable value={venue.contactTitle} fieldKey="contactTitle" venueId={id} label="Title" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm text-zinc-200">{venue.contactPerson}</div>
                          <div className="text-xs text-zinc-500">{venue.contactTitle}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Email</div>
                      {accessState.isOwnerAdmin ? (
                        <InlineEditable value={venue.email} fieldKey="email" venueId={id} label="Email" type="email" />
                      ) : (
                        <div className="text-sm text-zinc-200">{venue.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Phone</div>
                      {accessState.isOwnerAdmin ? (
                        <InlineEditable value={venue.phone} fieldKey="phone" venueId={id} label="Phone" type="tel" />
                      ) : (
                        <div className="text-sm text-zinc-200">{venue.phone}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Website</div>
                      {accessState.isOwnerAdmin ? (
                        <InlineEditable value={venue.website} fieldKey="website" venueId={id} label="Website" />
                      ) : venue.website ? (
                        <a
                          href={ensureUrl(venue.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-pink-300 hover:text-pink-200 inline-flex items-center gap-1 break-all"
                        >
                          {venue.website} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <div className="text-sm text-zinc-500">--</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin size={14} className="text-pink-300 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Address</div>
                      <div className="text-sm text-zinc-200">{venue.address}, {venue.city}, {venue.state}{venue.zipCode ? ` ${venue.zipCode}` : ""}</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Venue Details Card */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">Venue Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Type", venue.venueType],
                  ["Zip Code", venue.zipCode || "--"],
                  ["Region", venue.region || "--"],
                  ["Capacity", venue.capacity > 0 ? venue.capacity.toLocaleString() : "N/A"],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                    <div className="text-sm text-zinc-300">{value}</div>
                  </div>
                ))}
                {/* Instagram -- inline editable for owner admins */}
                {accessState.loaded && accessState.canSeeContacts && (
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Instagram</div>
                    {accessState.isOwnerAdmin ? (
                      <InlineEditable value={venue.instagram} fieldKey="instagram" venueId={id} label="Instagram" />
                    ) : (
                      <div className="text-sm text-zinc-300">{venue.instagram || <span className="text-zinc-500 italic">--</span>}</div>
                    )}
                  </div>
                )}
                {/* Facebook -- inline editable for owner admins */}
                {accessState.loaded && accessState.canSeeContacts && (
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Facebook</div>
                    {accessState.isOwnerAdmin ? (
                      <InlineEditable value={venue.facebook} fieldKey="facebook" venueId={id} label="Facebook" />
                    ) : (
                      <div className="text-sm text-zinc-300">{venue.facebook || <span className="text-zinc-500 italic">--</span>}</div>
                    )}
                  </div>
                )}
                {/* Booking Email -- inline editable for owner admins */}
                {accessState.loaded && accessState.canSeeContacts && (
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Booking Email</div>
                    {accessState.isOwnerAdmin ? (
                      <InlineEditable value={venue.bookingEmail} fieldKey="bookingEmail" venueId={id} label="Booking Email" type="email" />
                    ) : (
                      <div className="text-sm text-zinc-300">{venue.bookingEmail}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1.5">Typical Genres Booked</div>
                {accessState.isOwnerAdmin ? (
                  <InlineGenresEdit genres={venue.typicalGenres} venueId={id} />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {venue.typicalGenres.map((g) => (
                      <span key={g} className="chip text-[9px]">{g}</span>
                    ))}
                  </div>
                )}
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

            {/* Timeline Card (dedicated, replaces old Notes & Timeline) */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
                  <Calendar size={12} /> Timeline
                </h2>
                <button
                  onClick={() => setShowTimelineForm(!showTimelineForm)}
                  className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200 transition-colors"
                >
                  <Plus size={11} /> Add Entry
                </button>
              </div>

              {/* Add Timeline Entry Form */}
              {showTimelineForm && (
                <div className="mb-4 p-4 rounded-xl border border-white/8 bg-black/30 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 block mb-1">Kind</label>
                      <div className="relative">
                        <select
                          value={tlKind}
                          onChange={(e) => setTlKind(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 appearance-none pr-8"
                        >
                          {TIMELINE_KINDS.map((k) => (
                            <option key={k.value} value={k.value}>{k.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 block mb-1">Date</label>
                      <input
                        type="date"
                        value={tlDate}
                        onChange={(e) => setTlDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60"
                      />
                    </div>
                  </div>
                  {tlKind === "inquiry" && (
                    <div>
                      <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 block mb-1">Artist Name</label>
                      <input
                        type="text"
                        value={tlArtist}
                        onChange={(e) => setTlArtist(e.target.value)}
                        placeholder="e.g. Nyla Vale"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-500 block mb-1">Notes (optional)</label>
                    <textarea
                      value={tlBody}
                      onChange={(e) => setTlBody(e.target.value)}
                      rows={2}
                      placeholder="Additional details..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 resize-y"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={postTimelineEntry}
                      disabled={tlPosting || (tlKind === "note" && !tlBody.trim())}
                      className="inline-flex items-center gap-1.5 btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-4 py-1.5 disabled:opacity-50"
                    >
                      <Plus size={11} /> {tlPosting ? "Posting..." : "Add Entry"}
                    </button>
                    <button
                      onClick={() => setShowTimelineForm(false)}
                      className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {timeline.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No timeline activity yet.</p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                  {timeline.map((t) => (
                    <li key={t.id} className="p-3 rounded-lg border border-white/8 bg-black/30">
                      <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full border text-[8px] tracking-[0.15em] uppercase ${KIND_COLORS[t.kind] || KIND_COLORS.other}`}>
                            {kindLabel(t.kind)}
                          </span>
                          {t.kind !== "note" && t.authorEmail && (
                            <span className="text-zinc-600">{authorLabel(t.authorEmail)}</span>
                          )}
                          {t.kind === "note" && (
                            <span>{authorLabel(t.authorEmail)}</span>
                          )}
                        </span>
                        <span>
                          {t.eventDate
                            ? new Date(t.eventDate).toLocaleDateString()
                            : new Date(t.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {t.body && (
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{t.body}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Notes Thread (unified notes component) */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}>
              <NotesThread entityType="venue" entityId={id} />
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Confidence */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 text-center">
              <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2">Contact Confidence</div>
              <div className="font-display text-5xl text-gradient-hero leading-none mb-1">{venue.contactConfidence}</div>
              <div className="text-[10px] text-zinc-500">out of 10</div>
            </motion.div>

            {/* Stage & Info (replaces Source & Compliance) */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Stage & Info</h2>

              {/* Login status */}
              <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1">Login Status</div>
                {!stageInfo ? (
                  <div className="text-xs text-zinc-500">Loading...</div>
                ) : stageInfo.logins.length > 0 ? (
                  <div className="space-y-1.5">
                    {stageInfo.logins.map((login) => (
                      <div key={login.id} className="flex items-center gap-2">
                        <Link2 size={11} className="text-emerald-400 shrink-0" />
                        <span className="text-sm text-emerald-300">Linked</span>
                        <span className="text-xs text-zinc-400 truncate">{login.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Unlink size={11} className="text-zinc-500 shrink-0" />
                    <span className="text-sm text-zinc-500">Unlinked</span>
                  </div>
                )}
              </div>

              {/* Current Inquiries */}
              {stageInfo && stageInfo.inquiries.length > 0 && (
                <div>
                  <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-1.5">Recent Inquiries</div>
                  <div className="space-y-2">
                    {stageInfo.inquiries.slice(0, 5).map((inq) => (
                      <Link
                        key={inq.id}
                        href={`/admin/inquiries/${inq.id}`}
                        className="block p-2 rounded-lg border border-white/6 hover:border-white/15 bg-black/20 transition-colors"
                      >
                        <div className="text-xs text-zinc-200 font-medium">{inq.artistName}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {inq.inquiryNumber} &middot; {inq.eventDate || "No date"} &middot;{" "}
                          <span className={`${
                            inq.status === "Booked" ? "text-emerald-400" :
                            inq.status === "New" ? "text-amber-300" :
                            "text-zinc-400"
                          }`}>{inq.status}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
        <div className="grid grid-cols-2 gap-3">
          <FieldText label="Zip Code" value={editForm.zipCode ?? ""} onChange={(v) => patch("zipCode", v)} placeholder="20001" />
          <FieldText label="Region" value={editForm.region ?? ""} onChange={(v) => patch("region", v)} placeholder="Washington, DC" />
        </div>
        <FieldSelect label="Review Status" value={editForm.reviewStatus ?? "Needs Review"} onChange={(v) => patch("reviewStatus", v)} options={reviewStatuses} />
        <FieldSelect label="Relationship" value={editForm.relationshipStatus ?? "Cold"} onChange={(v) => patch("relationshipStatus", v)} options={relationStatusesForForm} />
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
