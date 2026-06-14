// POST /api/unsubscribe — marks an email subscriber as unsubscribed.
// Strategy: if EmailSubscriber exists, delete it and add to SuppressionListEntry
// (which already exists in the schema for campaign suppression). 404 if not found.

import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return Response.json({ error: "DB not connected" }, { status: 503 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  // Check if this email is in the subscriber list
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email },
  });

  if (!subscriber) {
    // Not subscribed — check suppression list to see if already unsubscribed
    const suppressed = await prisma.suppressionListEntry.findUnique({
      where: { email },
    });
    if (suppressed) {
      // Already unsubscribed — treat as success so as not to reveal status
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Email not found" }, { status: 404 });
  }

  // Delete from subscriber list
  await prisma.emailSubscriber.delete({ where: { email } });

  // Add to suppression list (upsert to avoid duplicate key on re-unsubscribe)
  await prisma.suppressionListEntry.upsert({
    where: { email },
    update: { reason: "self_unsubscribe" },
    create: {
      email,
      reason: "self_unsubscribe",
      addedDate: new Date().toISOString().slice(0, 10),
    },
  });

  return Response.json({ ok: true });
}
