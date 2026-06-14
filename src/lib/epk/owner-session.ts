import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextResponse } from "next/server";

export const OWNER_SESSION_COOKIE = "hl_owner_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export type OwnerSession = {
  email: string;
  displayName: string;
  csrfToken: string;
  expiresAt: number;
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function parseCookies(header: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const pair of (header ?? "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name) cookies.set(name, decodeURIComponent(value));
  }
  return cookies;
}

export function ownerAuthConfiguration() {
  const missing = getSessionSecret() ? [] : ["ADMIN_SESSION_SECRET"];
  return { configured: missing.length === 0, missing };
}

export function createOwnerSessionForIdentity(input: {
  email: string;
  displayName: string;
}): {
  session: OwnerSession;
  token: string;
} {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Owner session secret is not configured.");

  const session: OwnerSession = {
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName,
    csrfToken: randomBytes(32).toString("base64url"),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(session));
  return {
    session,
    token: `${encodedPayload}.${signPayload(encodedPayload, secret)}`,
  };
}

export function verifyOwnerSessionToken(token: string | undefined): OwnerSession | null {
  const secret = getSessionSecret();
  if (!secret || !token) return null;
  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return null;
  if (!safeEqual(signature, signPayload(encodedPayload, secret))) return null;

  try {
    const session = JSON.parse(base64UrlDecode(encodedPayload)) as OwnerSession;
    if (
      !session.email ||
      !session.csrfToken ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getOwnerSessionFromRequest(request: Request): OwnerSession | null {
  const token = parseCookies(request.headers.get("cookie")).get(OWNER_SESSION_COOKIE);
  return verifyOwnerSessionToken(token);
}

export function setOwnerSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: OWNER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearOwnerSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: OWNER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

export function hasValidOwnerCsrf(request: Request, session: OwnerSession): boolean {
  const header = request.headers.get("x-epk-csrf") ?? "";
  return isSameOriginRequest(request) && safeEqual(header, session.csrfToken);
}
