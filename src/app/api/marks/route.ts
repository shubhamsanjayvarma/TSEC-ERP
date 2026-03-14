import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { examId, marks } = body;
    // marks = [{ studentId, marksObtained }]

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const results = [];
    for (const m of marks) {
      const percentage = (m.marksObtained / exam.maxMarks) * 100;
      let grade = "F";
      if (percentage >= 90) grade = "O";
      else if (percentage >= 80) grade = "A";
      else if (percentage >= 70) grade = "B";
      else if (percentage >= 60) grade = "C";
      else if (percentage >= 50) grade = "D";
      else if (percentage >= 40) grade = "E";

      const record = await prisma.mark.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId: m.studentId,
          },
        },
        update: { marksObtained: m.marksObtained, grade },
        create: {
          examId,
          studentId: m.studentId,
          marksObtained: m.marksObtained,
          grade,
        },
      });
      results.push(record);
    }

    return NextResponse.json({
      message: `Marks uploaded for ${results.length} students`,
      count: results.length,
    });
  } catch (error) {
    console.error("Marks upload error:", error);
    return NextResponse.json({ error: "Failed to upload marks" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const examId = searchParams.get("examId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (examId) where.examId = examId;

    const marks = await prisma.mark.findMany({
      where,
      include: {
        exam: {
          include: { subject: { select: { name: true, code: true } } },
        },
        student: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(marks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}
