import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: faculty.userId } });

    return NextResponse.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete faculty" }, { status: 500 });
  }
}
