import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { employeeId: { contains: search } },
      ];
    }
    if (department) {
      where.departmentId = department;
    }

    const faculty = await prisma.faculty.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, status: true } },
        department: { select: { name: true, code: true } },
        subjects: {
          include: { subject: { select: { name: true, code: true } } },
        },
      },
      orderBy: { employeeId: "asc" },
    });

    return NextResponse.json(faculty);
  } catch (error) {
    console.error("Faculty API error:", error);
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, employeeId, departmentId, designation } = body;

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password || "faculty123", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "FACULTY",
        faculty: {
          create: {
            employeeId,
            departmentId,
            designation: designation || "Assistant Professor",
          },
        },
      },
      include: {
        faculty: { include: { department: true } },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or Employee ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
