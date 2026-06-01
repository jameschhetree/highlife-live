// GET /api/admin/opportunities -- list all opportunities
// POST /api/admin/opportunities -- create a new opportunity

import { prisma } from "@/lib/db";
import {
  dbOpportunityToAdmin,
  adminOpportunityToDbInput,
} from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const rows = await prisma.opportunity.findMany({
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map(dbOpportunityToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const body = await request.json();
  const data = adminOpportunityToDbInput(body);
  const created = await prisma.opportunity.create({
    data: { ...data, isDemo: false } as Prisma.OpportunityUncheckedCreateInput,
    include: {
      artist: { select: { name: true } },
      venue: { select: { name: true } },
    },
  });
  return Response.json(dbOpportunityToAdmin(created), { status: 201 });
}
