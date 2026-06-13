// Server-only permission helpers. These hit the DB (Prisma) so they cannot live
// in the shared admin-permissions.ts which is imported by client code via admin-auth.ts.

import "server-only";
import { prisma } from "@/lib/db";
import { isOwnerAdminEmail, normalizeAdminEmail } from "@/lib/admin-permissions";

// DB-backed agent identity check. Returns true if there's an active AgentLogin
// row whose email matches (any role).
export async function isAgentLoginEmail(email: string | null | undefined): Promise<boolean> {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || !prisma) return false;
  const row = await prisma.agentLogin.findFirst({
    where: { email: normalized, isActive: true },
    select: { id: true },
  });
  return !!row;
}

// DB-backed owner check. Returns true if there's an active AgentLogin row with
// role "owner" matching this email, OR if the email is in the legacy
// OWNER_ADMIN_EMAILS list (which will be removed once migration is confirmed).
export async function isOwnerEmail(email: string | null | undefined): Promise<boolean> {
  if (isOwnerAdminEmail(email)) return true;
  const normalized = normalizeAdminEmail(email);
  if (!normalized || !prisma) return false;
  const row = await prisma.agentLogin.findFirst({
    where: { email: normalized, isActive: true, role: "owner" },
    select: { id: true },
  });
  return !!row;
}

// Combined check: owner-admin OR active agent login. Use for "is this caller
// authenticated as some kind of admin?" guards in API routes.
export async function isAnyAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (isOwnerAdminEmail(email)) return true;
  return isAgentLoginEmail(email);
}

// Phase 3.7 C -- auditions are visible to agents too, scoped server-side to their
// assigned auditions only (via AuditionAssignment lookup in the API route).
export async function canViewAuditionsEmail(email: string | null | undefined): Promise<boolean> {
  if (isOwnerAdminEmail(email)) return true;
  return isAgentLoginEmail(email);
}

export async function canAccessAdminArtistApiEmail(email: string | null | undefined): Promise<boolean> {
  if (isOwnerAdminEmail(email)) return true;
  return isAgentLoginEmail(email);
}
