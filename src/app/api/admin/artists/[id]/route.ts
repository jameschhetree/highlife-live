// GET /api/admin/artists/[id] -- get single artist
// PATCH /api/admin/artists/[id] -- update artist
// DELETE /api/admin/artists/[id] -- delete artist

import { prisma } from "@/lib/db";
import { dbArtistToAdmin, adminArtistToDbInput } from "@/lib/admin-db-mappers";
import {
  canAccessAdminArtistApiEmail,
  canManageArtistsEmail,
  canViewArtistEmail,
  getAdminEmailFromRequest,
} from "@/lib/admin-permissions";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const row = await prisma.artist.findUnique({
    where: { id },
    include: { socialStats: true },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const adminEmail = getAdminEmailFromRequest(request);
  if (!canAccessAdminArtistApiEmail(adminEmail) || !canViewArtistEmail(adminEmail, row)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json(dbArtistToAdmin(row));
}

export async function PATCH(
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
  const data = adminArtistToDbInput(body);

  const updated = await prisma.artist.update({
    where: { id },
    data: data as Prisma.ArtistUpdateInput,
    include: { socialStats: true },
  });
  return Response.json(dbArtistToAdmin(updated));
}

export async function DELETE(
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
  await prisma.artist.delete({ where: { id } });
  return Response.json({ ok: true });
}
