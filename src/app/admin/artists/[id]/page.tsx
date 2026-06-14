"use client";

import { use, useEffect, useState, useCallback } from "react";
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
  Check,
  X,
  Upload,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import { upload } from "@vercel/blob/client";
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

// Phase 3.9 Scope 11 -- Archived removed from edit form; Developing + Left added.
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

// Asset kind labels for display
const ASSET_KINDS = [
  { kind: "profile_photo", label: "Profile Photo" },
  { kind: "press_photo", label: "Press Photos" },
  { kind: "logo", label: "Logo" },
  { kind: "music_link", label: "Music Links" },
  { kind: "video", label: "Videos" },
  { kind: "stage_plot", label: "Stage Plot" },
  { kind: "tech_rider", label: "Tech Rider" },
  { kind: "hospitality_rider", label: "Hospitality Rider" },
] as const;

type ArtistAsset = {
  id: string;
  artistId: string;
  kind: string;
  blobUrl: string;
  filename: string;
  mimeType: string;
  createdAt: string;
};

type ArtistLink = {
  id: string;
  artistId: string;
  title: string;
  url: string;
  sortOrder: number;
  createdAt: string;
};

function getAdminHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const raw = sessionStorage.getItem("highlife_admin");
    const session = raw ? (JSON.parse(raw) as { email?: string }) : null;
    if (session?.email) headers["x-admin-email"] = session.email;
  } catch { /* noop */ }
  return headers;
}

// Inline editable field component
function InlineEdit({ value, onSave, multiline }: { value: string; onSave: (v: string) => void; multiline?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span
        className="cursor-pointer hover:bg-white/6 rounded px-1 -mx-1 transition-colors"
        onClick={() => { setDraft(value); setEditing(true); }}
      >
        {value || <span className="text-zinc-600 italic">Click to set</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {multiline ? (
        <textarea
          className="bg-white/6 border border-white/12 rounded-lg px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-pink-500/40 min-w-[200px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
        />
      ) : (
        <input
          className="bg-white/6 border border-white/12 rounded-lg px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-pink-500/40 min-w-[120px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      )}
      <button
        onClick={() => { onSave(draft); setEditing(false); }}
        className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
      >
        <Check size={12} />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
      >
        <X size={12} />
      </button>
    </span>
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
  const [assets, setAssets] = useState<ArtistAsset[]>([]);
  const [links, setLinks] = useState<ArtistLink[]>([]);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);
  const [editingQuoteIdx, setEditingQuoteIdx] = useState<number | null>(null);
  const [editQuoteText, setEditQuoteText] = useState("");
  const [deleteQuoteIdx, setDeleteQuoteIdx] = useState<number | null>(null);
  const [newQuoteText, setNewQuoteText] = useState("");
  const canManage = canManageArtists(session);
  const canView = artist ? canViewArtist(artist, session) : false;

  useEffect(() => {
    setSession(getAdminSession());
    setAccessChecked(true);
  }, []);

  // Fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/artists/${id}/assets`, { headers: getAdminHeaders() });
      if (res.ok) setAssets(await res.json());
    } catch { /* noop */ }
  }, [id]);

  // Fetch links
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/artists/${id}/links`, { headers: getAdminHeaders() });
      if (res.ok) setLinks(await res.json());
    } catch { /* noop */ }
  }, [id]);

  useEffect(() => {
    fetchAssets();
    fetchLinks();
  }, [fetchAssets, fetchLinks]);

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

  // Inline save for a single field
  function inlineSave(field: string, value: string) {
    updateArtist(id, { [field]: value });
    triggerStoreUpdate();
  }

  // Handle file upload for an asset kind
  async function handleAssetUpload(kind: string, file: File) {
    setUploadingKind(kind);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `/api/admin/artists/${id}/assets/upload`,
      });
      // Save metadata to DB
      await fetch(`/api/admin/artists/${id}/assets`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          kind,
          blobUrl: blob.url,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      // If this is a profile_photo, update the artist image field too
      if (kind === "profile_photo") {
        updateArtist(id, { image: blob.url });
        triggerStoreUpdate();
      }

      await fetchAssets();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingKind(null);
    }
  }

  // Delete an asset
  async function handleAssetDelete(assetId: string) {
    try {
      await fetch(`/api/admin/artists/${id}/assets/${assetId}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      await fetchAssets();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  // Add a link
  async function handleAddLink() {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    try {
      await fetch(`/api/admin/artists/${id}/links`, {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ title: newLinkTitle.trim(), url: newLinkUrl.trim() }),
      });
      setNewLinkTitle("");
      setNewLinkUrl("");
      await fetchLinks();
    } catch (err) {
      console.error("Add link failed:", err);
    }
  }

  // Delete a link
  async function handleDeleteLink(linkId: string) {
    try {
      await fetch(`/api/admin/artists/${id}/links/${linkId}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      await fetchLinks();
    } catch (err) {
      console.error("Delete link failed:", err);
    }
  }

  const socialLinks = Object.entries(artist.socials).filter(([, v]) => v);

  // Get profile photo from assets, fallback to artist.image
  const profilePhotoAsset = assets.find((a) => a.kind === "profile_photo");
  const profilePhotoUrl = profilePhotoAsset?.blobUrl || artist.image;

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
              style={{ backgroundImage: `url(${profilePhotoUrl})` }}
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
          <Link
            href="/admin/campaigns"
            className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
          >
            <Megaphone size={14} /> Create Campaign
          </Link>
          <Link
            href={`/admin/epks?artist=${id}`}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-300 hover:text-foreground transition-colors inline-flex items-center gap-2"
          >
            <FileImage size={14} /> Generate EPK
          </Link>
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
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Short Pitch</h2>
              <p className="text-sm text-zinc-300">{artist.shortPitch}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Contact & Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ["Legal Name", artist.legalName],
                  ["Email", artist.email],
                  ["Phone", artist.phone],
                  ["Manager", artist.managerContact],
                  ["Set Length", artist.typicalSetLength],
                  ["Fee Range", artist.bookingFeeRange],
                  ["Age Appeal", artist.ageDemoAppeal],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">{label}</div>
                    <div className="text-sm text-zinc-300">{value}</div>
                  </div>
                ))}
              </div>

              {/* Inline-editable fields */}
              {canManage && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/6">
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Clean/Explicit</div>
                    <div className="text-sm text-zinc-300">
                      <InlineEdit value={artist.cleanExplicit} onSave={(v) => inlineSave("cleanExplicit", v)} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Travel Willingness</div>
                    <div className="text-sm text-zinc-300">
                      <InlineEdit value={artist.travelWillingness} onSave={(v) => inlineSave("travelWillingness", v)} />
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Performance Type</div>
                    <div className="text-sm text-zinc-300">
                      <InlineEdit value={artist.performanceType} onSave={(v) => inlineSave("performanceType", v)} />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[9px] tracking-[0.18em] uppercase text-zinc-600 mb-0.5">Press Quotes <span className="text-zinc-700 normal-case tracking-normal">(Format: PublishingName - Date: &quot;Quote&quot;)</span></div>
                    <div className="text-sm text-zinc-300">
                      <InlineEdit
                        value={artist.pressQuotes.join("\n")}
                        onSave={(v) => {
                          const quotes = v.split("\n").map((q) => q.trim()).filter(Boolean);
                          updateArtist(id, { pressQuotes: quotes });
                          triggerStoreUpdate();
                        }}
                        multiline
                      />
                    </div>
                  </div>
                </div>
              )}

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
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Press Quotes</h2>
              <p className="text-[10px] tracking-[0.12em] text-zinc-600">Format: PublishingName - Date: &quot;Quote&quot;</p>
              {artist.pressQuotes.length > 0 ? (
                <div className="space-y-2">
                  {artist.pressQuotes.map((q, i) => (
                    <div key={i} className="border-l-2 border-pink-500/30 pl-3">
                      {editingQuoteIdx === i ? (
                        <div className="space-y-2">
                          <textarea
                            value={editQuoteText}
                            onChange={(e) => setEditQuoteText(e.target.value)}
                            rows={2}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                            placeholder='Format: PublishingName - Date: "Quote"'
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (!editQuoteText.trim()) return;
                                const updated = [...artist.pressQuotes];
                                updated[i] = editQuoteText.trim();
                                updateArtist(id, { pressQuotes: updated });
                                triggerStoreUpdate();
                                setEditingQuoteIdx(null);
                                setEditQuoteText("");
                              }}
                              disabled={!editQuoteText.trim()}
                              className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                            >
                              <Check size={11} /> Save
                            </button>
                            <button
                              onClick={() => { setEditingQuoteIdx(null); setEditQuoteText(""); }}
                              className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-300"
                            >
                              <X size={11} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-400 italic">{q}</p>
                          {canManage && (
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={() => { setEditingQuoteIdx(i); setEditQuoteText(q); }}
                                className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-200 transition-colors"
                              >
                                <Pencil size={10} /> Edit
                              </button>
                              {deleteQuoteIdx === i ? (
                                <span className="inline-flex items-center gap-2">
                                  <span className="text-[10px] text-red-400">Delete?</span>
                                  <button
                                    onClick={() => {
                                      const updated = artist.pressQuotes.filter((_, idx) => idx !== i);
                                      updateArtist(id, { pressQuotes: updated });
                                      triggerStoreUpdate();
                                      setDeleteQuoteIdx(null);
                                    }}
                                    className="text-[10px] tracking-[0.18em] uppercase text-red-400 hover:text-red-300 font-bold"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeleteQuoteIdx(null)}
                                    className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-300"
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setDeleteQuoteIdx(i)}
                                  className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={10} /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 italic">No press quotes added yet.</p>
              )}

              {/* Add quote form */}
              {canManage && (
                <div className="space-y-2 pt-3 border-t border-white/6">
                  <textarea
                    value={newQuoteText}
                    onChange={(e) => setNewQuoteText(e.target.value)}
                    rows={2}
                    placeholder='Format: PublishingName - Date: "Quote"'
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                  />
                  <button
                    onClick={() => {
                      if (!newQuoteText.trim()) return;
                      const updated = [...artist.pressQuotes, newQuoteText.trim()];
                      updateArtist(id, { pressQuotes: updated });
                      triggerStoreUpdate();
                      setNewQuoteText("");
                    }}
                    disabled={!newQuoteText.trim()}
                    className="inline-flex items-center gap-1.5 btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-4 py-1.5 disabled:opacity-50"
                  >
                    <Plus size={11} /> Add Quote
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5 space-y-3">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Internal Notes</h2>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{artist.internalNotes || "No notes yet."}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}>
              <NotesThread entityType="artist" entityId={id} />
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* Links section -- social + custom links */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300">Links</h2>
                {canManage && (
                  <button
                    onClick={() => setShowLinksModal(true)}
                    className="text-[9px] tracking-[0.18em] uppercase text-pink-300 hover:text-pink-200 transition-colors inline-flex items-center gap-1"
                  >
                    <Link2 size={10} /> Manage
                  </button>
                )}
              </div>
              {socialLinks.length > 0 && (
                <div className="space-y-2 mb-3">
                  {socialLinks.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 capitalize">{key}</span>
                      <span className="text-xs text-pink-300 inline-flex items-center gap-1">
                        {value} <ExternalLink size={10} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {links.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/6">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.18em] uppercase text-zinc-500">{link.title}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-pink-300 inline-flex items-center gap-1 hover:text-pink-200 transition-colors"
                      >
                        Visit <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {socialLinks.length === 0 && links.length === 0 && (
                <p className="text-sm text-zinc-600 italic">No links added yet.</p>
              )}
            </motion.div>

            {/* Assets section -- real asset manager */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }} className="glass-card rounded-2xl p-5">
              <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-3">Assets</h2>
              <div className="space-y-2 text-sm text-zinc-500">
                {ASSET_KINDS.map(({ kind, label }) => {
                  const kindAssets = assets.filter((a) => a.kind === kind);
                  const isUploading = uploadingKind === kind;
                  return (
                    <div key={kind} className="py-1.5 border-b border-white/4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        {kindAssets.length > 0 ? (
                          <span className="text-[9px] tracking-[0.18em] uppercase text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">
                            {kindAssets.length} uploaded
                          </span>
                        ) : isUploading ? (
                          <span className="text-[9px] tracking-[0.18em] uppercase text-amber-300 bg-amber-400/10 rounded-full px-2 py-0.5 animate-pulse">
                            Uploading...
                          </span>
                        ) : (
                          <label className="text-[9px] tracking-[0.18em] uppercase text-zinc-400 bg-white/4 rounded-full px-2 py-0.5 cursor-pointer hover:bg-white/8 transition-colors inline-flex items-center gap-1">
                            <Upload size={9} /> Upload
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleAssetUpload(kind, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                      {kindAssets.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {kindAssets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between text-xs pl-2">
                              <a
                                href={asset.blobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-300 hover:text-pink-200 transition-colors truncate max-w-[180px]"
                              >
                                {asset.filename || "View file"}
                              </a>
                              {canManage && (
                                <button
                                  onClick={() => handleAssetDelete(asset.id)}
                                  className="text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                          {/* Allow uploading more of the same kind */}
                          <label className="text-[9px] text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors inline-flex items-center gap-1 pl-2">
                            <Plus size={9} /> Add another
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleAssetUpload(kind, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Drawer */}
      <EditDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Artist">
        <FieldText label="Name" value={editForm.name ?? ""} onChange={(v) => patch("name", v)} />
        <FieldSelect label="Status" value={editForm.status ?? "Testing"} onChange={(v) => patch("status", v)} options={statuses} />
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

      {/* Manage Links Modal */}
      {showLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLinksModal(false)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Manage Links</h3>
              <button onClick={() => setShowLinksModal(false)} className="p-1 rounded-lg hover:bg-white/8 text-zinc-400 hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Existing links */}
            {links.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/4">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-zinc-200 truncate">{link.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{link.url}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic mb-4">No custom links yet.</p>
            )}

            {/* Add link form */}
            <div className="space-y-2 pt-3 border-t border-white/8">
              <input
                type="text"
                placeholder="Link title"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40"
              />
              <button
                onClick={handleAddLink}
                disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                className="w-full btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

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
