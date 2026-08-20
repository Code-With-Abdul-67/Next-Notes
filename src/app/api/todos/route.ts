import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const todos = await prisma.todo.findMany({
      where: { userId, isDeleted: false },
      orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    const body = await request.json();
    const { title, description, priority, dueDate, tags } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    const safePriority = validPriorities.includes(priority) ? priority : "medium";

    const todo = await prisma.todo.create({
      data: {
        title: title.trim().slice(0, 300),
        description: typeof description === "string" ? description.trim().slice(0, 2000) : null,
        priority: safePriority,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: typeof tags === "string" ? tags.trim().slice(0, 200) : "",
        isCompleted: false,
        userId,
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const clearCompleted = searchParams.get("completed") === "true";

  try {
    if (clearCompleted) {
      await prisma.todo.deleteMany({
        where: { userId, isCompleted: true },
      });
      return NextResponse.json({ success: true, message: "Completed todos cleared" });
    }

    return NextResponse.json({ error: "Invalid delete operation" }, { status: 400 });
  } catch (error) {
    console.error("Error clearing todos:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
