import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const department = searchParams.get("department") || "";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, rollNumber, departmentId, batch, semester } = body;

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
