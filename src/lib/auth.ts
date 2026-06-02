"use client";

const AUTH_KEY = "highlife_auth";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  organizationName?: string;
  accountType?: string;
}

export async function login(emailOrUsername: string, password: string): Promise<boolean> {
  const email = emailOrUsername.trim().toLowerCase();
  try {
    const res = await fetch("/api/venue-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.ok) return false;
    if (typeof window !== "undefined") {
      const stored: StoredUser = {
        id: data.id,
        email: data.email,
        name: data.displayName,
        organizationName: data.organizationName,
        accountType: data.accountType,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
    }
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
  // Clear server-side signed cookie too. Fire-and-forget — if it fails the
  // localStorage clear above is enough to log the user out client-side.
  try {
    await fetch("/api/venue-auth", { method: "DELETE", credentials: "include" });
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as StoredUser;
  } catch {
    return null;
  }
}
