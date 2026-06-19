"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { upload } from "@vercel/blob/client";
import { ArrowRight, CheckCircle, Send, Upload } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

// Sorted: vocal acts → instrumental → bands → performance art → variety → other.
// "Sound Engineer" removed; "Theatre Act, Musical" and "Theatre Act (Non Musical)" added.
const CLASSIFICATIONS = [
  "Vocalist",
  "Vocalist/Rapper",
  "Vocalist/Singer",
  "DJ",
  "Instrumental Musician",
  "Classical Musician",
  "Band",
  "Theatre Act, Musical",
  "Theatre Act (Non Musical)",
  "Comedian",
  "Magician",
  "Skills/Circus Act",
  "Other (please specify)",
] as const;

const MAX_FILE_COUNT = 3;
const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;

type UploadedAsset = {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
  filename: string;
};

type FormState = {
  classification: string;
  classificationOther: string;
  fullName: string;
  actStageName: string;
  phone: string;
  email: string;
  actDescription: string;
  performanceLinks: string;
  instagram: string;
  facebook: string;
};

const EMPTY_FORM: FormState = {
  classification: "",
  classificationOther: "",
  fullName: "",
  actStageName: "",
  phone: "",
  email: "",
  actDescription: "",
  performanceLinks: "",
  instagram: "",
  facebook: "",
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSupportedMediaType(contentType: string): boolean {
  return contentType.startsWith("audio/") || contentType.startsWith("video/");
}

export default function FindAnAgentPageClient() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const socialProofPresent = useMemo(() => {
    return (
      form.performanceLinks.trim() !== "" ||
      form.instagram.trim() !== "" ||
      form.facebook.trim() !== ""
    );
  }, [form.performanceLinks, form.instagram, form.facebook]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const onFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const nextFiles = Array.from(selectedFiles);
    setFiles(nextFiles);
    setSubmitError("");
    if (errors.uploads) {
      setErrors((prev) => ({ ...prev, uploads: "" }));
    }
  };

  const validate = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};

    if (!form.classification.trim()) {
      nextErrors.classification = "Classification is required";
    }
    if (
      form.classification === "Other (please specify)" &&
      !form.classificationOther.trim()
    ) {
      nextErrors.classificationOther = "Please specify your classification";
    }
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (!form.actStageName.trim()) nextErrors.actStageName = "Act/stage name is required";
    if (!form.phone.trim()) nextErrors.phone = "Phone is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!validateEmail(form.email.trim())) nextErrors.email = "Invalid email";

    if (files.length > MAX_FILE_COUNT) {
      nextErrors.uploads = `Maximum ${MAX_FILE_COUNT} uploads allowed`;
    }

    for (const file of files) {
      if (!file.type || !isSupportedMediaType(file.type)) {
        nextErrors.uploads = "Only audio and video files are allowed";
        break;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.uploads = "Each file must be 300MB or smaller";
        break;
      }
    }

    // Owner rule: require at least one social/performance link or one upload.
    if (!socialProofPresent && files.length === 0) {
      nextErrors.uploads =
        "Add at least one performance/social link or upload at least one file.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const uploadedAssets: UploadedAsset[] = [];

      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/findanagent/upload",
          multipart: file.size > 5 * 1024 * 1024,
          clientPayload: JSON.stringify({
            contentType: file.type,
            size: file.size,
            filename: file.name,
          }),
        });

        uploadedAssets.push({
          url: blob.url,
          pathname: blob.pathname,
          size: file.size,
          contentType: file.type,
          filename: file.name,
        });
      }

      const response = await fetch("/api/findanagent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classification: form.classification,
          classificationOther: form.classificationOther,
          fullName: form.fullName,
          actStageName: form.actStageName,
          phone: form.phone,
          email: form.email,
          actDescription: form.actDescription,
          performanceLinks: form.performanceLinks,
          instagram: form.instagram,
          facebook: form.facebook,
          uploads: uploadedAssets,
        }),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(json?.error || "Submission failed");
      }

      const json = (await response.json()) as { id: string };
      setSubmittedId(json.id);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not submit application"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-radial-atmosphere">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="glass-card rounded-3xl p-10 sm:p-14"
          >
            <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 border border-emerald-400/30 flex items-center justify-center">
              <CheckCircle size={26} strokeWidth={1.5} className="text-emerald-300" />
            </div>
            <h1 className="font-display uppercase text-4xl sm:text-5xl tracking-tight leading-[0.95] mb-6">
              Application <span className="text-gradient-hero">received.</span>
            </h1>
            <p className="text-silver leading-relaxed mb-8">
              We received your audition and saved it successfully.
              A confirmation email is on the way.
            </p>
            <p className="text-[11px] tracking-[0.18em] uppercase text-zinc-500 mb-10">
              Reference ID: {submittedId}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/roster"
                className="inline-flex items-center gap-2 px-7 py-3 border border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/55 rounded-full text-xs tracking-[0.18em] uppercase font-semibold transition-colors"
              >
                Browse the Roster
              </Link>
              <Link
                href="/"
                className="text-xs tracking-[0.18em] uppercase text-silver hover:text-foreground transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 bg-radial-atmosphere">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <span className="chip mb-5 inline-flex">Auditions</span>
            <h1 className="font-display uppercase text-5xl sm:text-6xl tracking-tight leading-[0.92] mb-5">
              <span className="text-gradient-hero">Auditions.</span>
            </h1>
            <p className="text-silver max-w-xl mx-auto leading-relaxed">
              Submit your profile for review by the HighLife Live booking team.
              For external artists seeking representation or a slot on the roster.
            </p>
          </div>
        </ScrollReveal>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-3xl p-6 sm:p-9 lg:p-11 space-y-7"
          noValidate
        >
          <Field label="Classification" required error={errors.classification} id="field-classification">
            <select
              value={form.classification}
              onChange={(e) => setField("classification", e.target.value)}
              required
              className={`w-full bg-black/40 border ${
                errors.classification ? "border-rose-500/60" : "border-white/10"
              } rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-pink-400/60 transition-colors appearance-none`}
            >
              <option value="">Select one...</option>
              {CLASSIFICATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          {form.classification === "Other (please specify)" && (
            <Field
              label="Specify Classification"
              required
              error={errors.classificationOther}
              id="field-classificationOther"
            >
              <input
                type="text"
                value={form.classificationOther}
                onChange={(e) => setField("classificationOther", e.target.value)}
                placeholder="Tell us your classification"
                className={`w-full bg-black/40 border ${
                  errors.classificationOther ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" required error={errors.fullName} id="field-fullName">
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="Your full name"
                className={`w-full bg-black/40 border ${
                  errors.fullName ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>

            <Field label="Act/Stage Name" required error={errors.actStageName} id="field-actStageName">
              <input
                type="text"
                value={form.actStageName}
                onChange={(e) => setField("actStageName", e.target.value)}
                placeholder="Name you perform under"
                className={`w-full bg-black/40 border ${
                  errors.actStageName ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Phone" required error={errors.phone} id="field-phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+1 (202) 555-0100"
                className={`w-full bg-black/40 border ${
                  errors.phone ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>

            <Field label="Email" required error={errors.email} id="field-email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-black/40 border ${
                  errors.email ? "border-rose-500/60" : "border-white/10"
                } rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors`}
              />
            </Field>
          </div>

          <Field
            label="Performance Description"
            id="field-actDescription"
            hint="Optional: describe your act — vibe, set length, what makes it land for a HighLife venue."
          >
            <textarea
              value={form.actDescription}
              onChange={(e) => setField("actDescription", e.target.value)}
              placeholder={`Make sure to include any important notes, but also get creative! We use this to draft a bio for you, if you get stuck here, try one, two, or three+ of these prompts.\n1. If you saw a news article about your performance, what would you want the title to be?\n2. If you saw a news article about your art, what are five sentences you'd want to see?\n3. 3 Words to describe you, 3 words to describe your act, 1 message to the world.\n4. If you retired today, what would you want people to say about your career?\n5. What impact do you want to have on the world/country/community?\n6. To be me you have to be...\n7. When I create my art I usually...\n8. What do most people get wrong about you?\n9. Tell a story.`}
              rows={8}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors resize-y"
            />
          </Field>

          <Field
            label="Performance Links"
            id="field-performanceLinks"
            hint="Optional: website, press, video links, or EPK links."
          >
            <textarea
              value={form.performanceLinks}
              onChange={(e) => setField("performanceLinks", e.target.value)}
              placeholder="https://..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors resize-y"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Instagram" id="field-instagram">
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setField("instagram", e.target.value)}
                placeholder="@yourhandle"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors"
              />
            </Field>
            <Field label="Facebook" id="field-facebook">
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => setField("facebook", e.target.value)}
                placeholder="facebook.com/..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-pink-400/60 transition-colors"
              />
            </Field>
          </div>

          <Field
            label="Uploads (audio/video only)"
            id="field-uploads"
            error={errors.uploads}
            hint="Optional unless you did not include any socials/links. Max 3 files, 300MB each."
          >
            <label className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-zinc-300 cursor-pointer hover:border-pink-400/40 transition-colors">
              <span className="inline-flex items-center gap-2">
                <Upload size={14} />
                Select media files
              </span>
              <span className="text-xs text-zinc-500">Audio/Video</span>
              <input
                type="file"
                accept="audio/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e.target.files)}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
                {files.map((file) => (
                  <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)}MB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          {submitError && (
            <p className="text-[11px] tracking-wide text-rose-400">{submitError}</p>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] tracking-[0.18em] uppercase text-zinc-500">
              Public submission · external artist request
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 btn-gradient text-xs tracking-[0.18em] uppercase font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} strokeWidth={2} />
              {submitting ? "Submitting..." : "Submit Application"}
              {!submitting && (
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id}>
      <div className="flex items-baseline justify-between mb-2">
        <label className="block text-[11px] tracking-[0.2em] uppercase text-silver font-medium">
          {label}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
        {hint && <span className="text-[10px] text-zinc-500 hidden sm:block">{hint}</span>}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[10px] text-zinc-500 sm:hidden">{hint}</p>}
      {error && <p className="mt-1.5 text-[11px] tracking-wide text-rose-400">{error}</p>}
    </div>
  );
}
