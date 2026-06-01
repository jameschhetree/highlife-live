// GET /api/admin/artists -- list all artists
// POST /api/admin/artists -- create a new artist

import { prisma } from "@/lib/db";
import { dbArtistToAdmin, adminArtistToDbInput } from "@/lib/admin-db-mappers";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
  }
  const rows = await prisma.artist.findMany({
    include: { socialStats: true },
    orderBy: { name: "asc" },
  });
  return Response.json(rows.map(dbArtistToAdmin));
}

export async function POST(request: Request) {
  if (!prisma) {
    return Response.json({ error: "Database not connected" }, { status: 503 });
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
