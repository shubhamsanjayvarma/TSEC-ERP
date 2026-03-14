import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      include: { department: { select: { name: true } } },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}
