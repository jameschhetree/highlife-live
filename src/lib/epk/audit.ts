import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function writeEpkAudit(input: {
  action: string;
  entityType: string;
  entityId: string;
  userEmail: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!prisma) return;
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userEmail,
      details: input.details as Prisma.InputJsonValue | undefined,
    },
  });
}
