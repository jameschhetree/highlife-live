import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";

const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const ALLOWED_CONTENT_PREFIXES = ["audio/", "video/"] as const;

// Some browsers (Safari especially) return empty or non-standard MIME for .wav/.m4a/.aif/.flac.
// Fall back to extension when the content type is missing or unrecognized.
const ALLOWED_AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "wave", "m4a", "aac", "ogg", "oga", "opus",
  "flac", "aif", "aiff", "wma", "ape", "alac",
]);
const ALLOWED_VIDEO_EXTENSIONS = new Set([
  "mp4", "m4v", "mov", "qt", "webm", "ogv", "avi", "wmv",
  "mkv", "flv", "3gp", "3g2", "mpg", "mpeg", "mts", "m2ts",
]);

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function isAllowedMedia(contentType: string, filename: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct && ALLOWED_CONTENT_PREFIXES.some((prefix) => ct.startsWith(prefix))) {
    return true;
  }
  const ext = extensionOf(filename);
  if (ALLOWED_AUDIO_EXTENSIONS.has(ext) || ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    return true;
  }
  return false;
}

function effectiveContentType(contentType: string, filename: string): string {
  if (contentType && contentType !== "application/octet-stream") return contentType;
  const ext = extensionOf(filename);
  if (ALLOWED_AUDIO_EXTENSIONS.has(ext)) return `audio/${ext === "m4a" ? "mp4" : ext}`;
  if (ALLOWED_VIDEO_EXTENSIONS.has(ext)) return `video/${ext === "mov" ? "quicktime" : ext}`;
  return contentType || "application/octet-stream";
}

function parseClientPayload(payload: string | null | undefined): {
  contentType: string;
  size: number;
  filename: string;
} {
  if (!payload) {
    return { contentType: "", size: 0, filename: "upload.bin" };
  }

  try {
    const parsed = JSON.parse(payload) as {
      contentType?: string;
      size?: number;
      filename?: string;
    };
    return {
      contentType: String(parsed.contentType || ""),
      size: Number(parsed.size || 0),
      filename: String(parsed.filename || "upload.bin"),
    };
  } catch {
    return { contentType: "", size: 0, filename: "upload.bin" };
  }
}

function sanitizeFilename(filename: string): string {
  const cleaned = filename
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return cleaned || "upload.bin";
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        if (!isAllowedMedia(payload.contentType, payload.filename)) {
          throw new Error("Only audio and video files are allowed.");
        }
        if (!Number.isFinite(payload.size) || payload.size <= 0) {
          throw new Error("Missing or invalid file size.");
        }
        if (payload.size > MAX_FILE_SIZE_BYTES) {
          throw new Error("Each file must be 300MB or smaller.");
        }

        const resolvedType = effectiveContentType(payload.contentType, payload.filename);

        return {
          pathname: `findanagent/${Date.now()}-${sanitizeFilename(payload.filename)}`,
          allowedContentTypes: [resolvedType],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          tokenPayload: JSON.stringify({
            source: "findanagent",
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async () => {
        // No-op for now. Metadata is persisted during /api/findanagent submit.
      },
    });

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate upload token.";
    return Response.json({ error: message }, { status: 400 });
  }
}
