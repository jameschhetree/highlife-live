"use client";

const ADMIN_KEY = "highlife_admin";

interface AdminUser {
  email: string;
  password: string;
  displayName: string;
}

const ADMIN_USERS: ReadonlyArray<AdminUser> = [
  { email: "jaco@highlifedmv.com", password: "Jaco.iv1", displayName: "Jaco" },
  { email: "liam@highlifedmv.com", password: "DokMurda1", displayName: "Liam" },
];

export interface AdminSession {
  email: string;
  displayName: string;
  role: "admin";
  loggedInAt: string;
}

export function adminLogin(emailOrUsername: string, password: string): AdminSession | null {
  const email = emailOrUsername.trim().toLowerCase();
  const match = ADMIN_USERS.find((u) => u.email === email && u.password === password);
  if (!match) return null;
  const session: AdminSession = {
    email: match.email,
    displayName: match.displayName,
    role: "admin",
    loggedInAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  }
  return session;
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
