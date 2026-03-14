import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, priority, targetRole } = body;

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || "normal",
        targetRole: targetRole || null,
        createdBy: "admin",
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
