// GET /api/admin/campaigns -- list all campaigns
// POST /api/admin/campaigns -- create a new campaign

import { prisma } from "@/lib/db";
import {
  dbCampaignToAdmin,
  adminCampaignToDbInput,
} from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const rows = await prisma.campaign.findMany({
    include: { artist: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map(dbCampaignToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const body = await request.json();
  const data = adminCampaignToDbInput(body);
  const created = await prisma.campaign.create({
    data: { ...data, isDemo: false } as Prisma.CampaignUncheckedCreateInput,
    include: { artist: { select: { name: true } } },
  });
  return Response.json(dbCampaignToAdmin(created), { status: 201 });
}
