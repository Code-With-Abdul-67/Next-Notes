import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function POST(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id } = await context.params;

  try {
    const note = await prisma.note.findUnique({ where: { id } });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Never duplicate vault notes — encrypted data is tied to the original
    if (note.isLocked) {
      return NextResponse.json({ error: "Vault notes cannot be duplicated" }, { status: 403 });
    }

    const duplicate = await prisma.note.create({
      data: {
        title: note.title ? `${note.title} (copy)` : "",
        content: note.content,
        encryptedData: null,
        isPinned: false,
        isLocked: false,
        isDeleted: false,
        userId,
      },
    });

    return NextResponse.json(duplicate);
  } catch (error) {
    console.error("Error duplicating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
