import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;
const VALID_COLORS = new Set(["red", "orange", "yellow", "green", "blue", "purple", "pink"]);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id as string;
  const { searchParams } = new URL(request.url);

  const isDeleted = searchParams.get("trash") === "true";
  const isLocked = searchParams.get("vault") === "true";
  const rawSearch = searchParams.get("search") || "";
  const searchQuery = rawSearch.trim().slice(0, 200);
  const tagFilter = searchParams.get("tag") || "";

  try {
    // Auto-purge bin notes older than 30 days (non-fatal)
    if (isDeleted) {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.note.deleteMany({
        where: { userId, isDeleted: true, updatedAt: { lt: cutoff } },
      }).catch(() => {});
    }

    const notes = await prisma.note.findMany({
      where: {
        userId,
        isDeleted,
        isLocked,
        AND: [
          // Text search (skipped for vault — content is encrypted)
          searchQuery && !isLocked
            ? {
                OR: [
                  { title: { contains: searchQuery, mode: "insensitive" } },
                  { content: { contains: searchQuery, mode: "insensitive" } },
                ],
              }
            : {},
          // Tag filter
          tagFilter
            ? { tags: { contains: tagFilter, mode: "insensitive" } }
            : {},
        ],
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

  const userId = (session.user as { id: string }).id as string;

  try {
    const body = await request.json();
    const { isPinned, isLocked, encryptedData } = body;

    const title = typeof body.title === "string" ? body.title.slice(0, MAX_TITLE_LENGTH) : "";
    const content = typeof body.content === "string" ? body.content.slice(0, MAX_CONTENT_LENGTH) : "";
    const color = typeof body.color === "string" && VALID_COLORS.has(body.color) ? body.color : null;
    const tags = typeof body.tags === "string" ? body.tags.slice(0, 500) : "";

    if (!title && !content && !encryptedData) {
      return NextResponse.json({ error: "Note must have either a title or content" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        encryptedData: typeof encryptedData === "string" ? encryptedData : null,
        color,
        tags,
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
