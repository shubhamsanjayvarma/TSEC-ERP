import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createDepartmentSchema } from "@/lib/validations";
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

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
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
        action: "DEPARTMENT_CREATE",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return roleError;
    }

    const validation = await validateRequest(request, createDepartmentSchema);
    if (!validation.success) return validation.response;

    const department = await prisma.department.create({
      data: { name: validation.data.name, code: validation.data.code },
    });
    logAuditEvent({
      action: "DEPARTMENT_CREATE",
      outcome: "SUCCESS",
      actorId: session.userId,
      actorRole: session.role,
      targetType: "DEPARTMENT",
      targetId: department.id,
      details: { code: department.code },
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    logAuditEvent({
      action: "DEPARTMENT_CREATE",
      outcome: "FAILURE",
      details: { reason: "server_error" },
    });
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Department already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
