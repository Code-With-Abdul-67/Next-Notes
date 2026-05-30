import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

// DELETE /api/notes/empty-bin — permanently delete all trashed notes for the user
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const result = await prisma.note.deleteMany({
      where: { userId, isDeleted: true },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error: any) {
    console.error("Error emptying bin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
