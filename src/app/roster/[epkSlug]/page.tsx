import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  getGeneratedEpkByRoute,
} from "@/generated/epks/registry";
import type {
  GeneratedEpkAsset,
  GeneratedEpkLink,
} from "@/generated/epks/types";

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ epkSlug: string }>;
};

function publicAssetUrl(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }
  const value = (metadata as Record<string, unknown>).publicUrl;
  return typeof value === "string" && /^https:\/\//i.test(value) ? value : "";
}

function readLinks(input: unknown): GeneratedEpkLink[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  const links = (input as Record<string, unknown>).links;
  if (!Array.isArray(links)) return [];
  return links
    .filter(
      (link): link is GeneratedEpkLink =>
        Boolean(
          link &&
            typeof link === "object" &&
            "url" in link &&
            "label" in link &&
            typeof link.url === "string" &&
            typeof link.label === "string" &&
            /^https?:\/\//i.test(link.url),
        ),
    )
    .slice(0, 30);
}

async function loadEpkData(routeSlug: string) {
  const registration = getGeneratedEpkByRoute(routeSlug);
  if (!registration || !prisma) return null;

  const artist = await prisma.artist.findUnique({
    where: { id: registration.manifest.artistId },
    select: {
      id: true,
      name: true,
      primaryGenre: true,
      secondaryGenres: true,
      performanceType: true,
      bio: true,
      shortPitch: true,
      pressQuotes: true,
      image: true,
      epks: {
        take: 1,
        select: {
          assets: {
            where: { isPublished: true, scanStatus: "Clean" },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              kind: true,
              filename: true,
              mimeType: true,
              metadata: true,
            },
          },
          jobs: {
            where: { status: "GenerationRequested" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { input: true },
          },
        },
      },
    },
  });
  if (!artist) return null;

  const epk = artist.epks[0];
  const assets: GeneratedEpkAsset[] = (epk?.assets ?? [])
    .map((asset) => ({
      id: asset.id,
      kind: asset.kind as GeneratedEpkAsset["kind"],
      url: publicAssetUrl(asset.metadata),
      filename: asset.filename,
      mimeType: asset.mimeType,
    }))
    .filter(
      (asset) =>
        asset.url &&
        ["image", "audio", "video", "pdf"].includes(asset.kind),
    );

  return {
    registration,
    artist: {
      id: artist.id,
      slug: registration.manifest.artistSlug,
      name: artist.name,
      primaryGenre: artist.primaryGenre,
      secondaryGenres: artist.secondaryGenres,
      performanceType: artist.performanceType,
      bio: artist.bio,
      shortPitch: artist.shortPitch,
      pressQuotes: artist.pressQuotes,
      image: artist.image,
    },
    assets,
    links: readLinks(epk?.jobs[0]?.input),
  };
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { epkSlug } = await params;
  const data = await loadEpkData(epkSlug);
  if (!data) return { title: "EPK Not Found | HighLife Live" };

  const title =
    data.registration.manifest.title ||
    `${data.artist.name} EPK | HighLife Live`;
  const description =
    data.registration.manifest.description ||
    data.artist.shortPitch ||
    `Official electronic press kit for ${data.artist.name}.`;
  const canonical = `https://highlifelive.com/roster/${epkSlug}`;
  const hero =
    data.assets.find((asset) => asset.kind === "image")?.url ||
    data.artist.image;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
      images: hero ? [hero] : [],
    },
  };
}

export default async function GeneratedEpkRoute({ params }: PageParams) {
  const { epkSlug } = await params;
  const data = await loadEpkData(epkSlug);
  if (!data) notFound();

  const { default: EpkPage } = await data.registration.load();
  const events = `/events?artist=${encodeURIComponent(data.artist.slug)}`;
  const booking = `/book?artist=${encodeURIComponent(data.artist.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: data.artist.name,
    description: data.artist.bio || data.artist.shortPitch,
    genre: [
      data.artist.primaryGenre,
      ...data.artist.secondaryGenres,
    ].filter(Boolean),
    image:
      data.assets.find((asset) => asset.kind === "image")?.url ||
      data.artist.image ||
      undefined,
    url: `https://highlifelive.com/roster/${epkSlug}`,
    sameAs: data.links.map((link) => link.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <EpkPage
        artist={data.artist}
        assets={data.assets}
        links={data.links}
        routes={{ roster: "/roster", events, booking }}
      />
    </>
  );
}
