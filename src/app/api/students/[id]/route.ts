import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, updateStudentSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

export async function PUT(
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
        action: "STUDENT_UPDATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const { id } = await params;

    // Validate input
    const validation = await validateRequest(request, updateStudentSchema);
    if (!validation.success) return validation.response;
    const { name, email, rollNumber, departmentId, batch, semester, status } = validation.data;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      logAuditEvent({
        action: "STUDENT_UPDATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        targetType: "STUDENT",
        targetId: id,
        details: { reason: "student_not_found" },
      });
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update user and student
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(status && { status }),
      },
    });

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(rollNumber && { rollNumber }),
        ...(departmentId && { departmentId }),
        ...(batch && { batch }),
        ...(semester && { semester }),
      },
      include: {
        user: { select: { name: true, email: true, status: true } },
        department: { select: { name: true, code: true } },
      },
    });

    logAuditEvent({
      action: "STUDENT_UPDATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "STUDENT",
      targetId: id,
      details: { status: updated.user.status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    logAuditEvent({
      action: "STUDENT_UPDATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email or roll number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

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
        action: "STUDENT_DELETE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      logAuditEvent({
        action: "STUDENT_DELETE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        targetType: "STUDENT",
        targetId: id,
        details: { reason: "student_not_found" },
      });
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: student.userId } });
    logAuditEvent({
      action: "STUDENT_DELETE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "STUDENT",
      targetId: id,
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    logAuditEvent({
      action: "STUDENT_DELETE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
