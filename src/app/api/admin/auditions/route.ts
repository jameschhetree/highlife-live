import { prisma } from "@/lib/db";
import { canViewAuditionsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canViewAuditionsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const classification = request.nextUrl.searchParams.get("classification");
  const search = request.nextUrl.searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (classification) where.classification = classification;
  if (search) {
    where.OR = [
      { actStageName: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.agentApplication.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });
  return Response.json(rows);
}
