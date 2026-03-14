import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ message: "Notice deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
