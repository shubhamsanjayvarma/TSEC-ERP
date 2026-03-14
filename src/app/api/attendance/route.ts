import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subjectId, facultyId, date, records } = body;

    // records = [{ studentId, status }]
    const attendanceData = records.map((r: any) => ({
      studentId: r.studentId,
      subjectId,
      facultyId,
      date: new Date(date),
      status: r.status,
    }));

    // Upsert attendance (update if exists for the same date/subject/student)
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};
    if (studentId) where.studentId = studentId;
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

    // Calculate summary
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
