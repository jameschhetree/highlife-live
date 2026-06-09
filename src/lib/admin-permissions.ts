export const OWNER_ADMIN_EMAILS = ["jaco@highlifedmv.com", "liam@highlifedmv.com"] as const;
// 2026-06-03 — Dok directive: only jaco + liam are hardcoded logins. The legacy
// agent@highlifedmv.com test login is removed. Agent identity is now exclusively
// determined by the AgentLogin DB table — see isAgentLoginEmail() below.

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
  "bookingOffer",
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

// Mutating an audition base record (delete, free-form edits) stays owner-only.
// Status changes go through the standard PATCH path and are gated inside the route.
export function canManageAuditionsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

export function canManageVenueLoginsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

export function canManageArtistsEmail(email: string | null | undefined): boolean {
  return isOwnerAdminEmail(email);
}

// NOTE: isAgentLoginEmail / canViewAuditionsEmail / canAccessAdminArtistApiEmail /
// isAnyAdminEmail are async DB-backed checks and live in admin-permissions-server.ts
// so this file stays client-safe (no Prisma imports leak into client bundles).

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
  _email: string | null | undefined,
  artists: T[]
): T[] {
  // Phase 3.8 fix (Murd QA finding 6): used to return [] for non-owners on the
  // assumption the legacy isAgentVisibleArtist would filter. After we moved
  // visibility to DB-backed AgentArtistAssignment, the server-side API
  // (/api/admin/artists) already scopes the list before it reaches this filter.
  // Returning [] here was double-filtering the already-scoped result, so agents
  // saw no artists on /admin/artists even when they had assignments.
  // Pass-through is correct now — server is the single source of truth.
  return artists;
}
