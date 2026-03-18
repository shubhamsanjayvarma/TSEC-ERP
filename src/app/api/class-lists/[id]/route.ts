import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, updateClassListSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

// GET single class list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const classList = await prisma.classList.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true, code: true } },
        students: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                department: { select: { code: true } },
              },
            },
          },
          orderBy: { student: { rollNumber: "asc" } },
        },
      },
    });

    if (!classList) {
      return NextResponse.json({ error: "Class list not found" }, { status: 404 });
    }

    // Faculty can only see their own lists
    if (session.role === "FACULTY" && classList.facultyId !== session.facultyId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json(classList);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch class list" }, { status: 500 });
  }
}

// PUT — Update class list
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const roleError = requireRole(session, "ADMIN", "FACULTY");
    if (roleError) return roleError;

    const existing = await prisma.classList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Class list not found" }, { status: 404 });
    }
    if (session.role === "FACULTY" && existing.facultyId !== session.facultyId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const validation = await validateRequest(request, updateClassListSchema);
    if (!validation.success) return validation.response;
    const { name, description, subjectId, studentIds } = validation.data;

    // Update basic fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subjectId !== undefined) updateData.subjectId = subjectId;

    // If studentIds provided, replace them all
    if (studentIds && studentIds.length > 0) {
      await prisma.classListStudent.deleteMany({ where: { classListId: id } });
      await prisma.classListStudent.createMany({
        data: studentIds.map((sid: string) => ({ classListId: id, studentId: sid })),
      });
    }

    const updated = await prisma.classList.update({
      where: { id },
      data: updateData,
      include: {
        students: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
                department: { select: { code: true } },
              },
            },
          },
        },
        subject: { select: { name: true, code: true } },
      },
    });

    logAuditEvent({
      action: "CLASS_LIST_UPDATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "CLASS_LIST",
      targetId: id,
      details: { name: updated.name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update class list" }, { status: 500 });
  }
}

// DELETE — Delete class list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const roleError = requireRole(session, "ADMIN", "FACULTY");
    if (roleError) return roleError;

    const existing = await prisma.classList.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Class list not found" }, { status: 404 });
    }
    if (session.role === "FACULTY" && existing.facultyId !== session.facultyId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.classList.delete({ where: { id } });

    logAuditEvent({
      action: "CLASS_LIST_DELETE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "CLASS_LIST",
      targetId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ message: "Class list deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class list" }, { status: 500 });
  }
}
