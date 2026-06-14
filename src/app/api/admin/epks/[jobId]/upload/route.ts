import type { Prisma } from "@prisma/client";
import { del, get } from "@vercel/blob";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { prisma } from "@/lib/db";
import {
  buildEpkAssetPath,
  EPK_ALLOWED_MIME_TYPES,
  EPK_ASSET_LIMITS,
  type EpkAssetKind,
} from "@/lib/epk/constants";
import {
  getOwnerSessionFromRequest,
  hasValidOwnerCsrf,
} from "@/lib/epk/owner-session";
import { writeEpkAudit } from "@/lib/epk/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AssetPayload = {
  jobId: string;
  kind: EpkAssetKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  rightsConfirmed: boolean;
};

function parseAssetPayload(value: string | null | undefined): AssetPayload {
  const parsed = JSON.parse(value ?? "{}") as Partial<AssetPayload>;
  if (
    !parsed.jobId ||
    !parsed.kind ||
    !parsed.filename ||
    !parsed.mimeType ||
    !parsed.sha256 ||
    !parsed.rightsConfirmed
  ) {
    throw new Error("Incomplete EPK asset payload.");
  }
  if (!/^[a-f0-9]{64}$/i.test(parsed.sha256)) {
    throw new Error("Invalid asset checksum.");
  }
  if (!Number.isFinite(parsed.sizeBytes) || Number(parsed.sizeBytes) <= 0) {
    throw new Error("Invalid asset size.");
  }
  if (!(parsed.kind in EPK_ASSET_LIMITS)) throw new Error("Invalid asset kind.");
  return {
    jobId: String(parsed.jobId),
    kind: parsed.kind,
    filename: String(parsed.filename).slice(0, 240),
    mimeType: String(parsed.mimeType).toLowerCase(),
    sizeBytes: Number(parsed.sizeBytes),
    sha256: String(parsed.sha256).toLowerCase(),
    rightsConfirmed: true,
  };
}

function matchesAllowedSignature(kind: EpkAssetKind, bytes: Uint8Array): boolean {
  const text = new TextDecoder("latin1").decode(bytes);
  if (kind === "pdf") return text.startsWith("%PDF-");
  if (kind === "image") {
    return (
      (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
      text.startsWith("\x89PNG\r\n\x1a\n") ||
      text.startsWith("GIF87a") ||
      text.startsWith("GIF89a") ||
      (text.startsWith("RIFF") && text.slice(8, 12) === "WEBP")
    );
  }
  if (kind === "audio") {
    return (
      text.startsWith("ID3") ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
      (text.startsWith("RIFF") && text.slice(8, 12) === "WAVE") ||
      text.startsWith("fLaC") ||
      text.startsWith("OggS") ||
      text.slice(4, 8) === "ftyp"
    );
  }
  return (
    text.slice(4, 8) === "ftyp" ||
    text.startsWith("\x1aE\xdf\xa3")
  );
}

async function inspectBlob(
  url: string,
  token: string,
): Promise<{ prefix: Uint8Array; size: number; contentType: string }> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) await new Promise((r) => setTimeout(r, 1000 * attempt));
    const result = await get(url, {
      access: "private",
      token,
      useCache: false,
    });
    if (!result || result.statusCode !== 200) {
      if (attempt < maxAttempts) continue;
      throw new Error("Uploaded asset could not be inspected.");
    }
    const reader = result.stream.getReader();
    const { value } = await reader.read();
    await reader.cancel();
    const prefix = value?.slice(0, 32) ?? new Uint8Array();
    if (prefix.length === 0 && attempt < maxAttempts) continue;
    return {
      prefix,
      size: result.blob.size,
      contentType: result.blob.contentType.toLowerCase(),
    };
  }
  throw new Error("Uploaded asset could not be inspected.");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const db = prisma;
  if (!db) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }
  const token = process.env.EPK_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return Response.json(
      { error: "Private EPK storage is not configured." },
      { status: 503 },
    );
  }

  const { jobId } = await context.params;
  const body = (await request.json()) as HandleUploadBody;

  if (body.type === "blob.generate-client-token") {
    const session = getOwnerSessionFromRequest(request);
    if (!session) {
      return Response.json({ error: "Secure owner session required." }, { status: 401 });
    }
    if (!hasValidOwnerCsrf(request, session)) {
      return Response.json({ error: "Invalid CSRF token." }, { status: 403 });
    }
  }

  try {
    const response = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseAssetPayload(clientPayload);
        if (payload.jobId !== jobId) throw new Error("Job ID mismatch.");

        const job = await db.ePKGenerationJob.findUnique({
          where: { id: jobId },
          select: { id: true, status: true, epkId: true },
        });
        if (!job || !["AwaitingAnswers", "Submitted"].includes(job.status)) {
          throw new Error("EPK job is not accepting uploads.");
        }

        const limits = EPK_ASSET_LIMITS[payload.kind];
        if (payload.sizeBytes > limits.maxBytes) {
          throw new Error(`${payload.kind} file exceeds the upload limit.`);
        }
        if (!EPK_ALLOWED_MIME_TYPES[payload.kind].includes(payload.mimeType)) {
          throw new Error(`Unsupported ${payload.kind} file type.`);
        }

        const count = await db.ePKAsset.count({
          where: { jobId, kind: payload.kind, scanStatus: { not: "Rejected" } },
        });
        if (count >= limits.count) {
          throw new Error(`Maximum ${limits.count} ${payload.kind} files allowed.`);
        }

        const expectedPath = buildEpkAssetPath(payload);
        if (pathname !== expectedPath) throw new Error("Asset pathname mismatch.");

        return {
          allowedContentTypes: [...EPK_ALLOWED_MIME_TYPES[payload.kind]],
          maximumSizeInBytes: limits.maxBytes,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify(payload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseAssetPayload(tokenPayload);
        if (payload.jobId !== jobId || blob.pathname !== buildEpkAssetPath(payload)) {
          await del(blob.url, { token }).catch(() => null);
          throw new Error("Completed asset did not match its signed payload.");
        }

        const job = await db.ePKGenerationJob.findUnique({
          where: { id: jobId },
          select: { id: true, epkId: true, status: true, createdByEmail: true },
        });
        if (!job || !["AwaitingAnswers", "Submitted"].includes(job.status)) {
          await del(blob.url, { token }).catch(() => null);
          throw new Error("EPK job no longer accepts uploads.");
        }

        const inspection = await inspectBlob(blob.url, token);
        const signatureAccepted = matchesAllowedSignature(
          payload.kind,
          inspection.prefix,
        );
        const metadataAccepted =
          inspection.size === payload.sizeBytes &&
          inspection.contentType === payload.mimeType &&
          blob.contentType.toLowerCase() === payload.mimeType;
        const quarantineAccepted = signatureAccepted && metadataAccepted;
        if (!quarantineAccepted) {
          await del(blob.url, { token }).catch(() => null);
        }

        const duplicate = await db.ePKAsset.findFirst({
          where: { jobId, sha256: payload.sha256, scanStatus: { not: "Rejected" } },
          select: { id: true },
        });
        if (duplicate) {
          await del(blob.url, { token }).catch(() => null);
          return;
        }

        const asset = await db.ePKAsset.create({
          data: {
            epkId: job.epkId,
            jobId,
            kind: payload.kind,
            blobUrl: blob.url,
            blobPath: blob.pathname,
            filename: payload.filename,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes,
            sha256: payload.sha256,
            scanStatus: quarantineAccepted ? "Pending" : "Rejected",
            metadata: {
              checksumSource: "browser-subtle-crypto",
              storageReportedSize: inspection.size,
              storageReportedContentType: inspection.contentType,
              rightsConfirmed: true,
            } as Prisma.InputJsonValue,
            analysis: {
              signaturePolicy: "epk-magic-bytes-v1",
              signatureAccepted,
              metadataAccepted,
              malwareScan: quarantineAccepted ? "pending" : "not-run",
            } as Prisma.InputJsonValue,
            rightsConfirmedAt: new Date(),
          },
        });

        await writeEpkAudit({
          action: quarantineAccepted ? "quarantine_upload" : "reject_upload",
          entityType: "epk_asset",
          entityId: asset.id,
          userEmail: job.createdByEmail,
          details: {
            jobId,
            kind: payload.kind,
            filename: payload.filename,
            sizeBytes: payload.sizeBytes,
          },
        });
      },
    });

    return Response.json(response);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "EPK upload failed." },
      { status: 400 },
    );
  }
}
