import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
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

    // Calculate average attendance
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
