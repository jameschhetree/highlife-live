import { prisma } from "@/lib/db";
import { canManageVenueLoginsEmail, getAdminEmailFromRequest } from "@/lib/admin-permissions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const rows = await prisma.partnerLoginRequest.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  // For each request, look up whether a Venue with that organizationName already exists.
  // Case-insensitive, trimmed match on Venue.name. Drives the inline "+ Add to venue list"
  // button vs. "✓ In venue list" badge on the requests table.
  const normalizedNames = Array.from(new Set(rows.map((r) => r.organizationName.trim().toLowerCase())));
  const allMatches = normalizedNames.length
    ? await prisma.venue.findMany({
        where: { name: { in: rows.map((r) => r.organizationName), mode: "insensitive" } },
        select: { id: true, name: true },
      })
    : [];
  const byNorm = new Map(allMatches.map((v) => [v.name.trim().toLowerCase(), v]));

  const enriched = rows.map((r) => {
    const m = byNorm.get(r.organizationName.trim().toLowerCase());
    return { ...r, matchedVenueId: m?.id ?? null, matchedVenueName: m?.name ?? null };
  });

  return Response.json(enriched);
}

export async function PATCH(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return Response.json({ error: "id and status are required" }, { status: 400 });
  }

  const validStatuses = new Set(["New", "Approved", "Rejected", "Converted", "Archived"]);
  if (!validStatuses.has(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const row = await prisma.partnerLoginRequest.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return Response.json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    if (message.includes("Record to update not found") || message.includes("RecordNotFound")) {
      return Response.json({ error: "Request not found" }, { status: 404 });
    }
    console.error("[venue-login-requests PATCH]", err);
    return Response.json({ error: message }, { status: 500 });
  }
}

// Hard delete a request row (owner-admin only). Use for spam / mistake submissions.
// Archived requests are soft-hidden via Show Archive toggle; this endpoint is the
// nuclear option for true removal.
export async function DELETE(request: NextRequest) {
  if (!prisma) return Response.json({ error: "DB not connected" }, { status: 503 });
  if (!canManageVenueLoginsEmail(getAdminEmailFromRequest(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id query param required" }, { status: 400 });
  await prisma.partnerLoginRequest.delete({ where: { id } });
  return Response.json({ ok: true });
}
