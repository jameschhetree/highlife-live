"use client";

const AUTH_KEY = "highlife_auth";

export function login(emailOrUsername: string, password: string): boolean {
  if (
    (emailOrUsername === "demo@demo.com" || emailOrUsername === "demo") &&
    password === "demo"
  ) {
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: "demo@demo.com", name: "Promoter" }));
    }
    return true;
  }
  return false;
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
