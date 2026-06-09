// GET /api/admin/artists -- list all artists
// POST /api/admin/artists -- create a new artist

import { prisma } from "@/lib/db";
import { dbArtistToAdmin, adminArtistToDbInput } from "@/lib/admin-db-mappers";
import {
  canManageArtistsEmail,
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { canAccessAdminArtistApiEmail } from "@/lib/admin-permissions-server";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const adminEmail = getAdminEmailFromRequest(request);
  if (!(await canAccessAdminArtistApiEmail(adminEmail))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Agent visibility is DB-backed via AgentArtistAssignment.
  let where: Record<string, unknown> | undefined;
  if (!isOwnerAdminEmail(adminEmail)) {
    // Get assigned artist IDs from DB
    const agentLogin = await prisma.agentLogin.findFirst({
      where: { email: adminEmail, isActive: true },
      include: { artistAssignments: { select: { artistId: true } } },
    });
    const assignedIds = agentLogin?.artistAssignments.map((a) => a.artistId) ?? [];
    where = assignedIds.length > 0 ? { id: { in: assignedIds } } : { id: "__none__" };
  }

  const rows = await prisma.artist.findMany({
    where,
    include: { socialStats: true },
    orderBy: { name: "asc" },
  });
  return Response.json(rows.map(dbArtistToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  if (!canManageArtistsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const data = adminArtistToDbInput(body);

  // Extract stats for nested create
  const statsData = body.stats
    ? {
        instagramFollowers: body.stats.instagramFollowers ?? 0,
        tiktokFollowers: body.stats.tiktokFollowers ?? 0,
        youtubeSubscribers: body.stats.youtubeSubscribers ?? 0,
        spotifyMonthlyListeners: body.stats.spotifyMonthlyListeners ?? 0,
        avgEngagement: body.stats.avgEngagement ?? "0%",
        estimatedTotalAudience: body.stats.estimatedTotalAudience ?? 0,
        snapshotDate: body.stats.lastRefreshed
          ? new Date(body.stats.lastRefreshed)
          : new Date(),
      }
    : undefined;

  const createData = {
    ...data,
    isDemo: false,
    ...(statsData ? { socialStats: { create: statsData } } : {}),
  } as Prisma.ArtistCreateInput;

  const created = await prisma.artist.create({
    data: createData,
    include: { socialStats: true },
  });
  return Response.json(dbArtistToAdmin(created), { status: 201 });
}
