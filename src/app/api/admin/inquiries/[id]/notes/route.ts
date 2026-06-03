// Admin notes endpoint for an inquiry.
// GET → list ALL notes (admin + venue + internal) — admin sees everything.
// POST → admin posts a new note. Default authorType="admin" (visible to venue).
//        Pass { internal: true } to post a private note that the venue portal hides.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  isOwnerAdminEmail,
} from "@/lib/admin-permissions";
import { isAgentLoginEmail } from "@/lib/admin-permissions-server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const notes = await prisma.inquiryNote.findMany({
    where: { inquiryId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(notes);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!isOwnerAdminEmail(email) && !(await isAgentLoginEmail(email))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { body?: string; internal?: boolean };
  const text = (body.body ?? "").trim();
  if (!text) return Response.json({ error: "body required" }, { status: 400 });

  const note = await prisma.inquiryNote.create({
    data: {
      inquiryId: id,
      authorType: body.internal ? "internal" : "admin",
      authorEmail: email,
      authorName: email.split("@")[0] || "Admin",
      body: text,
    },
  });
  return Response.json(note, { status: 201 });
}
