import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.vaultPassword) {
      return NextResponse.json({ error: "Vault not set up", notInitialized: true }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.vaultPassword);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect master password" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "Vault unlocked successfully" });
  } catch (error) {
    console.error("Vault verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
