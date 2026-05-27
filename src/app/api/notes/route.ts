import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notes - Retrieve notes with optional filters (trash, vault, search)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(request.url);
  
  const isDeleted = searchParams.get("trash") === "true";
  const isLocked = searchParams.get("vault") === "true";
  const searchQuery = searchParams.get("search") || "";

  try {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        isDeleted,
        isLocked,
        OR: searchQuery
          ? [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ]
          : undefined,
      },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { title, content, isPinned, isLocked } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: "Note must have either a title or content" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title: title || "",
        content: content || "",
        isPinned: isPinned || false,
        isLocked: isLocked || false,
        isDeleted: false,
        userId,
      },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
