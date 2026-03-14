import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, rollNumber, departmentId, batch, semester, status } = body;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update user and student
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(status && { status }),
      },
    });

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(rollNumber && { rollNumber }),
        ...(departmentId && { departmentId }),
        ...(batch && { batch }),
        ...(semester && { semester }),
      },
      include: {
        user: { select: { name: true, email: true, status: true } },
        department: { select: { name: true, code: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email or roll number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete user (cascades to student)
    await prisma.user.delete({ where: { id: student.userId } });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
