import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";

const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const ALLOWED_CONTENT_PREFIXES = ["audio/", "video/"] as const;

function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_PREFIXES.some((prefix) => contentType.startsWith(prefix));
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
        if (!payload.contentType || !isAllowedContentType(payload.contentType)) {
          throw new Error("Only audio and video files are allowed.");
        }
        if (!Number.isFinite(payload.size) || payload.size <= 0) {
          throw new Error("Missing or invalid file size.");
        }
        if (payload.size > MAX_FILE_SIZE_BYTES) {
          throw new Error("Each file must be 300MB or smaller.");
        }

        return {
          pathname: `findanagent/${Date.now()}-${sanitizeFilename(payload.filename)}`,
          allowedContentTypes: [payload.contentType],
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
