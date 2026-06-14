import { get } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { buildEpkWorkspaceFilename } from "@/lib/epk/constants";
import { getOwnerSessionFromRequest } from "@/lib/epk/owner-session";
import { verifySignedAssetDownload } from "@/lib/epk/signed-asset-links";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string; assetId: string }> },
) {
  const { jobId, assetId } = await context.params;
  const url = new URL(request.url);
  const signedAccess = verifySignedAssetDownload({
    jobId,
    assetId,
    expires: url.searchParams.get("expires"),
    suppliedSignature: url.searchParams.get("signature"),
  });
  if (!signedAccess && !getOwnerSessionFromRequest(request)) {
    return Response.json({ error: "Secure owner session required." }, { status: 401 });
  }
  if (!prisma) {
    return Response.json({ error: "Database not connected." }, { status: 503 });
  }
  const token = process.env.EPK_BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return Response.json(
      { error: "Private EPK storage is not configured." },
      { status: 503 },
    );
  }

  const asset = await prisma.ePKAsset.findFirst({
    where: {
      id: assetId,
      jobId,
      scanStatus: { not: "Rejected" },
    },
  });
  if (!asset) {
    return Response.json({ error: "EPK asset not found." }, { status: 404 });
  }

  const result = await get(asset.blobUrl, {
    access: "private",
    token,
    useCache: false,
  });
  if (!result || result.statusCode !== 200) {
    return Response.json({ error: "EPK asset is unavailable." }, { status: 404 });
  }

  const workspaceFilename = buildEpkWorkspaceFilename({
    assetId: asset.id,
    filename: asset.filename,
  });
  const asciiFilename =
    workspaceFilename.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "_") ||
    "epk-asset";
  return new Response(result.stream, {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(result.blob.size),
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(workspaceFilename)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
