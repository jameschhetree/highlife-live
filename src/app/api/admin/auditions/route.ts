import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { canViewAuditionsEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!(await canViewAuditionsEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const isOwner = isOwnerAdminEmail(email);

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

  // Phase 3.7 C — agent scope: only auditions assigned to this agent via AuditionAssignment.
  if (!isOwner) {
    const agentLogin = await prisma.agentLogin.findFirst({
      where: { email, isActive: true },
      include: { auditionAssignments: { select: { auditionId: true } } },
    });
    const assignedIds = agentLogin?.auditionAssignments.map((a) => a.auditionId) ?? [];
    if (assignedIds.length === 0) return Response.json([]);
    where.id = { in: assignedIds };
  }

  const rows = await prisma.agentApplication.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });
  return Response.json(rows);
}
