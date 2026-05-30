import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { password } = await request.json();

    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { vaultPassword: hashedPassword },
    });

    return NextResponse.json({ message: "Vault password set successfully" });
  } catch (error) {
    console.error("Vault setup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
