// GET /api/bookings/[id] -- get single booking
// PATCH /api/bookings/[id] -- update status + adminNotes
// DELETE /api/bookings/[id] -- delete booking

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const row = await prisma.booking.findUnique({ where: { id } });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(row);
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

  const allowed = ["status", "adminNotes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.booking.delete({ where: { id } });
  return Response.json({ ok: true });
}
