// POST /api/admin/auditions/[id]/convert-to-artist — owner-only.
// Creates a new Artist from the AgentApplication and links the audition by storing
// the artistId in a synthesized "converted" marker (via VenueTimelineEvent-style note
// pattern using AuditionAssignment is unnecessary — we just record on the audition
// itself by status="Submitted" and rely on artist.name uniqueness check on caller side).
//
// Per brief: "Keep owner in control of final Artist creation." This endpoint accepts
// an optional override object so the owner's pre-fill edits in the form are honored.

import { prisma } from "@/lib/db";
import {
  getAdminEmailFromRequest,
  canManageAuditionsEmail,
} from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

function classificationToPerformanceType(classification: string): string {
  const c = classification.toLowerCase();
  if (c.includes("dj")) return "DJ";
  if (c.includes("band")) return "Band";
  if (c.includes("instrumental")) return "Instrumentalist";
  if (c.includes("comedian")) return "Comedian";
  return "Solo Artist";
}

function classificationToGenre(classification: string): string {
  const c = classification.toLowerCase();
  if (c.includes("dj")) return "DJ";
  if (c.includes("rap") || c.includes("hip")) return "Hip-Hop";
  if (c.includes("rnb") || c.includes("soul")) return "R&B";
  if (c.includes("classical")) return "Classical";
  return "";
}

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  const email = getAdminEmailFromRequest(request);
  if (!canManageAuditionsEmail(email)) {
    return Response.json({ error: "Forbidden — owner-admin only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const audition = await prisma.agentApplication.findUnique({ where: { id } });
  if (!audition) return Response.json({ error: "Audition not found" }, { status: 404 });

  // Owner may pass overrides (form-edited values) — fall back to audition fields.
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const overrides = body ?? {};

  const name = (overrides.name as string)?.trim() || audition.actStageName.trim() || audition.fullName.trim();
  if (!name) {
    return Response.json({ error: "Audition has no name to convert from" }, { status: 400 });
  }

  // Pull links from performanceLinks string. Could be social URLs; assign loosely.
  const performanceLinks = audition.performanceLinks ?? "";
  const findFirst = (rx: RegExp) => performanceLinks.match(rx)?.[0] ?? "";

  const created = await prisma.artist.create({
    data: {
      name,
      status: (overrides.status as string) || "Developing",
      legalName: (overrides.legalName as string) || audition.fullName,
      email: (overrides.email as string) || audition.email,
      phone: (overrides.phone as string) || audition.phone,
      performanceType:
        (overrides.performanceType as string) ||
        classificationToPerformanceType(audition.classification),
      primaryGenre:
        (overrides.primaryGenre as string) ||
        classificationToGenre(audition.classification),
      bio: (overrides.bio as string) || audition.actDescription || "",
      internalNotes:
        (overrides.internalNotes as string) ||
        (audition.actDescription ? `From audition ${audition.id}\n\n${audition.actDescription}` : `From audition ${audition.id}`),
      socialInstagram: (overrides.socialInstagram as string) || audition.instagram,
      socialWebsite:
        (overrides.socialWebsite as string) || findFirst(/https?:\/\/[^\s,]+/i) || "",
      isDemo: false,
    },
  });

  // Mark the audition as Submitted so it stops showing as "new"
  await prisma.agentApplication.update({
    where: { id },
    data: { status: "Submitted" },
  });

  return Response.json({ ok: true, artist: created });
}
