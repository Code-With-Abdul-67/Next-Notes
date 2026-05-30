import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Drop all locked notes and reset the vault password block
    await prisma.$transaction([
      prisma.note.deleteMany({
        where: { 
          userId: userId, 
          isLocked: true 
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { vaultPassword: null },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Vault deleted completely" });
  } catch (error) {
    console.error("Database deletion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}