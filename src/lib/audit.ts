type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditEvent {
  action: string;
  outcome: AuditOutcome;
  actorId?: string | null;
  actorRole?: string | null;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

/**
 * Lightweight audit logging for sensitive actions.
 * Uses structured logs so production log pipelines can index/filter events.
 */
export function logAuditEvent(event: AuditEvent) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  console.info("[AUDIT]", JSON.stringify(payload));
}

