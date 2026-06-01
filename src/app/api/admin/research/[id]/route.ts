// PATCH /api/admin/research/[id]
// DELETE /api/admin/research/[id]

import { prisma } from "@/lib/db";
import {
  dbContactToResearch,
  adminResearchToDbInput,
} from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json();
  const data = adminResearchToDbInput(body);
  const updated = await prisma.contact.update({ where: { id }, data: data as Prisma.ContactUpdateInput });
  return Response.json(dbContactToResearch(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return Response.json({ ok: true });
}
