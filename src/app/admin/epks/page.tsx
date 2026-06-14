"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileAudio,
  FileImage,
  FileText,
  Film,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  buildEpkAssetPath,
  EPK_ASSET_LIMITS,
  type EpkAssetKind,
} from "@/lib/epk/constants";

type ArtistOption = {
  id: string;
  name: string;
  status: string;
  primaryGenre: string;
  image: string;
};

type FollowupQuestion = {
  id: string;
  prompt: string;
  reason: string;
};

type AssetSummary = {
  id: string;
  kind: EpkAssetKind;
  filename: string;
  sizeBytes: number;
  scanStatus: string;
};

type JobSummary = {
  id: string;
  status: string;
  input: unknown;
  questions: unknown;
  answers: unknown;
  failureMessage?: string | null;
  createdAt: string;
  assets: AssetSummary[];
};

type EpkSummary = {
  id: string;
  status: string;
  generatedUrl?: string | null;
  updatedAt: string;
  artist: ArtistOption;
  jobs: JobSummary[];
};

type EpkData = {
  csrfToken: string;
  artists: ArtistOption[];
  epks: EpkSummary[];
  activeJob?: {
    id: string;
    status: string;
    createdByEmail: string;
  } | null;
  configuration: {
    checks: Record<string, boolean>;
    readyForGeneration: boolean;
  };
};

type FormState = {
  artistName: string;
  genres: string;
  links: string;
  themeVibe: string;
  features: string;
  rightsConfirmed: boolean;
};

const EMPTY_FORM: FormState = {
  artistName: "",
  genres: "",
  links: "",
  themeVibe: "",
  features: "",
  rightsConfirmed: false,
};

const STATUS_STYLES: Record<string, string> = {
  Draft: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
  AwaitingAnswers: "text-amber-200 border-amber-400/30 bg-amber-400/10",
  PromptReady: "text-orange-200 border-orange-400/30 bg-orange-400/10",
  GenerationRequested: "text-pink-200 border-pink-400/30 bg-pink-400/10",
  Published: "text-emerald-200 border-emerald-400/30 bg-emerald-400/10",
  Cancelled: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
  Failed: "text-rose-200 border-rose-400/30 bg-rose-400/10",
};

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function inferKind(file: File): EpkAssetKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  return null;
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseQuestions(value: unknown): FollowupQuestion[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is FollowupQuestion =>
          Boolean(
            item &&
              typeof item === "object" &&
              "id" in item &&
              "prompt" in item &&
              "reason" in item,
          ),
      )
    : [];
}

function parseAnswers(value: unknown): Record<string, string> {
  if (!Array.isArray(value)) return {};
  return Object.fromEntries(
    value
      .filter(
        (item): item is { questionId: string; answer: string } =>
          Boolean(
            item &&
              typeof item === "object" &&
              "questionId" in item &&
              "answer" in item &&
              typeof item.questionId === "string" &&
              typeof item.answer === "string",
          ),
      )
      .map((item) => [item.questionId, item.answer]),
  );
}

function parseManualPrompt(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const workOrder = (value as Record<string, unknown>).manualWorkOrder;
  if (!workOrder || typeof workOrder !== "object" || Array.isArray(workOrder)) {
    return "";
  }
  const prompt = (workOrder as Record<string, unknown>).prompt;
  return typeof prompt === "string" ? prompt : "";
}

export default function EpksPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<EpkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [formError, setFormError] = useState("");
  const [currentJobId, setCurrentJobId] = useState("");
  const [questions, setQuestions] = useState<FollowupQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generationRequested, setGenerationRequested] = useState<{
    prompt: string;
    emailedTo: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/epks", {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setAccessError(
          payload?.error ??
            "Secure owner access is required. Sign out and sign back in.",
        );
        setData(null);
        return;
      }
      setData(payload as EpkData);
      setAccessError("");
    } catch {
      setAccessError("Could not load the EPK generator.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  useEffect(() => {
    const artistParam = searchParams.get("artist");
    if (!artistParam || !data?.artists) return;
    const match = data.artists.find((a) => a.id === artistParam);
    if (match) {
      setForm((f) => ({ ...f, artistName: match.name }));
      setFormOpen(true);
    }
  }, [data?.artists, searchParams]);

  const selectedArtist = useMemo(
    () =>
      data?.artists.find(
        (artist) => artist.name.toLowerCase() === form.artistName.toLowerCase(),
      ),
    [data?.artists, form.artistName],
  );

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setFiles([]);
    setCurrentJobId("");
    setQuestions([]);
    setAnswers({});
    setGenerationRequested(null);
    setProgress("");
    setFormError("");
  }

  function validateFiles(selected: File[]): string | null {
    const counts: Record<EpkAssetKind, number> = {
      image: 0,
      audio: 0,
      video: 0,
      pdf: 0,
    };
    for (const file of selected) {
      const kind = inferKind(file);
      if (!kind) return `${file.name} is not a supported image, audio, video, or PDF.`;
      counts[kind] += 1;
      if (counts[kind] > EPK_ASSET_LIMITS[kind].count) {
        return `Maximum ${EPK_ASSET_LIMITS[kind].count} ${kind} files allowed.`;
      }
      if (file.size > EPK_ASSET_LIMITS[kind].maxBytes) {
        return `${file.name} exceeds the ${formatBytes(EPK_ASSET_LIMITS[kind].maxBytes)} ${kind} limit.`;
      }
    }
    return null;
  }

  async function uploadAssets(jobId: string, csrfToken: string) {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const kind = inferKind(file);
      if (!kind) throw new Error(`Unsupported file: ${file.name}`);
      setProgress(`Preparing ${index + 1} of ${files.length}: ${file.name}`);
      const checksum = await sha256(file);
      const pathname = buildEpkAssetPath({
        jobId,
        kind,
        sha256: checksum,
        filename: file.name,
      });
      setProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      await upload(pathname, file, {
        access: "private",
        handleUploadUrl: `/api/admin/epks/${jobId}/upload`,
        multipart: file.size > 5 * 1024 * 1024,
        headers: { "x-epk-csrf": csrfToken },
        clientPayload: JSON.stringify({
          jobId,
          kind,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          sha256: checksum,
          rightsConfirmed: form.rightsConfirmed,
        }),
      });
    }
  }

  async function waitForUploadedAssets(jobId: string, expectedCount: number) {
    if (expectedCount === 0) return;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch("/api/admin/epks", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.ok) {
        const payload = (await response.json()) as EpkData;
        const uploadedCount =
          payload.epks
            .flatMap((epk) => epk.jobs)
            .find((job) => job.id === jobId)?.assets.length ?? 0;
        if (uploadedCount >= expectedCount) return;
      }
      setProgress("Securing uploaded media...");
      await new Promise((resolve) => window.setTimeout(resolve, 750));
    }
    throw new Error(
      "Media is still processing. Wait a moment, refresh, and continue the saved job.",
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!data || submitting) return;
    if (!selectedArtist) {
      setFormError("Choose an eligible artist from the dropdown.");
      return;
    }
    if (!form.rightsConfirmed) {
      setFormError("Confirm that HighLife may use every uploaded file publicly.");
      return;
    }
    const fileError = validateFiles(files);
    if (fileError) {
      setFormError(fileError);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setProgress("Creating secure EPK job...");
    try {
      const response = await fetch("/api/admin/epks", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-epk-csrf": data.csrfToken,
        },
        body: JSON.stringify({
          artistId: selectedArtist.id,
          genres: form.genres,
          links: form.links,
          themeVibe: form.themeVibe,
          features: form.features,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not create EPK job.");

      const jobId = String(payload.job.id);
      setCurrentJobId(jobId);
      setQuestions(payload.questions ?? []);
      setAnswers({});
      setGenerationRequested(null);

      if (files.length > 0) {
        await uploadAssets(jobId, data.csrfToken);
        await waitForUploadedAssets(jobId, files.length);
      }

      setProgress("Brief received. Answer the scoping questions below.");
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "EPK submission failed.");
      setProgress("");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAnswers(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !currentJobId || submitting) return;
    setSubmitting(true);
    setFormError("");
    setProgress("Creating a photo-informed Codex design prompt...");
    try {
      const response = await fetch(
        `/api/admin/epks/${currentJobId}/answers`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-epk-csrf": data.csrfToken,
          },
          body: JSON.stringify({
            answers: questions.map((question) => ({
              questionId: question.id,
              answer: answers[question.id] ?? "",
            })),
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Could not save answers.");
      setGenerationRequested({
        prompt: String(payload.designPrompt ?? ""),
        emailedTo: String(payload.emailedTo ?? "epk@highlifelive.com"),
      });
      setProgress("");
      await load();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save answers.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelJob(jobId: string) {
    if (!data || submitting) return;
    if (!window.confirm("Cancel this EPK request and delete its private uploads?")) {
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch(`/api/admin/epks/${jobId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-epk-csrf": data.csrfToken },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not cancel the EPK request.");
      }
      if (currentJobId === jobId) {
        resetForm();
        setFormOpen(false);
      }
      await load();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not cancel the EPK request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-300" size={22} />
      </div>
    );
  }

  if (accessError || !data) {
    return (
      <div className="min-h-screen px-5 py-16 flex items-center justify-center">
        <div className="glass-card max-w-xl rounded-3xl p-8 text-center">
          <ShieldCheck className="mx-auto mb-5 text-amber-300" size={28} />
          <h1 className="font-display uppercase text-3xl mb-3">Secure Owner Session Required</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">{accessError}</p>
          <Link href="/admin/login" className="btn-gradient rounded-full px-6 py-3 text-xs uppercase tracking-[0.18em] font-bold">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const missingChecks = Object.entries(data.configuration.checks)
    .filter(([, ready]) => !ready)
    .map(([name]) => name);

  return (
    <div className="min-h-screen text-foreground">
      <div className="border-b border-white/8 px-4 sm:px-6 lg:px-10 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 mb-1">
          HighLife Live · Owner Only
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display uppercase text-3xl tracking-tight">EPK Generator</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Secure briefs, private source assets, review before publish.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
              aria-label="Refresh EPK data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              disabled={Boolean(data.activeJob) && !currentJobId}
              onClick={() => {
                if (formOpen) {
                  setFormOpen(false);
                  return;
                }
                resetForm();
                setFormOpen(true);
              }}
              className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
            >
              {formOpen ? <X size={15} /> : <Plus size={15} />}
              {formOpen ? "Close Form" : "New EPK"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-7 space-y-7">
        <section className={`rounded-2xl border p-4 ${data.configuration.readyForGeneration ? "border-emerald-400/25 bg-emerald-400/5" : "border-amber-400/25 bg-amber-400/5"}`}>
          <div className="flex items-start gap-3">
            {data.configuration.readyForGeneration ? (
              <CheckCircle2 className="text-emerald-300 mt-0.5" size={17} />
            ) : (
              <AlertTriangle className="text-amber-300 mt-0.5" size={17} />
            )}
            <div>
              <p className="text-sm font-medium">
                {data.configuration.readyForGeneration
                  ? "Prompt generation, signed media links, and email delivery are ready."
                  : "EPK intake is locked until its server configuration is complete."}
              </p>
              {missingChecks.length > 0 && (
                <p className="text-xs text-zinc-400 mt-1">
                  Missing configuration: {missingChecks.join(", ")}
                </p>
              )}
            </div>
          </div>
        </section>

        {data.activeJob && !currentJobId && (
          <section className="rounded-2xl border border-violet-400/25 bg-violet-400/5 p-4">
            <p className="text-sm text-violet-100">
              Active job <span className="font-mono text-xs">{data.activeJob.id}</span> is currently {data.activeJob.status}.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              HighLife permits one active generation job at a time.
            </p>
          </section>
        )}

        {formOpen && (
          <section className="glass-card rounded-3xl p-5 sm:p-8">
            {generationRequested ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5">
                  <CheckCircle2 className="mb-4 text-emerald-300" size={24} />
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                    Request Complete
                  </p>
                  <h2 className="mt-1 font-display text-3xl uppercase">
                    EPK generation requested
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    The Codex work order and signed media download links were
                    emailed from <strong className="text-zinc-200">admin@highlifelive.com</strong>{" "}
                    to <strong className="text-zinc-200">{generationRequested.emailedTo}</strong>.
                    No files were attached.
                  </p>
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl uppercase">Codex Prompt</h3>
                      <p className="text-xs text-zinc-500">
                        Paste this into the restricted EPK Workspace thread.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void navigator.clipboard.writeText(generationRequested.prompt)
                      }
                      className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-zinc-300 hover:border-white/25"
                    >
                      Copy Prompt
                    </button>
                  </div>
                  <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/8 bg-black/35 p-5 text-xs leading-relaxed text-zinc-300">
                    {generationRequested.prompt}
                  </pre>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                  className="btn-gradient rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.18em]"
                >
                  Done
                </button>
              </div>
            ) : questions.length === 0 ? (
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <h2 className="font-display uppercase text-2xl">Artist Direction</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Form values and files are treated as untrusted source material, never agent instructions.
                  </p>
                </div>

                <Field label="Artist Name" required>
                  <input
                    list="eligible-epk-artists"
                    value={form.artistName}
                    onChange={(event) => updateForm("artistName", event.target.value)}
                    placeholder="Search active and priority artists..."
                    className="epk-input"
                  />
                  <datalist id="eligible-epk-artists">
                    {data.artists.map((artist) => (
                      <option key={artist.id} value={artist.name}>
                        {artist.status} · {artist.primaryGenre}
                      </option>
                    ))}
                  </datalist>
                </Field>

                <Field label="Artist Genre(s) or Act" required hint="Separate multiple genres with commas. Custom genres are welcome.">
                  <input
                    value={form.genres}
                    onChange={(event) => updateForm("genres", event.target.value)}
                    placeholder="Alternative R&B, cinematic soul, live vocalist"
                    className="epk-input"
                  />
                </Field>

                <Field label="Artist Links" hint='One per line: -https://link.com/link (What it is, e.g. Apple Music, YouTube, Instagram)'>
                  <textarea
                    value={form.links}
                    onChange={(event) => updateForm("links", event.target.value)}
                    rows={5}
                    placeholder={"-https://instagram.com/artist (Instagram)\n-https://music.apple.com/... (Apple Music)"}
                    className="epk-input resize-y"
                  />
                </Field>

                <Field label="Artist Theme & Vibe" required hint="Describe visual language, emotional tone, audience, message, references, and what must be avoided.">
                  <textarea
                    value={form.themeVibe}
                    onChange={(event) => updateForm("themeVibe", event.target.value)}
                    rows={8}
                    className="epk-input resize-y"
                  />
                </Field>

                <Field label="Important Features / Visuals" hint="One idea per line.">
                  <textarea
                    value={form.features}
                    onChange={(event) => updateForm("features", event.target.value)}
                    rows={4}
                    placeholder={"Audio-reactive hero\nAnimated tour timeline\nHigh-contrast editorial gallery"}
                    className="epk-input resize-y"
                  />
                </Field>

                <Field
                  label="Files"
                  hint="Up to 10 images, 5 audio files, 3 videos, and 2 PDFs. The design API may inspect photos only; it never receives video, audio, or PDF content."
                >
                  <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em] text-zinc-300 cursor-pointer hover:bg-white/10 transition-colors">
                    <Plus size={12} /> Add Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif,audio/*,video/mp4,video/quicktime,video/webm,application/pdf"
                      onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        const merged = [...files, ...selected];
                        const error = validateFiles(merged);
                        if (error) {
                          setFormError(error);
                          event.target.value = "";
                          return;
                        }
                        setFiles(merged);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {files.map((file, idx) => {
                        const kind = inferKind(file);
                        const Icon = kind === "image" ? FileImage : kind === "audio" ? FileAudio : kind === "video" ? Film : FileText;
                        return (
                          <div key={`${file.name}-${file.size}-${idx}`} className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
                            <Icon size={14} className="text-pink-300 shrink-0" />
                            <span className="truncate text-xs text-zinc-300">{file.name}</span>
                            <span className="shrink-0 text-[10px] text-zinc-600">{formatBytes(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                              className="shrink-0 ml-auto text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Field>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={form.rightsConfirmed}
                    onChange={(event) => updateForm("rightsConfirmed", event.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-zinc-300 leading-relaxed">
                    I confirm HighLife has permission to use every submitted file publicly if this EPK is approved and published.
                  </span>
                </label>

                {formError && <p className="text-sm text-rose-300">{formError}</p>}
                {progress && <p className="text-sm text-amber-200">{progress}</p>}

                <button
                  type="submit"
                  disabled={submitting || Boolean(data.activeJob)}
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-40"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Secure Brief
                </button>
              </form>
            ) : (
              <form onSubmit={submitAnswers} className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-pink-300">Step 2</p>
                  <h2 className="font-display uppercase text-2xl mt-1">Creative Follow-Up</h2>
                  <p className="text-sm text-zinc-500 mt-1">Answer these before generation begins.</p>
                </div>
                {questions.map((question, index) => (
                  <Field key={question.id} label={`${index + 1}. ${question.prompt}`} required hint={question.reason}>
                    <textarea
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      rows={4}
                      className="epk-input resize-y"
                    />
                  </Field>
                ))}
                {formError && <p className="text-sm text-rose-300">{formError}</p>}
                {progress && <p className="text-sm text-amber-200">{progress}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-40"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Request EPK Generation
                </button>
              </form>
            )}
          </section>
        )}

        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display uppercase text-2xl">EPK Records</h2>
              <p className="text-xs text-zinc-500 mt-1">{data.epks.length} database-backed EPK{data.epks.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          {data.epks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
              No EPK jobs yet.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {data.epks.map((epk) => {
                const latestJob = epk.jobs[0];
                return (
                  <article key={epk.id} className="glass-card rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="h-14 w-14 rounded-xl bg-zinc-900 bg-cover bg-center"
                        style={{ backgroundImage: epk.artist.image ? `url(${epk.artist.image})` : undefined }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display uppercase text-xl">{epk.artist.name}</h3>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${STATUS_STYLES[latestJob?.status ?? epk.status] ?? STATUS_STYLES.Draft}`}>
                            {latestJob?.status ?? epk.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{epk.artist.primaryGenre} · {epk.artist.status}</p>
                      </div>
                    </div>

                    {latestJob && (
                      <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
                        <div className="flex flex-wrap justify-between gap-2 text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                          <span>Job {latestJob.id.slice(0, 10)}</span>
                          <span>{new Date(latestJob.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {latestJob.assets.map((asset) => (
                            <span key={asset.id} className="rounded-full border border-white/8 px-2 py-1 text-[10px] text-zinc-400">
                              {asset.kind}: {asset.filename} · {asset.scanStatus}
                            </span>
                          ))}
                          {latestJob.assets.length === 0 && (
                            <span className="text-xs text-zinc-600">No uploaded assets.</span>
                          )}
                        </div>
                        {latestJob.failureMessage && (
                          <p className="mt-3 text-xs text-amber-200/80">{latestJob.failureMessage}</p>
                        )}
                        {latestJob.status === "AwaitingAnswers" && currentJobId !== latestJob.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentJobId(latestJob.id);
                              setQuestions(parseQuestions(latestJob.questions));
                              setAnswers(parseAnswers(latestJob.answers));
                              setGenerationRequested(null);
                              setFormOpen(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="mt-4 text-xs uppercase tracking-[0.16em] text-pink-300 hover:text-pink-200"
                          >
                            Answer follow-up questions
                          </button>
                        )}
                        {latestJob.status === "PromptReady" && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentJobId(latestJob.id);
                              setQuestions(parseQuestions(latestJob.questions));
                              setAnswers(parseAnswers(latestJob.answers));
                              setGenerationRequested(null);
                              setFormOpen(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="mt-4 text-xs uppercase tracking-[0.16em] text-orange-300 hover:text-orange-200"
                          >
                            Retry work-order email
                          </button>
                        )}
                        {["AwaitingAnswers", "PromptReady", "Submitted"].includes(
                          latestJob.status,
                        ) && (
                          <button
                            type="button"
                            onClick={() => void cancelJob(latestJob.id)}
                            disabled={submitting}
                            className="mt-4 ml-5 text-xs uppercase tracking-[0.16em] text-zinc-500 hover:text-rose-300 disabled:opacity-40"
                          >
                            Cancel request
                          </button>
                        )}
                        {latestJob.status === "GenerationRequested" &&
                          parseManualPrompt(latestJob.input) && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentJobId(latestJob.id);
                                setQuestions(parseQuestions(latestJob.questions));
                                setAnswers(parseAnswers(latestJob.answers));
                                setGenerationRequested({
                                  prompt: parseManualPrompt(latestJob.input),
                                  emailedTo: "epk@highlifelive.com",
                                });
                                setFormOpen(true);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="mt-4 text-xs uppercase tracking-[0.16em] text-pink-300 hover:text-pink-200"
                            >
                              Open Codex work order
                            </button>
                          )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {epk.generatedUrl && (
                        <Link
                          href={epk.generatedUrl}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-emerald-200"
                        >
                          <ExternalLink size={11} /> Open Generated EPK
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-zinc-300">
        {label}
        {required ? <span className="text-pink-300"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-relaxed text-zinc-600">{hint}</span> : null}
    </label>
  );
}
