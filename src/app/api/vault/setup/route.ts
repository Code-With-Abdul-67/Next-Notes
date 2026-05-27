import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationCode } from "@/lib/mail";
import { randomInt } from "crypto";

// Simple in-memory store for verification codes (userId -> {code, expiresAt})
const verificationStore: Record<string, { code: string; expiresAt: number }> = {};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { password, verificationCode } = await request.json();

    // First step: if no verificationCode provided, generate and email it
    if (!verificationCode) {
      const code = String(randomInt(100000, 999999)); // 6‑digit code
      const email = (session.user as any).email;
      await sendVerificationCode(email, code);
      verificationStore[userId] = { code, expiresAt: Date.now() + 60_000 }; // 60 s
      return NextResponse.json({ message: "Verification code sent" });
    }

    // Verify code
    const stored = verificationStore[userId];
    if (!stored || stored.code !== verificationCode || stored.expiresAt < Date.now()) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }
    // Code valid – proceed to set vault password
    if (!password || password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { vaultPassword: hashedPassword },
    });

    // Cleanup verification entry
    delete verificationStore[userId];
    return NextResponse.json({ message: "Vault password set successfully" });
  } catch (error) {
    console.error("Vault setup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
