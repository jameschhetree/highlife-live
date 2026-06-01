// GET /api/admin/artists/[id] -- get single artist
// PATCH /api/admin/artists/[id] -- update artist
// DELETE /api/admin/artists/[id] -- delete artist

import { prisma } from "@/lib/db";
import { dbArtistToAdmin, adminArtistToDbInput } from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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
  return Response.json(dbArtistToAdmin(row));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.artist.delete({ where: { id } });
  return Response.json({ ok: true });
}
