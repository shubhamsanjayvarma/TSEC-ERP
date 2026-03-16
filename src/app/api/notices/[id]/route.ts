import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();
    const roleError = requireRole(session, "ADMIN");
    if (roleError) {
      logAuditEvent({
        action: "NOTICE_DELETE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const { id } = await params;
    await prisma.notice.delete({ where: { id } });
    logAuditEvent({
      action: "NOTICE_DELETE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "NOTICE",
      targetId: id,
    });
    return NextResponse.json({ message: "Notice deleted" });
  } catch (error) {
    logAuditEvent({
      action: "NOTICE_DELETE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
