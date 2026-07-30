import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Persistent audit trail (FR-LOG-01).
 * Every entry is scrubbed of secrets, echoed to the console for live tracing,
 * and persisted to the `audit_logs` table so Super Admin tooling can query it.
 * Persistence failures are logged but never break the user-facing action.
 */

const SENSITIVE_KEYS = [
  "password",
  "otp",
  "token",
  "secret",
  "access_token",
  "newPassword",
  "passwordHash",
  "key",
];

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "[REDACTED_EMAIL]";
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function scrub(details: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = { ...details };

  for (const key of Object.keys(scrubbed)) {
    if (SENSITIVE_KEYS.includes(key)) {
      scrubbed[key] = "[REDACTED]";
    } else if (key === "email" && typeof scrubbed[key] === "string") {
      scrubbed[key] = maskEmail(scrubbed[key] as string);
    }
  }

  return scrubbed;
}

export interface AuditEntry {
  /** Machine-readable action name, e.g. "ADMIN_USER_ROLE_CHANGED". */
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const metadata = scrub(entry.metadata ?? {});

  console.log(
    `[AUDIT] [${new Date().toISOString()}] ${entry.action} | actor=${entry.actorId ?? "anonymous"} |`,
    JSON.stringify(metadata),
  );

  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ip: entry.ip,
      },
    });
  } catch (error) {
    // Never let audit persistence take down the request path.
    console.error("[AUDIT] Failed to persist audit entry:", error);
  }
}
