import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;

export async function PUT(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    const note = await prisma.note.findUnique({ where: { id } });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await request.json();
    const { isPinned, isDeleted, isLocked, encryptedData } = body;

    // Sanitize string fields
    const title = typeof body.title === "string"
      ? body.title.slice(0, MAX_TITLE_LENGTH)
      : note.title;
    const content = typeof body.content === "string"
      ? body.content.slice(0, MAX_CONTENT_LENGTH)
      : note.content;

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: body.title !== undefined ? title : note.title,
        content: body.content !== undefined ? content : note.content,
        encryptedData: encryptedData !== undefined
          ? (typeof encryptedData === "string" ? encryptedData : null)
          : note.encryptedData,
        isPinned: isPinned !== undefined ? isPinned === true : note.isPinned,
        isDeleted: isDeleted !== undefined ? isDeleted === true : note.isDeleted,
        isLocked: isLocked !== undefined ? isLocked === true : note.isLocked,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    const note = await prisma.note.findUnique({ where: { id } });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Security: only allow permanent deletion of notes already in the bin
    if (!note.isDeleted) {
      return NextResponse.json({ error: "Note must be in the recycle bin before permanent deletion" }, { status: 403 });
    }

    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ message: "Note deleted permanently" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
