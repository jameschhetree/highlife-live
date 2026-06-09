// GET /api/events -- public list of published events for the /events page.
// Returns only published rows; no auth.

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!prisma) return Response.json([]);
  const rows = await prisma.event.findMany({
    where: { published: true },
    orderBy: [{ isPast: "asc" }, { startAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      date: true,
      startAt: true,
      city: true,
      venue: true,
      featuredArtists: true,
      featuredArtistIds: true,
      externalArtists: true,
      ticketStatus: true,
      ticketUrl: true,
      isPast: true,
      description: true,
      showDescription: true,
      address: true,
      showAddress: true,
    },
  });
  return Response.json(rows);
}
