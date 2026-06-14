// GET /api/artists  — public roster data.
// Returns active (non-demo) artists from the DB, mapped to the public Artist shape
// that ArtistCard + /roster + /artists/[slug] consume.
//
// Phase 3.7 — Dok directive 2026-06-03: 'i need artists in the admin portal to
// show up on the roster page, link that.'

import { prisma } from "@/lib/db";
import type { Artist } from "@/lib/data";
import { getGeneratedEpkByArtistId } from "@/generated/epks/registry";

export const dynamic = "force-dynamic";

// Generate a URL-safe slug from a name.
// Mirrors the convention the original hardcoded array used ("DJ Saint Noir" → "dj-saint-noir").
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Bucket the primaryGenre into one of the roster filter categories.
// Falls through to "Live Performance" so every artist gets a category.
function categoryFor(primaryGenre: string): string {
  const g = primaryGenre.toLowerCase();
  if (g.includes("hip") || g.includes("rap")) return "Hip-Hop";
  if (g.includes("r&b") || g.includes("rnb") || g.includes("soul")) return "R&B";
  if (g.includes("afro")) return "Afrobeats";
  if (g.includes("dj") || g.includes("electronic") || g.includes("house") || g.includes("techno")) return "DJ";
  if (g.includes("produc")) return "Producer";
  return "Live Performance";
}

export async function GET() {
  if (!prisma) return Response.json([] as Artist[]);

  // Public roster includes anyone still bookable/being considered.
  // Excluded: Paused (temporarily off) + Archived (gone).
  // The /admin/artists UI defaults new artists to 'Testing', so include that here
  // — otherwise a freshly-created artist would not appear on /roster (the 'why
  // isn't it working' bug Dok hit 2026-06-03).
  const rows = await prisma.artist.findMany({
    where: {
      isDemo: false,
      status: { in: ["Active", "Priority", "Testing"] },
    },
    orderBy: [
      { status: "asc" }, // Priority alphabetically before Active is fine; tweak if Dok wants priority-first
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      status: true,
      primaryGenre: true,
      secondaryGenres: true,
      bookingFeeRange: true,
      bio: true,
      shortPitch: true,
      targetVenueTypes: true,
      travelWillingness: true,
      image: true,
      pressQuotes: true,
      performanceType: true,
      typicalSetLength: true,
      cleanExplicit: true,
      socialInstagram: true,
      socialTiktok: true,
      socialYoutube: true,
      socialSpotify: true,
      socialAppleMusic: true,
      socialSoundcloud: true,
      socialWebsite: true,
      socialLinktree: true,
      links: { orderBy: { sortOrder: "asc" }, select: { title: true, url: true } },
      assets: { select: { id: true, kind: true, blobUrl: true, filename: true, mimeType: true } },
    },
  });

  const mapped: Artist[] = rows.map((r) => {
    const slug = slugify(r.name) || r.id;
    const generatedEpk = getGeneratedEpkByArtistId(r.id);

    // Build links array: custom links + social links derived from social fields
    const customLinks = (r.links ?? []).map((l) => ({ title: l.title, url: l.url }));
    const socialEntries: { field: string; title: string }[] = [
      { field: r.socialInstagram, title: "Instagram" },
      { field: r.socialTiktok, title: "TikTok" },
      { field: r.socialYoutube, title: "YouTube" },
      { field: r.socialSpotify, title: "Spotify" },
      { field: r.socialAppleMusic, title: "Apple Music" },
      { field: r.socialSoundcloud, title: "SoundCloud" },
      { field: r.socialWebsite, title: "Website" },
      { field: r.socialLinktree, title: "Linktree" },
    ];
    const socialLinks = socialEntries
      .filter((s) => s.field && s.field.trim() !== "")
      .map((s) => {
        let url = s.field.trim();
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `https://${url}`;
        }
        return { title: s.title, url };
      });
    const allLinks = [...customLinks, ...socialLinks];

    return {
      slug,
      epkUrl: generatedEpk
        ? `/roster/${generatedEpk.manifest.routeSlug}`
        : undefined,
      name: r.name,
      genre: r.primaryGenre || (r.secondaryGenres[0] ?? ""),
      category: categoryFor(r.primaryGenre || ""),
      city: "",
      priceRange: r.bookingFeeRange || "",
      available: r.status === "Active" || r.status === "Priority",
      bio: r.bio || "",
      shortDesc: r.shortPitch || "",
      performanceTypes: r.targetVenueTypes ?? [],
      pastEvents: [],
      travelAvailability: r.travelWillingness || "",
      image: r.image || "",
      links: allLinks.length > 0 ? allLinks : undefined,
      assets: (r.assets ?? []).length > 0 ? r.assets : undefined,
      pressQuotes: r.pressQuotes.length > 0 ? r.pressQuotes : undefined,
      secondaryGenres: r.secondaryGenres.length > 0 ? r.secondaryGenres : undefined,
      performanceType: r.performanceType || undefined,
      cleanExplicit: r.cleanExplicit || undefined,
      typicalSetLength: r.typicalSetLength || undefined,
    };
  });

  return Response.json(mapped);
}
