// GET /api/admin/research -- list all research contacts

import { prisma } from "@/lib/db";
import { dbContactToResearch } from "@/lib/admin-db-mappers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const rows = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(rows.map(dbContactToResearch));
}
