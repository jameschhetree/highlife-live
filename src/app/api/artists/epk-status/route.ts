// GET /api/artists/epk-status?slug=artist-slug
// Returns whether the artist has a Published EPK, and the slug to link to.
// Used by the public /artists/[slug] page for the "View EPK" button.

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(request: Request) {
  if (!prisma) {
    return Response.json({ hasActiveEpk: false });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return Response.json({ hasActiveEpk: false });
  }

  // Find artist by slug (name-based slugification)
  const artists = await prisma.artist.findMany({
    where: { isDemo: false },
    select: { id: true, name: true },
  });

  const artist = artists.find((a) => slugify(a.name) === slug);
  if (!artist) {
    return Response.json({ hasActiveEpk: false });
  }

  // Check for a Published EPK
  const epk = await prisma.ePK.findFirst({
    where: {
      artistId: artist.id,
      status: { in: ["Published", "Approved"] },
    },
    select: { status: true },
  });

  return Response.json({
    hasActiveEpk: !!epk,
    slug: slug,
  });
}
