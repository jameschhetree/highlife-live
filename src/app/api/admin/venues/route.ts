// GET /api/admin/venues -- list all venues
// POST /api/admin/venues -- create a new venue

import { prisma } from "@/lib/db";
import { dbVenueToAdmin, adminVenueToDbInput } from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const rows = await prisma.venue.findMany({ orderBy: { name: "asc" } });
  return Response.json(rows.map(dbVenueToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const body = await request.json();
  const data = adminVenueToDbInput(body);
  const created = await prisma.venue.create({
    data: { ...data, isDemo: false } as Prisma.VenueCreateInput,
  });
  return Response.json(dbVenueToAdmin(created), { status: 201 });
}
