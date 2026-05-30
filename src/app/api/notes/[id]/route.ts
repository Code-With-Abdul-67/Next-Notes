import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

// PUT /api/notes/[id] - Update a note's properties (title, content, isPinned, isDeleted, isLocked)
export async function PUT(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await context.params;

  try {
    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, isPinned, isDeleted, isLocked, encryptedData, color } = body;

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title : note.title,
        content: content !== undefined ? content : note.content,
        encryptedData: encryptedData !== undefined ? encryptedData : note.encryptedData,
        color: color !== undefined ? color : note.color,
        isPinned: isPinned !== undefined ? isPinned : note.isPinned,
        isDeleted: isDeleted !== undefined ? isDeleted : note.isDeleted,
        isLocked: isLocked !== undefined ? isLocked : note.isLocked,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Permanently delete a note
export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { id } = await context.params;

  try {
    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Note deleted permanently" });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
