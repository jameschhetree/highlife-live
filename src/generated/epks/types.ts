import type { ComponentType } from "react";

export type GeneratedEpkArtist = {
  id: string;
  slug: string;
  name: string;
  primaryGenre: string;
  secondaryGenres: string[];
  performanceType: string;
  bio: string;
  shortPitch: string;
  pressQuotes: string[];
  image: string;
};

export type GeneratedEpkAsset = {
  id: string;
  kind: "image" | "audio" | "video" | "pdf";
  url: string;
  filename: string;
  mimeType: string;
};

export type GeneratedEpkLink = {
  url: string;
  label: string;
};

export type GeneratedEpkPageProps = {
  artist: GeneratedEpkArtist;
  assets: GeneratedEpkAsset[];
  links: GeneratedEpkLink[];
  routes: {
    roster: "/roster";
    events: string;
    booking: string;
  };
};

export type GeneratedEpkManifest = {
  artistId: string;
  artistSlug: string;
  routeSlug: string;
  title?: string;
  description?: string;
};

export type GeneratedEpkRegistration = {
  manifest: GeneratedEpkManifest;
  load: () => Promise<{
    default: ComponentType<GeneratedEpkPageProps>;
  }>;
};
