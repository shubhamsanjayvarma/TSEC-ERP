import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createStudentSchema, validatePaginationParams, validateQueryParam } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    // Auth check (IDOR: scoped access)
    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const { page, limit } = validatePaginationParams(searchParams);
    const search = validateQueryParam(searchParams.get("search"), "search") || "";
    const department = validateQueryParam(searchParams.get("department"), "department") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { rollNumber: { contains: search } },
      ];
    }
    if (department) {
      where.departmentId = department;
    }

    // IDOR: Students can only see their own record
    if (session.role === "STUDENT" && session.studentId) {
      where.id = session.studentId;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, status: true } },
          department: { select: { name: true, code: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rollNumber: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Students API error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSRF check
    const csrfError = checkCsrf(request);
    if (csrfError) return csrfError;

    // Rate limit
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "mutation");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    // Auth + Role check (only ADMIN can create students)
    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();
    const roleError = requireRole(session, "ADMIN");
    if (roleError) return roleError;

    // Validate input
    const validation = await validateRequest(request, createStudentSchema);
    if (!validation.success) return validation.response;
    const { name, email, password, rollNumber, departmentId, batch, semester } = validation.data;

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password || "student123", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            rollNumber,
            departmentId,
            batch: batch || "2024",
            semester: semester || 1,
          },
        },
      },
      include: {
        student: { include: { department: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Create student error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or roll number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
