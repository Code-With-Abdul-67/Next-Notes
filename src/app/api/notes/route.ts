import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { searchParams } = new URL(request.url);

  const isDeleted = searchParams.get("trash") === "true";
  const isLocked = searchParams.get("vault") === "true";
  const rawSearch = searchParams.get("search") || "";
  // Sanitize: trim and cap search length
  const searchQuery = rawSearch.trim().slice(0, 200);

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
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const body = await request.json();
    const { isPinned, isLocked, encryptedData } = body;

    // Sanitize and validate
    const title = typeof body.title === "string" ? body.title.slice(0, MAX_TITLE_LENGTH) : "";
    const content = typeof body.content === "string" ? body.content.slice(0, MAX_CONTENT_LENGTH) : "";

    if (!title && !content && !encryptedData) {
      return NextResponse.json({ error: "Note must have either a title or content" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        encryptedData: typeof encryptedData === "string" ? encryptedData : null,
        isPinned: isPinned === true,
        isLocked: isLocked === true,
        isDeleted: false,
        userId,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
