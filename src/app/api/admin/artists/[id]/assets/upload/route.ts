// POST /api/admin/artists/[id]/assets/upload -- Vercel Blob client upload handler
// Handles the multipart handshake for @vercel/blob/client uploads.

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const BLOB_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/*",
  "audio/*",
  "video/*",
  "application/pdf",
];

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          pathname: `artist-assets/${id}/${Date.now()}`,
          allowedContentTypes: BLOB_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          tokenPayload: JSON.stringify({
            source: "artist-asset",
            artistId: id,
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async () => {
        // Metadata persisted via separate POST to /assets after upload completes
      },
    });

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate upload token.";
    return Response.json({ error: message }, { status: 400 });
  }
}
