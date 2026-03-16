import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, uploadMarksSchema, validateQueryParam } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { canFacultyManageAssignedSubject } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";

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
        action: "MARKS_UPLOAD",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const validation = await validateRequest(request, uploadMarksSchema);
    if (!validation.success) return validation.response;
    const { examId, marks } = validation.data;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      logAuditEvent({
        action: "MARKS_UPLOAD",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        targetType: "EXAM",
        targetId: examId,
        details: { reason: "exam_not_found" },
      });
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Faculty can only upload marks for subjects assigned to them.
    if (session.role === "FACULTY") {
      const assignment = await prisma.subjectAssignment.findUnique({
        where: {
          facultyId_subjectId: {
            facultyId: session.facultyId!,
            subjectId: exam.subjectId,
          },
        },
      });
      if (!assignment || !canFacultyManageAssignedSubject(session.facultyId, [assignment.facultyId])) {
        logAuditEvent({
          action: "MARKS_UPLOAD",
          outcome: "FAILURE",
          actorId: session.userId,
          actorRole: session.role,
          targetType: "SUBJECT",
          targetId: exam.subjectId,
          details: { reason: "subject_not_assigned" },
        });
        return NextResponse.json(
          { error: "You are not assigned to this subject" },
          { status: 403 }
        );
      }
    }

    const results = [];
    for (const m of marks) {
      // Validate marks don't exceed maximum
      if (m.marksObtained > exam.maxMarks) {
        logAuditEvent({
          action: "MARKS_UPLOAD",
          outcome: "FAILURE",
          actorId: session.userId,
          actorRole: session.role,
          targetType: "EXAM",
          targetId: examId,
          details: { reason: "marks_exceed_max", studentId: m.studentId },
        });
        return NextResponse.json(
          { error: `Marks ${m.marksObtained} exceed maximum ${exam.maxMarks} for student ${m.studentId}` },
          { status: 400 }
        );
      }

      const percentage = (m.marksObtained / exam.maxMarks) * 100;
      let grade = "F";
      if (percentage >= 90) grade = "O";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B";
      else if (percentage >= 60) grade = "C";
      else if (percentage >= 50) grade = "D";
      else if (percentage >= 40) grade = "E";

      const record = await prisma.mark.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: m.studentId,
          },
        },
        update: { marksObtained: m.marksObtained, grade },
        create: {
          examId,
          studentId: m.studentId,
          marksObtained: m.marksObtained,
          grade,
        },
      });
      results.push(record);
    }

    logAuditEvent({
      action: "MARKS_UPLOAD",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "EXAM",
      targetId: examId,
      details: { count: results.length },
    });

    return NextResponse.json({
      message: `Marks uploaded for ${results.length} students`,
      count: results.length,
    });
  } catch (error) {
    logAuditEvent({
      action: "MARKS_UPLOAD",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    console.error("Marks upload error:", error);
    return NextResponse.json({ error: "Failed to upload marks" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const studentId = validateQueryParam(searchParams.get("studentId"), "studentId");
    const examId = validateQueryParam(searchParams.get("examId"), "examId");

    const where: any = {};

    // IDOR: Students can only see their own marks
    if (session.role === "STUDENT" && session.studentId) {
      where.studentId = session.studentId;
    } else if (session.role === "FACULTY" && session.facultyId) {
      where.exam = {
        subject: {
          assignments: {
            some: { facultyId: session.facultyId },
          },
        },
      };
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (examId) where.examId = examId;

    const marks = await prisma.mark.findMany({
      where,
      include: {
        exam: {
          include: { subject: { select: { name: true, code: true } } },
        },
        student: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(marks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}
