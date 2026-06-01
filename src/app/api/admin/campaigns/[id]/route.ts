// GET /api/admin/campaigns/[id]
// PATCH /api/admin/campaigns/[id]
// DELETE /api/admin/campaigns/[id]

import { prisma } from "@/lib/db";
import {
  dbCampaignToAdmin,
  adminCampaignToDbInput,
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
  const row = await prisma.campaign.findUnique({
    where: { id },
    include: { artist: { select: { name: true } } },
  });
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(dbCampaignToAdmin(row));
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
  const data = adminCampaignToDbInput(body);
  const updated = await prisma.campaign.update({
    where: { id },
    data: data as Prisma.CampaignUpdateInput,
    include: { artist: { select: { name: true } } },
  });
  return Response.json(dbCampaignToAdmin(updated));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return Response.json({ ok: true });
}
