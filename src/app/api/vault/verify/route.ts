import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";

// Simple in-memory rate limiter: userId -> { count, resetAt }
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Rate limiting
    const now = Date.now();
    const record = attempts.get(userId);
    if (record) {
      if (now < record.resetAt && record.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        return NextResponse.json(
          { error: `Too many attempts. Try again in ${retryAfter}s.` },
          { status: 429 }
        );
      }
      if (now >= record.resetAt) {
        attempts.delete(userId);
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.vaultPassword) {
      return NextResponse.json({ error: "Vault not set up", notInitialized: true }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.vaultPassword);

    if (!isMatch) {
      // Track failed attempt
      const cur = attempts.get(userId);
      if (cur && now < cur.resetAt) {
        cur.count++;
      } else {
        attempts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
      }
      return NextResponse.json({ error: "Incorrect master password" }, { status: 401 });
    }

    // Success — clear failed attempts
    attempts.delete(userId);
    return NextResponse.json({ success: true, message: "Vault unlocked successfully" });
  } catch (error) {
    console.error("Vault verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
