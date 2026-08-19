import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const existing = await prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: {
      title?: string;
      description?: string | null;
      isCompleted?: boolean;
      priority?: string;
      dueDate?: Date | null;
      tags?: string;
      order?: number;
    } = {};

    if (typeof body.title === "string") updateData.title = body.title.trim().slice(0, 300);
    if (body.description !== undefined) {
      updateData.description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : null;
    }
    if (typeof body.isCompleted === "boolean") updateData.isCompleted = body.isCompleted;
    if (typeof body.priority === "string" && ["low", "medium", "high", "urgent"].includes(body.priority)) {
      updateData.priority = body.priority;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }
    if (typeof body.tags === "string") updateData.tags = body.tags.trim().slice(0, 200);
    if (typeof body.order === "number") updateData.order = body.order;

    const updated = await prisma.todo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const existing = await prisma.todo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
