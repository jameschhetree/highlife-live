"use client";

const AUTH_KEY = "highlife_auth";

interface VenuePartner {
  email: string;
  password: string;
  name: string;
}

const VENUE_PARTNERS: ReadonlyArray<VenuePartner> = [
  { email: "testvenue3307@gmail.com", password: "testingVenues3307", name: "Venue Partner" },
];

export function login(emailOrUsername: string, password: string): boolean {
  const email = emailOrUsername.trim().toLowerCase();
  const match = VENUE_PARTNERS.find((u) => u.email === email && u.password === password);
  if (!match) return false;
  if (typeof window !== "undefined") {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ email: match.email, name: match.name })
    );
  }
  return true;
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
