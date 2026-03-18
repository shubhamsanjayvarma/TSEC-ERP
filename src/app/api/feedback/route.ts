import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createFeedbackSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    // Admin/Faculty see all feedback; Students see only their own
    const where = session.role === "STUDENT" && session.studentId
      ? { studentId: session.studentId }
      : {};

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If feedback is anonymous, hide student info for non-admin
    const sanitized = feedbacks.map((f: any) => ({
      id: f.id,
      type: f.type,
      subjectName: f.subjectName,
      facultyName: f.facultyName,
      rating: f.rating,
      comment: f.comment,
      anonymous: f.anonymous,
      createdAt: f.createdAt,
      studentName: f.anonymous && session.role !== "ADMIN"
        ? "Anonymous"
        : f.student?.user?.name || "Unknown",
      department: f.student?.department?.code || "—",
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
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

    // Only students can submit feedback
    const roleError = requireRole(session, "STUDENT");
    if (roleError) {
      logAuditEvent({
        action: "FEEDBACK_SUBMIT",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    if (!session.studentId) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
    }

    const validation = await validateRequest(request, createFeedbackSchema);
    if (!validation.success) return validation.response;
    const { type, subjectName, facultyName, rating, comment, anonymous } = validation.data;

    const feedback = await prisma.feedback.create({
      data: {
        type,
        subjectName,
        facultyName,
        rating,
        comment,
        anonymous: anonymous ?? true,
        studentId: session.studentId,
      },
    });

    logAuditEvent({
      action: "FEEDBACK_SUBMIT",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "FEEDBACK",
      targetId: feedback.id,
      details: { type, rating },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    logAuditEvent({
      action: "FEEDBACK_SUBMIT",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
