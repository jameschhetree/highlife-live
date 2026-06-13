// GET /api/admin/artists/[id]/assets -- list all assets for an artist
// POST /api/admin/artists/[id]/assets -- create a new asset record

import { prisma } from "@/lib/db";
import {
  canManageArtistsEmail,
  getAdminEmailFromRequest,
} from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const assets = await prisma.artistAsset.findMany({
    where: { artistId: id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(assets);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { kind, blobUrl, filename, mimeType } = body as {
    kind: string;
    blobUrl: string;
    filename?: string;
    mimeType?: string;
  };

  if (!kind || !blobUrl) {
    return Response.json({ error: "kind and blobUrl are required" }, { status: 400 });
  }

  const asset = await prisma.artistAsset.create({
    data: {
      artistId: id,
      kind,
      blobUrl,
      filename: filename ?? "",
      mimeType: mimeType ?? "",
    },
  });
  return Response.json(asset, { status: 201 });
}
