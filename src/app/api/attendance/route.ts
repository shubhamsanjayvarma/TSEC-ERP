import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest, markAttendanceSchema, validateQueryParam } from "@/lib/validations";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { checkCsrf } from "@/lib/csrf";
import { getSessionUser, unauthorizedResponse, requireRole } from "@/lib/auth-helpers";

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

    const validation = await validateRequest(request, markAttendanceSchema);
    if (!validation.success) return validation.response;
    const { subjectId, facultyId, date, records } = validation.data;

    const attendanceData = records.map((r: any) => ({
      studentId: r.studentId,
      subjectId,
      facultyId,
      date: new Date(date),
      status: r.status,
    }));

    const results = [];
    for (const data of attendanceData) {
      const record = await prisma.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            date: data.date,
          },
        },
        update: { status: data.status },
        create: data,
      });
      results.push(record);
    }

    return NextResponse.json({
      message: `Attendance marked for ${results.length} students`,
      count: results.length,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
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
    const subjectId = validateQueryParam(searchParams.get("subjectId"), "subjectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};

    // IDOR: Students can only see their own attendance
    if (session.role === "STUDENT" && session.studentId) {
      where.studentId = session.studentId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (subjectId) where.subjectId = subjectId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: "desc" },
      take: 500,
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return NextResponse.json({
      records,
      summary: { total, present, absent: total - present, percentage },
    });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
