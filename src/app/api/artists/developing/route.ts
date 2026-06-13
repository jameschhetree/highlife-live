// GET /api/artists/developing — public booking-form discovery surface.
// Returns artists with status="Developing" plus a short public-safe pitch.
// Used only by the "Developing Artists" popup on /book. These artists are
// intentionally excluded from /roster + the main /book dropdown.

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  if (!prisma) return Response.json([]);

  const rows = await prisma.artist.findMany({
    where: {
      isDemo: false,
      status: "Developing",
    },
    orderBy: { name: "asc" },
    select: {
      name: true,
      primaryGenre: true,
      shortPitch: true,
      bio: true,
      image: true,
    },
  });

  return Response.json(
    rows.map((r) => ({
      slug: slugify(r.name),
      name: r.name,
      genre: r.primaryGenre || "Live Performance",
      pitch: r.shortPitch || (r.bio ? r.bio.slice(0, 220) : "Emerging HighLife artist available for booking inquiry."),
      image: r.image || "",
    })),
  );
}
