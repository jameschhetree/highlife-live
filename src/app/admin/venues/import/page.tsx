"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { addVenues } from "@/lib/admin-store";
import { triggerStoreUpdate } from "@/hooks/useAdminStore";
import type { AdminVenue } from "@/lib/admin-data";

type ImportState = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

export default function VenueImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<Partial<AdminVenue>[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");
  const [addedCount, setAddedCount] = useState(0);
  const [dupeCount, setDupeCount] = useState(0);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
    await processCSV(text);
  }

  async function handlePasteSubmit() {
    if (!csvText.trim()) return;
    await processCSV(csvText);
  }

  async function processCSV(csv: string) {
    setState("parsing");
    setErrorMsg("");
    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, type: "venues" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }

      const data = await res.json();
      const rows = data.parsed as Partial<AdminVenue>[];
      setParsedRows(rows);
      // Select all rows by default
      setSelectedRows(new Set(rows.map((_, i) => i)));
      setState("preview");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to parse CSV");
      setState("error");
    }
  }

  function toggleRow(idx: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedRows.size === parsedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(parsedRows.map((_, i) => i)));
    }
  }

  function commitToStore() {
    setState("importing");
    const toAdd = parsedRows
      .filter((_, i) => selectedRows.has(i))
      .map((row) => ({
        ...row,
        source: "CSV Import" as const,
        sourceUrl: "",
        sourceDate: new Date().toISOString().slice(0, 10),
        reviewStatus: "Needs Review" as const,
        isDemo: true as const,
      }));

    const added = addVenues(toAdd as Omit<AdminVenue, "id" | "isDemo">[]);
    triggerStoreUpdate();

    setAddedCount(added.length);
    setDupeCount(toAdd.length - added.length);
    setState("done");
  }

  function reset() {
    setState("idle");
    setCsvText("");
    setParsedRows([]);
    setSelectedRows(new Set());
    setErrorMsg("");
    setAddedCount(0);
    setDupeCount(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <Link
          href="/admin/venues"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-zinc-500 hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to Venues
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display uppercase text-3xl tracking-tight">Import Venues</h1>
            <p className="text-[11px] text-zinc-500 mt-1">
              Upload a CSV file or paste CSV text. AI will normalize fields into the venue schema.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl space-y-8">
        {/* Step 1: Upload */}
        <AnimatePresence mode="wait">
          {(state === "idle" || state === "error") && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* File Upload */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4 flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-pink-300" /> Upload CSV File
                </h2>
                <label className="block border-2 border-dashed border-white/10 hover:border-pink-500/30 rounded-2xl p-10 text-center cursor-pointer transition-colors group">
                  <Upload size={28} className="mx-auto text-zinc-500 group-hover:text-pink-300 transition-colors mb-3" />
                  <div className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                    Click to select a .csv file
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-1">
                    Columns can be named anything -- AI will map them to the venue schema
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste CSV */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-[11px] tracking-[0.22em] uppercase text-zinc-300 mb-4">
                  Or Paste CSV Text
                </h2>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email,city,state,type,capacity&#10;Echostage,talent@echostage.com,Washington,DC,Club,3000&#10;..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/4 border border-white/8 text-sm text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/40 font-mono resize-none"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={!csvText.trim()}
                  className={`mt-3 btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
                    !csvText.trim() ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <Upload size={14} /> Parse with AI
                </button>
              </div>

              {/* Error */}
              {state === "error" && (
                <div className="glass-card rounded-2xl p-5 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <div>
                      <div className="text-sm text-red-300 font-medium">Import Error</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{errorMsg}</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Loading */}
          {state === "parsing" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="glass-card rounded-2xl p-10 text-center"
            >
              <Loader2 size={32} className="mx-auto text-pink-300 animate-spin mb-4" />
              <div className="text-sm text-zinc-300">Parsing CSV with AI...</div>
              <div className="text-[10px] text-zinc-600 mt-1">
                Normalizing fields, cleaning data, mapping to venue schema
              </div>
            </motion.div>
          )}

          {/* Preview */}
          {state === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm text-zinc-200 font-medium">
                    {parsedRows.length} venue{parsedRows.length !== 1 ? "s" : ""} parsed
                  </h2>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {selectedRows.size} selected for import. Review and deselect any you don't want.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reset}
                    className="px-3 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-400 hover:text-foreground transition-colors inline-flex items-center gap-2"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={commitToStore}
                    disabled={selectedRows.size === 0}
                    className={`btn-gradient px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
                      selectedRows.size === 0 ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    <Check size={14} /> Add {selectedRows.size} to Master List
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] tracking-[0.18em] uppercase text-zinc-500 border-b border-white/8">
                        <th className="text-left font-normal px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedRows.size === parsedRows.length}
                            onChange={toggleAll}
                            className="rounded border-white/20 bg-white/4 text-pink-500 focus:ring-pink-500/20"
                          />
                        </th>
                        <th className="text-left font-normal px-4 py-3">Name</th>
                        <th className="text-left font-normal px-4 py-3 hidden md:table-cell">Type</th>
                        <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">City</th>
                        <th className="text-left font-normal px-4 py-3 hidden lg:table-cell">Contact</th>
                        <th className="text-left font-normal px-4 py-3 hidden xl:table-cell">Email</th>
                        <th className="text-left font-normal px-4 py-3 hidden xl:table-cell">Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-white/4 last:border-0 transition-colors cursor-pointer ${
                            selectedRows.has(i) ? "bg-pink-500/5 hover:bg-pink-500/8" : "hover:bg-white/3 opacity-50"
                          }`}
                          onClick={() => toggleRow(i)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(i)}
                              onChange={() => toggleRow(i)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-white/20 bg-white/4 text-pink-500 focus:ring-pink-500/20"
                            />
                          </td>
                          <td className="px-4 py-3 text-zinc-200 font-medium">{row.name || "Unnamed"}</td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="chip text-[9px]">{row.venueType || "Other"}</span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">
                            {row.city}, {row.state}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 hidden lg:table-cell">{row.contactPerson || "-"}</td>
                          <td className="px-4 py-3 text-zinc-500 hidden xl:table-cell">{row.email || "-"}</td>
                          <td className="px-4 py-3 text-zinc-400 hidden xl:table-cell">
                            {row.capacity && row.capacity > 0 ? row.capacity.toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Importing */}
          {state === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-10 text-center"
            >
              <Loader2 size={32} className="mx-auto text-pink-300 animate-spin mb-4" />
              <div className="text-sm text-zinc-300">Adding venues to master list...</div>
            </motion.div>
          )}

          {/* Done */}
          {state === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-emerald-300" />
              </div>
              <h2 className="font-display text-2xl uppercase tracking-tight mb-2">Import Complete</h2>
              <p className="text-sm text-zinc-400 mb-1">
                {addedCount} venue{addedCount !== 1 ? "s" : ""} added to the master list
              </p>
              {dupeCount > 0 && (
                <p className="text-xs text-amber-300">
                  {dupeCount} duplicate{dupeCount !== 1 ? "s" : ""} skipped (matched by name + city)
                </p>
              )}
              <p className="text-[10px] text-zinc-600 mt-2 mb-6">
                All imported venues are marked as "Needs Review"
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => router.push("/admin/venues")}
                  className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  View Venues
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/25 bg-black/40 text-sm text-zinc-400 hover:text-foreground transition-colors"
                >
                  Import More
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
