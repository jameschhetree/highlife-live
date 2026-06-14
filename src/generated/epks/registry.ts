import type { GeneratedEpkRegistration } from "./types";

// Codex-generated EPK packages are registered here during reviewed integration.
// Git history on main/prod is the version and rollback record.
const GENERATED_EPKS: readonly GeneratedEpkRegistration[] = [
  {
    manifest: {
      artistId: "cmqd7c8qu000004l8byj0bh5z",
      artistSlug: "kindrew",
      routeSlug: "kindrew-epk",
      title: "KinDrew EPK | HighLife Live",
      description:
        "Official KinDrew electronic press kit, including artist story, videos, links, events, and booking information.",
    },
    load: () => import("./kindrew/EpkPage"),
  },
];

export function getGeneratedEpkByRoute(
  routeSlug: string,
): GeneratedEpkRegistration | undefined {
  return GENERATED_EPKS.find(
    (entry) => entry.manifest.routeSlug === routeSlug,
  );
}

export function getGeneratedEpkByArtistId(
  artistId: string,
): GeneratedEpkRegistration | undefined {
  return GENERATED_EPKS.find(
    (entry) => entry.manifest.artistId === artistId,
  );
}
