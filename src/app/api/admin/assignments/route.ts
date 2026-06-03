// GET  /api/admin/assignments -- list audition assignments (owner-only)
// POST /api/admin/assignments -- assign an audition to an agent (owner-only)

import { prisma } from "@/lib/db";
import { getAdminEmailFromRequest, isOwnerAdminEmail } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.auditionAssignment.findMany({
    orderBy: { assignedAt: "desc" },
    include: {
      agentLogin: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Enrich with audition data
  const auditionIds = rows.map((r) => r.auditionId);
  const auditions = auditionIds.length > 0
    ? await prisma.agentApplication.findMany({
        where: { id: { in: auditionIds } },
        select: { id: true, actStageName: true, fullName: true, classification: true, email: true },
      })
    : [];
  const auditionMap = new Map(auditions.map((a) => [a.id, a]));

  const enriched = rows.map((r) => ({
    ...r,
    audition: auditionMap.get(r.auditionId) || null,
  }));

  return Response.json(enriched);
}

export async function POST(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    auditionId?: string;
    agentLoginId?: string;
    notes?: string;
  };

  if (!body.auditionId || !body.agentLoginId) {
    return Response.json({ error: "auditionId and agentLoginId are required." }, { status: 400 });
  }

  // Check both exist
  const [audition, agent] = await Promise.all([
    prisma.agentApplication.findUnique({ where: { id: body.auditionId } }),
    prisma.agentLogin.findUnique({ where: { id: body.agentLoginId } }),
  ]);
  if (!audition) return Response.json({ error: "Audition not found" }, { status: 404 });
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

  const assignment = await prisma.auditionAssignment.create({
    data: {
      auditionId: body.auditionId,
      agentLoginId: body.agentLoginId,
      notes: body.notes || "",
    },
  });

  // Send email to agent about the assignment
  try {
    await sendAssignmentEmail(agent, audition);
  } catch (err) {
    console.error("[Assignment email] Failed:", err);
  }

  return Response.json(assignment, { status: 201 });
}

// PUT /api/admin/assignments  body: { auditionId, agentLoginId }
// Re-assigns an audition: deletes any existing assignment row(s) for this audition and
// creates a fresh one. Idempotent. Phase 3.7 B-assignments-ux click-to-assign flow.
export async function PUT(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { auditionId?: string; agentLoginId?: string };
  if (!body.auditionId || !body.agentLoginId) {
    return Response.json({ error: "auditionId and agentLoginId required" }, { status: 400 });
  }
  const [audition, agent] = await Promise.all([
    prisma.agentApplication.findUnique({ where: { id: body.auditionId } }),
    prisma.agentLogin.findUnique({ where: { id: body.agentLoginId } }),
  ]);
  if (!audition) return Response.json({ error: "Audition not found" }, { status: 404 });
  if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

  await prisma.auditionAssignment.deleteMany({ where: { auditionId: body.auditionId } });
  const assignment = await prisma.auditionAssignment.create({
    data: { auditionId: body.auditionId, agentLoginId: body.agentLoginId },
  });

  try { await sendAssignmentEmail(agent, audition); }
  catch (err) { console.error("[Assignment email] Failed:", err); }

  return Response.json(assignment);
}

// DELETE /api/admin/assignments?auditionId=...  → unassigns the audition.
export async function DELETE(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!isOwnerAdminEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const auditionId = request.nextUrl.searchParams.get("auditionId");
  if (!auditionId) return Response.json({ error: "auditionId query param required" }, { status: 400 });
  const result = await prisma.auditionAssignment.deleteMany({ where: { auditionId } });
  return Response.json({ ok: true, deleted: result.count });
}

async function sendAssignmentEmail(
  agent: { email: string; name: string },
  audition: { actStageName: string; fullName: string; classification: string }
) {
  const rawKey = process.env.RESEND_API_KEY;
  if (!rawKey) return;
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #e4e4e7;">
      <div style="border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #fafafa; margin: 0;">
          New Assignment
        </h1>
      </div>
      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">
        Hi ${agent.name},
      </p>
      <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">
        You have been assigned a new audition to review:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase; width: 120px;">Act Name</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px; font-weight: 600;">${audition.actStageName}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Full Name</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px;">${audition.fullName}</td></tr>
        <tr><td style="padding: 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase;">Category</td><td style="padding: 8px 0; color: #fafafa; font-size: 14px;">${audition.classification}</td></tr>
      </table>
      <p style="font-size: 14px; color: #d4d4d8;">
        Log in to the admin portal to review and respond.
      </p>
      <p style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #18181b; font-size: 11px; color: #52525b;">
        HighLife Live &middot; Assignments
      </p>
    </div>
  `;

  await resend.emails.send({
    from: "HighLife Live <bookings@highlifedmv.com>",
    to: [agent.email],
    subject: `New assignment: ${audition.actStageName}`,
    html,
  });
  console.log(`[Assignment email] Sent to ${agent.email} for ${audition.actStageName}`);
}
