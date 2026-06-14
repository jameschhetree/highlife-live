"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";

interface NoteRecord {
  id: string;
  entityType: string;
  entityId: string;
  authorType: string;
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesThreadProps {
  entityType: "artist" | "venue";
  entityId: string;
}

export default function NotesThread({ entityType, entityId }: NotesThreadProps) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getEmail = () => getAdminSession()?.email ?? "";

  const fetchNotes = useCallback(async () => {
    const email = getEmail();
    if (!email) return;
    try {
      const res = await fetch(
        `/api/admin/${entityType}s/${entityId}/notes`,
        { headers: { "x-admin-email": email }, cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as NoteRecord[];
        setNotes(data);
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handlePost() {
    const email = getEmail();
    if (!email || !newNoteText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(
        `/api/admin/${entityType}s/${entityId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-email": email },
          body: JSON.stringify({ body: newNoteText.trim() }),
        }
      );
      if (res.ok) {
        const created = (await res.json()) as NoteRecord;
        setNotes((prev) => [created, ...prev]);
        setNewNoteText("");
      }
    } finally {
      setPosting(false);
    }
  }

  function startEdit(note: NoteRecord) {
    setEditingId(note.id);
    setEditText(note.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function saveEdit(noteId: string) {
    const email = getEmail();
    if (!email || !editText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-email": email },
        body: JSON.stringify({ body: editText.trim() }),
      });
      if (res.ok) {
        const updated = (await res.json()) as NoteRecord;
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        setEditingId(null);
        setEditText("");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(noteId: string) {
    const email = getEmail();
    if (!email) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/notes/${noteId}`, {
        method: "DELETE",
        headers: { "x-admin-email": email },
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  }

  function authorLabel(note: NoteRecord): string {
    if (note.authorName) return note.authorName;
    const at = note.authorEmail.indexOf("@");
    return at > 0 ? note.authorEmail.slice(0, at) : note.authorEmail || "Unknown";
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 inline-flex items-center gap-2">
        <MessageSquare size={12} /> Notes ({notes.length})
      </h2>

      {/* Add note form */}
      <div className="space-y-2">
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          rows={3}
          placeholder="Add a note..."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
        />
        <button
          onClick={handlePost}
          disabled={posting || !newNoteText.trim()}
          className="inline-flex items-center gap-1.5 btn-gradient text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-4 py-1.5 disabled:opacity-50"
        >
          <Plus size={11} /> {posting ? "Posting..." : "Add Note"}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-xs text-zinc-500">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">No notes yet.</p>
      ) : (
        <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {notes.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded-xl border ${
                n.authorType === "agent"
                  ? "border-violet-400/15 bg-violet-400/5"
                  : "border-sky-400/15 bg-sky-400/5"
              }`}
            >
              {editingId === n.id ? (
                /* Inline edit mode */
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-pink-400/60 resize-y"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(n.id)}
                      disabled={savingEdit || !editText.trim()}
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
                    >
                      <Check size={11} /> {savingEdit ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-1.5 flex items-center justify-between gap-2">
                    <span>
                      {n.authorType === "agent" ? "Agent" : "Admin"} &middot; {authorLabel(n)}
                    </span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{n.body}</p>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => startEdit(n)}
                      className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Pencil size={10} /> Edit
                    </button>
                    {deleteConfirmId === n.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[10px] text-red-400">Delete?</span>
                        <button
                          onClick={() => handleDelete(n.id)}
                          disabled={deleting}
                          className="text-[10px] tracking-[0.18em] uppercase text-red-400 hover:text-red-300 font-bold disabled:opacity-50"
                        >
                          {deleting ? "..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-300"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(n.id)}
                        className="inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={10} /> Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
