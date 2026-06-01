// GET /api/admin/opportunities/[id]
// PATCH /api/admin/opportunities/[id]
// DELETE /api/admin/opportunities/[id]

import { prisma } from "@/lib/db";
import {
  dbOpportunityToAdmin,
  adminOpportunityToDbInput,
} from "@/lib/admin-db-mappers";
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
  const row = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(dbOpportunityToAdmin(row));
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
  const data = adminOpportunityToDbInput(body);
  const updated = await prisma.opportunity.update({
    where: { id },
    data: data as Prisma.OpportunityUpdateInput,
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    },
  });
  return Response.json(dbOpportunityToAdmin(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.opportunity.delete({ where: { id } });
  return Response.json({ ok: true });
}
