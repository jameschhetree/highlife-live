import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "hl_venue_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  return (
    process.env.VENUE_SESSION_SECRET ||
    process.env.RESEND_API_KEY ||
    "highlife-dev-secret-do-not-use-in-prod"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function buildVenueSessionToken(venueLoginId: string, now: number = Date.now()): string {
  const expiresAt = now + MAX_AGE_SECONDS * 1000;
  const payload = `${venueLoginId}.${expiresAt}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyVenueSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [venueLoginId, expiresAtStr, sig] = parts;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;
  const expectedSig = sign(`${venueLoginId}.${expiresAtStr}`);
  // Timing-safe compare
  if (sig.length !== expectedSig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }
  return venueLoginId;
}

/** Server-side: set the httpOnly cookie after a successful venue login. */
export async function setVenueSessionCookie(venueLoginId: string): Promise<void> {
  const token = buildVenueSessionToken(venueLoginId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Server-side: clear the venue session cookie. */
export async function clearVenueSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Server-side: get the current venue session's VenueLogin.id (or null). */
export async function getVenueSessionId(): Promise<string | null> {
  const store = await cookies();
  return verifyVenueSessionToken(store.get(COOKIE_NAME)?.value);
}
