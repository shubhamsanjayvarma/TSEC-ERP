import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createClassListSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";
import { logAuditEvent } from "@/lib/audit";

// GET — Faculty gets their own lists, Admin gets all
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const roleError = requireRole(session, "ADMIN", "FACULTY");
    if (roleError) return roleError;

    const where: any = {};
    if (session.role === "FACULTY" && session.facultyId) {
      where.facultyId = session.facultyId;
    }

    const classLists = await prisma.classList.findMany({
      where,
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
        },
        faculty: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(classLists);
  } catch (error) {
    console.error("Class lists GET error:", error);
    return NextResponse.json({ error: "Failed to fetch class lists" }, { status: 500 });
  }
}

// POST — Create a new class list
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
        action: "CLASS_LIST_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    if (!session.facultyId) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 400 });
    }

    const validation = await validateRequest(request, createClassListSchema);
    if (!validation.success) return validation.response;
    const { name, description, subjectId, studentIds } = validation.data;

    const classList = await prisma.classList.create({
      data: {
        name,
        description,
        subjectId: subjectId || null,
        facultyId: session.facultyId,
        students: {
          create: studentIds.map((sid: string) => ({ studentId: sid })),
        },
      },
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
      action: "CLASS_LIST_CREATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "CLASS_LIST",
      targetId: classList.id,
      details: { name, studentCount: studentIds.length },
    });

    return NextResponse.json(classList, { status: 201 });
  } catch (error) {
    logAuditEvent({
      action: "CLASS_LIST_CREATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    console.error("Class list create error:", error);
    return NextResponse.json({ error: "Failed to create class list" }, { status: 500 });
  }
}
