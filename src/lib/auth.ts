"use client";

const AUTH_KEY = "highlife_auth";

export async function login(emailOrUsername: string, password: string): Promise<boolean> {
  const email = emailOrUsername.trim().toLowerCase();
  try {
    const res = await fetch("/api/venue-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.ok) return false;
    if (typeof window !== "undefined") {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ email: data.email, name: data.displayName })
      );
    }
    return true;
  } catch {
    return false;
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function getUser(): { email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
