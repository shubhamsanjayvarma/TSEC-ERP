import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createExamSchema, validateQueryParam } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { canFacultyManageAssignedSubject } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const subjectId = validateQueryParam(searchParams.get("subjectId"), "subjectId");

    const where: any = {};
    if (subjectId) where.subjectId = subjectId;
    if (session.role === "FACULTY" && session.facultyId) {
      where.subject = {
        assignments: {
          some: { facultyId: session.facultyId },
        },
      };
    }
    if (session.role === "STUDENT" && session.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: session.studentId },
        select: { departmentId: true, id: true },
      });
      if (!student) {
        return NextResponse.json([], { status: 200 });
      }
      where.subject = { departmentId: student.departmentId };
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: { select: { name: true, code: true } },
        marks: {
          where: session.role === "STUDENT" && session.studentId ? { studentId: session.studentId } : undefined,
          include: {
            student: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
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
        action: "EXAM_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const validation = await validateRequest(request, createExamSchema);
    if (!validation.success) return validation.response;
    const { name, type, date, maxMarks, subjectId } = validation.data;

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      logAuditEvent({
        action: "EXAM_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "invalid_date", date },
      });
      return NextResponse.json({ error: "Invalid exam date" }, { status: 400 });
    }

    if (session.role === "FACULTY") {
      const assignment = await prisma.subjectAssignment.findUnique({
        where: {
          facultyId_subjectId: {
            facultyId: session.facultyId!,
            subjectId,
          },
        },
      });
      if (!assignment || !canFacultyManageAssignedSubject(session.facultyId, [assignment.facultyId])) {
        logAuditEvent({
          action: "EXAM_CREATE",
          outcome: "FAILURE",
          actorId: session.userId,
          actorRole: session.role,
          targetType: "SUBJECT",
          targetId: subjectId,
          details: { reason: "subject_not_assigned" },
        });
        return NextResponse.json(
          { error: "You are not assigned to this subject" },
          { status: 403 }
        );
      }
    }

    const exam = await prisma.exam.create({
      data: {
        name,
        type,
        date: parsedDate,
        maxMarks: maxMarks || 100,
        subjectId,
      },
      include: { subject: { select: { name: true, code: true } } },
    });

    logAuditEvent({
      action: "EXAM_CREATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "EXAM",
      targetId: exam.id,
      details: { subjectId },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    logAuditEvent({
      action: "EXAM_CREATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
