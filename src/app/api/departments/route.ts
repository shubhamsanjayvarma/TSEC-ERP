import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const department = await prisma.department.create({
      data: { name: body.name, code: body.code },
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Department already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
