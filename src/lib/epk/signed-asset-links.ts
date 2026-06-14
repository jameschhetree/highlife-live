import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function signingSecret(): string {
  const secret = (
    process.env.EPK_ASSET_LINK_SECRET || process.env.ADMIN_SESSION_SECRET
  )?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("EPK asset-link signing is not configured.");
  }
  return secret;
}

export function epkAssetLinkSigningConfigured(): boolean {
  const secret = (
    process.env.EPK_ASSET_LINK_SECRET || process.env.ADMIN_SESSION_SECRET
  )?.trim();
  return Boolean(secret && secret.length >= 32);
}

function signature(jobId: string, assetId: string, expires: number): string {
  return createHmac("sha256", signingSecret())
    .update(`${jobId}.${assetId}.${expires}`)
    .digest("base64url");
}

export function createSignedAssetDownloadUrl(input: {
  baseUrl: string;
  jobId: string;
  assetId: string;
  ttlSeconds?: number;
}): string {
  const expires =
    Math.floor(Date.now() / 1000) +
    Math.max(60, input.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const url = new URL(
    `/api/admin/epks/${input.jobId}/assets/${input.assetId}`,
    input.baseUrl,
  );
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature(input.jobId, input.assetId, expires));
  return url.toString();
}

export function verifySignedAssetDownload(input: {
  jobId: string;
  assetId: string;
  expires: string | null;
  suppliedSignature: string | null;
}): boolean {
  const expires = Number(input.expires);
  if (
    !Number.isSafeInteger(expires) ||
    expires <= Math.floor(Date.now() / 1000) ||
    !input.suppliedSignature
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(
      signature(input.jobId, input.assetId, expires),
    );
    const supplied = Buffer.from(input.suppliedSignature);
    return (
      expected.length === supplied.length &&
      timingSafeEqual(expected, supplied)
    );
  } catch {
    return false;
  }
}
