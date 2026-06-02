export const OWNER_ADMIN_EMAILS = ["jaco@highlifedmv.com", "liam@highlifedmv.com"] as const;
export const AGENT_ADMIN_EMAIL = "agent@highlifedmv.com";

export const AGENT_VISIBLE_ARTIST_IDS = ["art-003", "art-004"] as const;
export const AGENT_VISIBLE_ARTIST_NAMES = ["Tone Brady", "Nyla Vale"] as const;

export type ArtistAccessRecord = {
  id: string;
  name?: string | null;
};

export function normalizeAdminEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function getAdminEmailFromRequest(request: Request): string {
  return normalizeAdminEmail(request.headers.get("x-admin-email"));
}

export function isOwnerAdminEmail(email: string | null | undefined): boolean {
  return OWNER_ADMIN_EMAILS.includes(normalizeAdminEmail(email) as (typeof OWNER_ADMIN_EMAILS)[number]);
}

export function isAgentAdminEmail(email: string | null | undefined): boolean {
  return normalizeAdminEmail(email) === AGENT_ADMIN_EMAIL;
}

export function canViewAuditionsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

export function canManageVenueLoginsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

export function canManageArtistsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

export function canAccessAdminArtistApiEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email) || isAgentAdminEmail(email);
}

export function isAgentVisibleArtist(artist: ArtistAccessRecord): boolean {
  return (
    AGENT_VISIBLE_ARTIST_IDS.includes(artist.id as (typeof AGENT_VISIBLE_ARTIST_IDS)[number]) ||
    AGENT_VISIBLE_ARTIST_NAMES.includes((artist.name ?? "") as (typeof AGENT_VISIBLE_ARTIST_NAMES)[number])
  );
}

export function canViewArtistEmail(
  email: string | null | undefined,
  artist: ArtistAccessRecord
): boolean {
  if (isOwnerAdminEmail(email)) return true;
  if (isAgentAdminEmail(email)) return isAgentVisibleArtist(artist);
  return false;
}

export function filterArtistsForEmail<T extends ArtistAccessRecord>(
  email: string | null | undefined,
  artists: T[]
): T[] {
  if (isOwnerAdminEmail(email)) return artists;
  if (isAgentAdminEmail(email)) return artists.filter(isAgentVisibleArtist);
  return [];
}
