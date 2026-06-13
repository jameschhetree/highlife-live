// DELETE /api/admin/artists/[id]/assets/[assetId] -- delete an asset + blob

import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import {
  canManageArtistsEmail,
  getAdminEmailFromRequest,
} from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { assetId } = await params;
  const asset = await prisma.artistAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Clean up the blob from Vercel Blob storage
  try {
    await del(asset.blobUrl);
  } catch {
    // Blob may already be gone -- continue with DB cleanup
  }

  await prisma.artistAsset.delete({ where: { id: assetId } });
  return Response.json({ ok: true });
}
