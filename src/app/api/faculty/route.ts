import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createFacultySchema, validateQueryParam } from "@/lib/validations";
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

    const { searchParams } = new URL(request.url);
    const search = validateQueryParam(searchParams.get("search"), "search") || "";
    const department = validateQueryParam(searchParams.get("department"), "department") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { employeeId: { contains: search } },
      ];
    }
    if (department) {
      where.departmentId = department;
    }

    // IDOR: Faculty can only see their own record if not admin
    if (session.role === "FACULTY" && session.facultyId) {
      where.id = session.facultyId;
    }

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, status: true } },
        department: { select: { name: true, code: true } },
        subjects: {
          include: { subject: { select: { name: true, code: true } } },
        },
      },
      orderBy: { employeeId: "asc" },
    });

    return NextResponse.json(faculty);
  } catch (error) {
    console.error("Faculty API error:", error);
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
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
    const roleError = requireRole(session, "ADMIN");
    if (roleError) {
      logAuditEvent({
        action: "FACULTY_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const validation = await validateRequest(request, createFacultySchema);
    if (!validation.success) return validation.response;
    const { name, email, password, employeeId, departmentId, designation } = validation.data;

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "FACULTY",
        faculty: {
          create: {
            employeeId,
            departmentId,
            designation: designation || "Assistant Professor",
          },
        },
      },
      include: {
        faculty: { include: { department: true } },
      },
    });

    logAuditEvent({
      action: "FACULTY_CREATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "FACULTY",
      targetId: user.faculty?.id,
      details: { email },
    });

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logAuditEvent({
      action: "FACULTY_CREATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or Employee ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
