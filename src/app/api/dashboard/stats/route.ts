import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth-helpers";
import { canRoleAccessDashboardStats } from "@/lib/authz";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, "query");
    if (!rl.allowed) return rateLimitResponse(rl.resetIn);

    const session = await getSessionUser(request);
    if (!session) return unauthorizedResponse();
    if (!canRoleAccessDashboardStats(session.role)) {
      logAuditEvent({
        action: "DASHBOARD_STATS_READ",
        outcome: "FAILURE",
        actorId: session.userId,
        actorRole: session.role,
        details: { reason: "forbidden_role" },
      });
      return forbiddenResponse("Students are not authorized to access aggregate dashboard statistics");
    }

    const [totalStudents, totalFaculty, totalDepartments, totalSubjects, recentNotices] =
      await Promise.all([
        prisma.student.count(),
        prisma.faculty.count(),
        prisma.department.count(),
        prisma.subject.count(),
        prisma.notice.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, createdAt: true, priority: true },
        }),
      ]);

    const attendanceRecords = await prisma.attendance.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const totalRecords = attendanceRecords.reduce((acc, r) => acc + r._count.status, 0);
    const presentRecords =
      attendanceRecords.find((r) => r.status === "PRESENT")?._count.status ?? 0;
    const averageAttendance =
      totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalSubjects,
      averageAttendance,
      recentNotices,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
