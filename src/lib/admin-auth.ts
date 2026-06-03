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

interface AdminUser {
  email: string;
  password: string;
  displayName: string;
}

// 2026-06-03 — Dok directive: 'only two hard coded logins should be jaco@highlifedmv.com
// and liam@highlifedmv.com'. The legacy agent@highlifedmv.com test login is removed.
// Real agents authenticate via the DB-backed /api/admin/agent-auth path.
const ADMIN_USERS: ReadonlyArray<AdminUser> = [
  { email: "jaco@highlifedmv.com", password: "Jaco.iv1", displayName: "Jaco" },
  { email: "liam@highlifedmv.com", password: "DokMurda1", displayName: "Liam" },
];

export interface AdminSession {
  email: string;
  displayName: string;
  role: "admin" | "agent";
  loggedInAt: string;
  agentLoginId?: string; // populated for DB-backed agent logins
}

export function adminLogin(emailOrUsername: string, password: string): AdminSession | null {
  const email = emailOrUsername.trim().toLowerCase();
  const match = ADMIN_USERS.find((u) => u.email === email && u.password === password);
  if (!match) return null;
  const session: AdminSession = {
    email: match.email,
    displayName: match.displayName,
    role: isOwnerAdminEmail(match.email) ? "admin" : "agent",
    loggedInAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  }
  return session;
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  }
}

export function adminLogout(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(ADMIN_KEY);
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
  return isOwnerAdminEmail(session?.email);
}

export function isAgentAdmin(session: AdminSession | null = getAdminSession()): boolean {
  return session?.role === "agent";
}

// Client-side audition visibility — owners always, agents always (server filters
// scope to assignments). Server still enforces auth properly via canViewAuditionsEmail.
export function canViewAuditions(session: AdminSession | null = getAdminSession()): boolean {
  if (!session) return false;
  return isOwnerAdminEmail(session.email) || session.role === "agent";
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
