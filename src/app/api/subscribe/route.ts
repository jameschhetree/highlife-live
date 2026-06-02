// POST /api/subscribe -- email list signup (footer Stay Connected)

import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });

  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  // Prevent duplicates
  const existing = await prisma.emailSubscriber.findUnique({ where: { email } });
  if (existing) {
    // Don't reveal that the email already exists -- return success
    return Response.json({ ok: true });
  }

  await prisma.emailSubscriber.create({ data: { email } });
  return Response.json({ ok: true }, { status: 201 });
}
