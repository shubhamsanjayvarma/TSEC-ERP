import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, createExamSchema, validateQueryParam } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";

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

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject: { select: { name: true, code: true } },
        marks: {
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
    if (roleError) return roleError;

    const validation = await validateRequest(request, createExamSchema);
    if (!validation.success) return validation.response;
    const { name, type, date, maxMarks, subjectId } = validation.data;

    const exam = await prisma.exam.create({
      data: {
        name,
        type,
        date: new Date(date),
        maxMarks: maxMarks || 100,
        subjectId,
      },
      include: { subject: { select: { name: true, code: true } } },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
