// GET /api/admin/artists/[id]/links -- list all links for an artist
// POST /api/admin/artists/[id]/links -- create a new link

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
  const links = await prisma.artistLink.findMany({
    where: { artistId: id },
    orderBy: { sortOrder: "asc" },
  });
  return Response.json(links);
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
  const { title, url } = body as { title: string; url: string };

  if (!title || !url) {
    return Response.json({ error: "title and url are required" }, { status: 400 });
  }

  // Auto-set sortOrder to end of list
  const maxOrder = await prisma.artistLink.aggregate({
    where: { artistId: id },
    _max: { sortOrder: true },
  });

  const link = await prisma.artistLink.create({
    data: {
      artistId: id,
      title,
      url,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return Response.json(link, { status: 201 });
}
