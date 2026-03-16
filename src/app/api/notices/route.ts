import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createNoticeSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { canRoleSeeNotice } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
    });
    const scopedNotices = notices.filter((notice) =>
      canRoleSeeNotice(notice.targetRole, session.role)
    );
    return NextResponse.json(scopedNotices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();
    const roleError = requireRole(session, "ADMIN", "FACULTY");
    if (roleError) {
      logAuditEvent({
        action: "NOTICE_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const validation = await validateRequest(request, createNoticeSchema);
    if (!validation.success) return validation.response;
    const { title, content, priority, targetRole } = validation.data;

    if (session.role === "FACULTY" && targetRole === "ADMIN") {
      logAuditEvent({
        action: "NOTICE_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "invalid_target_role", targetRole },
      });
      return NextResponse.json(
        { error: "Faculty cannot target admin-only notices" },
        { status: 403 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || "normal",
        targetRole: targetRole || null,
        createdBy: session.userId,
      },
    });

    logAuditEvent({
      action: "NOTICE_CREATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "NOTICE",
      targetId: notice.id,
      details: { targetRole: notice.targetRole ?? null, priority: notice.priority },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    logAuditEvent({
      action: "NOTICE_CREATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
