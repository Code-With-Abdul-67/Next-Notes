import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { sendVaultResetEmail } from "@/backend/lib/email";

// Simple in-memory cooldown: email -> lastRequestAt timestamp
const resetCooldown = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 1 minute between requests

export async function POST(_request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  // Rate limit: one reset email per minute per account
  const lastRequest = resetCooldown.get(email);
  const now = Date.now();
  if (lastRequest && now - lastRequest < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${retryAfter}s before requesting another code.` },
      { status: 429 }
    );
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationCode.upsert({
      where: { email },
      update: { code, expiresAt, createdAt: new Date() },
      create: { email, code, expiresAt },
    });

    await sendVaultResetEmail(email, code);

    // Record the successful send time
    resetCooldown.set(email, now);

    return NextResponse.json({ message: "Verification code sent to your email" });
  } catch (error: unknown) {
    console.error("Vault reset request error:", error);
    // Surface the real error message in development for easier debugging
    const message = process.env.NODE_ENV === "development"
      ? `Email error: ${(error as Error).message || "Unknown error"}`
      : "Failed to send reset email. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
