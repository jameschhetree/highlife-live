import type { GeneratedEpkRegistration } from "./types";

// Codex-generated EPK packages are registered here during reviewed integration.
// Git history on main/prod is the version and rollback record.
const GENERATED_EPKS: readonly GeneratedEpkRegistration[] = [];

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
