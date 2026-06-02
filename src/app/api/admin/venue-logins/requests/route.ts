import { prisma } from "@/lib/db";
import { canManageVenueLoginsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const rows = await prisma.partnerLoginRequest.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });
  return Response.json(rows);
}

export async function PATCH(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return Response.json({ error: "id and status are required" }, { status: 400 });
  }

  const validStatuses = new Set(["New", "Approved", "Rejected", "Converted", "Archived"]);
  if (!validStatuses.has(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const row = await prisma.partnerLoginRequest.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return Response.json(row);
}
