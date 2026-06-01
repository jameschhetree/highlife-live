// GET /api/admin/venues/[id]
// PATCH /api/admin/venues/[id]
// DELETE /api/admin/venues/[id]

import { prisma } from "@/lib/db";
import { dbVenueToAdmin, adminVenueToDbInput } from "@/lib/admin-db-mappers";
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
  const row = await prisma.venue.findUnique({ where: { id } });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(dbVenueToAdmin(row));
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
  const data = adminVenueToDbInput(body);
  const updated = await prisma.venue.update({ where: { id }, data: data as Prisma.VenueUpdateInput });
  return Response.json(dbVenueToAdmin(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.venue.delete({ where: { id } });
  return Response.json({ ok: true });
}
