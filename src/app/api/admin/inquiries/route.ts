// GET /api/admin/inquiries -- list inquiries (scoped by role)
// Owner: all inquiries
// Agent: only inquiries for assigned artists, with money fields stripped

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
  isAgentAdminEmail,
  stripMoneyFieldsArray,
} from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !isAgentAdminEmail(email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const source = request.nextUrl.searchParams.get("source");
  const status = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (source) where.source = source;
  if (status) where.status = status;

  if (isAgentAdminEmail(email)) {
    // Get assigned artist slugs for this agent
    const agentLogin = await prisma.agentLogin.findFirst({
      where: { email, isActive: true },
      include: { artistAssignments: true },
    });

    if (!agentLogin || agentLogin.artistAssignments.length === 0) {
      return Response.json([]);
    }

    // Get the artist IDs, then look up their slugs from static data
    // Since Inquiry uses artistSlug, we need to map from Artist.id -> slug
    const artistIds = agentLogin.artistAssignments.map((a) => a.artistId);
    const artists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
      select: { id: true, name: true },
    });
    const artistNames = artists.map((a) => a.name);

    where.artistName = { in: artistNames };
  }

  const rows = await prisma.inquiry.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  if (isAgentAdminEmail(email)) {
    return Response.json(stripMoneyFieldsArray(rows as Record<string, unknown>[]));
  }

  return Response.json(rows);
}
