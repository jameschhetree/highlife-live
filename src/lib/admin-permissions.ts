export const OWNER_ADMIN_EMAILS = ["jaco@highlifedmv.com", "liam@highlifedmv.com"] as const;
export const AGENT_ADMIN_EMAIL = "agent@highlifedmv.com";

// Money fields that must be stripped from agent-facing API responses
export const MONEY_FIELDS = [
  "proposedOffer",
  "proposedFee",
  "expectedFee",
  "confirmedFee",
  "guarantee",
  "split",
  "budget",
  "fee",
  "bookingFeeRange",
] as const;

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
  // Legacy static agent email OR any dynamic agent login email
  return normalizeAdminEmail(email) === AGENT_ADMIN_EMAIL;
}

export function isAnyAdminEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email) || isAgentAdminEmail(email);
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

/** Strip money fields from an object for agent-scoped responses */
export function stripMoneyFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result = { ...obj };
  for (const field of MONEY_FIELDS) {
    if (field in result) {
      delete result[field];
    }
  }
  return result;
}

/** Strip money fields from an array of objects */
export function stripMoneyFieldsArray<T extends Record<string, unknown>>(arr: T[]): Partial<T>[] {
  return arr.map(stripMoneyFields);
}

// Legacy artist visibility functions (kept for backward compatibility during transition)
// These will be replaced by DB-backed agent-to-artist assignments
export function isAgentVisibleArtist(_artist: ArtistAccessRecord): boolean {
  // With the new AgentArtistAssignment table, visibility is checked via DB query
  // This function is kept for compile compat but should not be the primary check
  return false;
}

export function canViewArtistEmail(
  email: string | null | undefined,
  _artist: ArtistAccessRecord
): boolean {
  if (isOwnerAdminEmail(email)) return true;
  // Agent artist visibility is now DB-backed via AgentArtistAssignment
  return false;
}

export function filterArtistsForEmail<T extends ArtistAccessRecord>(
  email: string | null | undefined,
  artists: T[]
): T[] {
  if (isOwnerAdminEmail(email)) return artists;
  // Agent filtering is now DB-backed
  return [];
}
