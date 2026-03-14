import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, date, maxMarks, subjectId } = body;

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
