"use client";

import {
  canManageArtistsEmail,
  canManageVenueLoginsEmail,
  canViewArtistEmail,
  filterArtistsForEmail,
  isOwnerAdminEmail,
  type ArtistAccessRecord,
} from "@/lib/admin-permissions";

const ADMIN_KEY = "highlife_admin";

export interface AdminSession {
  email: string;
  displayName: string;
  role: "admin" | "agent";
  dbRole?: "owner" | "admin" | "agent";
  loggedInAt: string;
  agentLoginId?: string;
}

/**
 * Authenticate via the server-side /api/admin/login endpoint.
 * Returns an AdminSession on success, null on failure.
 */
export async function adminLoginServer(
  emailOrUsername: string,
  password: string
): Promise<AdminSession | null> {
  const email = emailOrUsername.trim().toLowerCase();
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return null;

    const session: AdminSession = {
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      dbRole: data.dbRole,
      agentLoginId: data.agentLoginId,
      loggedInAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  }
}

export function adminLogout(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ADMIN_KEY);
    void fetch("/api/admin/login", { method: "DELETE" }).catch(() => null);
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function isAdminAuthed(): boolean {
  return getAdminSession() !== null;
}

export function isOwnerAdmin(session: AdminSession | null = getAdminSession()): boolean {
  // Check dbRole first (set by new server-side auth), fall back to email check
  if (session?.dbRole === "owner") return true;
  return isOwnerAdminEmail(session?.email);
}

export function isAgentAdmin(session: AdminSession | null = getAdminSession()): boolean {
  return session?.role === "agent";
}

// Client-side audition visibility -- owners always, agents always (server filters
// scope to assignments). Server still enforces auth properly via canViewAuditionsEmail.
export function canViewAuditions(session: AdminSession | null = getAdminSession()): boolean {
  if (!session) return false;
  return isOwnerAdmin(session) || session.role === "agent";
}

export function canManageArtists(session: AdminSession | null = getAdminSession()): boolean {
  return canManageArtistsEmail(session?.email);
}

export function canManageVenueLogins(session: AdminSession | null = getAdminSession()): boolean {
  return canManageVenueLoginsEmail(session?.email);
}

export function canViewArtist(
  artist: ArtistAccessRecord,
  session: AdminSession | null = getAdminSession()
): boolean {
  return canViewArtistEmail(session?.email, artist);
}

export function filterArtistsForSession<T extends ArtistAccessRecord>(
  artists: T[],
  session: AdminSession | null = getAdminSession()
): T[] {
  return filterArtistsForEmail(session?.email, artists);
}
