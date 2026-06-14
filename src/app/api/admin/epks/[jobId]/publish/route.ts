import type { Prisma } from "@prisma/client";
import { get, put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getGeneratedEpkByArtistId } from "@/generated/epks/registry";
import {
  getOwnerSessionFromRequest,
  hasValidOwnerCsrf,
} from "@/lib/epk/owner-session";
import { writeEpkAudit } from "@/lib/epk/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function safePathSegment(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 160) || "asset"
  );
}

function metadataRecord(value: Prisma.JsonValue): Record<string, Prisma.JsonValue> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Prisma.JsonValue>)
    : {};
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const session = getOwnerSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "Secure owner session required." }, { status: 401 });
  }
  if (!hasValidOwnerCsrf(request, session)) {
    return Response.json({ error: "Invalid CSRF token." }, { status: 403 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }

  const privateToken = process.env.EPK_BLOB_READ_WRITE_TOKEN?.trim();
  const publicToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!privateToken || !publicToken) {
    return Response.json(
      { error: "Both private and public Blob stores must be configured." },
      { status: 503 },
    );
  }

  const { jobId } = await context.params;
  const job = await prisma.ePKGenerationJob.findUnique({
    where: { id: jobId },
    include: {
      assets: { orderBy: { createdAt: "asc" } },
      epk: { include: { artist: { select: { id: true, name: true } } } },
    },
  });
  if (!job) {
    return Response.json({ error: "EPK job not found." }, { status: 404 });
  }
  if (job.status !== "GenerationRequested") {
    return Response.json(
      { error: `EPK job cannot publish while ${job.status}.` },
      { status: 409 },
    );
  }

  const registration = getGeneratedEpkByArtistId(job.epk.artist.id);
  if (!registration) {
    return Response.json(
      { error: "No reviewed generated EPK is registered for this artist." },
      { status: 409 },
    );
  }
  if (job.assets.length === 0) {
    return Response.json({ error: "The EPK has no assets to publish." }, { status: 409 });
  }

  const publishedAssets: Array<{ id: string; url: string }> = [];
  for (const asset of job.assets) {
    if (asset.scanStatus === "Rejected" || !asset.rightsConfirmedAt) {
      return Response.json(
        { error: `Asset ${asset.id} is not eligible for publication.` },
        { status: 409 },
      );
    }

    const existingMetadata = metadataRecord(asset.metadata);
    const existingPublicUrl = existingMetadata.publicUrl;
    if (asset.isPublished && typeof existingPublicUrl === "string") {
      publishedAssets.push({ id: asset.id, url: existingPublicUrl });
      continue;
    }

    const source = await get(asset.blobUrl, {
      access: "private",
      token: privateToken,
      useCache: false,
    });
    if (
      !source ||
      source.statusCode !== 200 ||
      source.blob.size !== asset.sizeBytes ||
      source.blob.contentType.toLowerCase() !== asset.mimeType.toLowerCase()
    ) {
      return Response.json(
        { error: `Asset ${asset.id} failed publication verification.` },
        { status: 409 },
      );
    }

    const pathname = [
      "epks",
      registration.manifest.artistSlug,
      `${asset.id}-${safePathSegment(asset.filename)}`,
    ].join("/");
    const publicBlob = await put(pathname, source.stream, {
      access: "public",
      token: publicToken,
      contentType: asset.mimeType,
      addRandomSuffix: false,
      allowOverwrite: true,
      multipart: asset.sizeBytes >= 5 * 1024 * 1024,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });

    await prisma.ePKAsset.update({
      where: { id: asset.id },
      data: {
        scanStatus: "Clean",
        isPublished: true,
        metadata: {
          ...existingMetadata,
          publicUrl: publicBlob.url,
          publicBlobPath: publicBlob.pathname,
          publicationReview: "owner-approved-generated-epk",
          publishedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
    publishedAssets.push({ id: asset.id, url: publicBlob.url });
  }

  const publishUrl = `/roster/${registration.manifest.routeSlug}`;
  await prisma.ePK.update({
    where: { id: job.epkId },
    data: { status: "Published", publishUrl },
  });
  await writeEpkAudit({
    action: "publish",
    entityType: "epk",
    entityId: job.epkId,
    userEmail: session.email,
    details: {
      jobId,
      artistId: job.epk.artist.id,
      routeSlug: registration.manifest.routeSlug,
      publishedAssetIds: publishedAssets.map((asset) => asset.id),
    },
  });

  return Response.json({
    ok: true,
    publishUrl,
    publishedAssets,
  });
}
