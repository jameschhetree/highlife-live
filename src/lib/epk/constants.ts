export const EPK_MODEL = "gpt-5.5";

export const EPK_ELIGIBLE_ARTIST_STATUSES = ["Active", "Priority"] as const;

export const EPK_ACTIVE_JOB_STATUSES = [
  "Submitted",
  "AwaitingAnswers",
  "PromptReady",
] as const;

export const EPK_ASSET_LIMITS = {
  image: { count: 10, maxBytes: 20 * 1024 * 1024 },
  audio: { count: 5, maxBytes: 100 * 1024 * 1024 },
  video: { count: 3, maxBytes: 250 * 1024 * 1024 },
  pdf: { count: 2, maxBytes: 25 * 1024 * 1024 },
} as const;

export type EpkAssetKind = keyof typeof EPK_ASSET_LIMITS;

export const EPK_ALLOWED_MIME_TYPES: Record<EpkAssetKind, readonly string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  audio: [
    "audio/mpeg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/x-flac",
    "audio/ogg",
  ],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  pdf: ["application/pdf"],
};

export function slugifyEpkValue(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function sanitizeEpkFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const extension = dot >= 0 ? filename.slice(dot).toLowerCase() : "";
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const safeBase = slugifyEpkValue(base) || "asset";
  const safeExtension = extension.replace(/[^a-z0-9.]/g, "").slice(0, 12);
  return `${safeBase}${safeExtension}`.slice(0, 120);
}

export function buildEpkWorkspaceFilename(input: {
  assetId: string;
  filename: string;
}): string {
  return `${input.assetId}-${sanitizeEpkFilename(input.filename)}`;
}

export function buildEpkAssetPath(input: {
  jobId: string;
  kind: EpkAssetKind;
  sha256: string;
  filename: string;
}): string {
  return [
    "epk-quarantine",
    input.jobId,
    input.kind,
    `${input.sha256.slice(0, 16)}-${sanitizeEpkFilename(input.filename)}`,
  ].join("/");
}
