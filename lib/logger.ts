import { writeAudit } from "@/lib/audit";

/**
 * Centralized Audit Logger (auth flows).
 * Delegates to lib/audit so every event is scrubbed, echoed to the console
 * and persisted to the audit_logs table (FR-LOG-01). Fire-and-forget by
 * design — auth responses never wait on audit persistence.
 */
export function logAuthEvent(event: string, details: Record<string, any>) {
  void writeAudit({
    action: event,
    entityType: "AUTH",
    metadata: details,
  });
}
