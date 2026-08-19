import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      themeConfig: true,
      vaultPassword: true,
    },
  });


  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    hasVaultPassword: !!user.vaultPassword,
    themeConfig: user.themeConfig ? JSON.parse(user.themeConfig) : null,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, themeConfig } = body;

    const updateData: { name?: string; themeConfig?: string | null } = {};

    if (typeof name === "string") {
      updateData.name = name.trim().slice(0, 100);
    }

    if (themeConfig !== undefined) {
      updateData.themeConfig = typeof themeConfig === "object" && themeConfig !== null ? JSON.stringify(themeConfig) : null;
    }


    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        themeConfig: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      themeConfig: updated.themeConfig ? JSON.parse(updated.themeConfig) : null,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json({ error: "Failed to update profile settings" }, { status: 500 });
  }
}
