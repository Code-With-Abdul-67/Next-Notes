import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { sendAccountDeletionEmail } from "@/backend/lib/email";

const deleteCooldown = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  const lastRequest = deleteCooldown.get(email);
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
    // 60-second expiry — tight window for account deletion
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await prisma.verificationCode.upsert({
      where: { email },
      update: { code, expiresAt, createdAt: new Date() },
      create: { email, code, expiresAt },
    });

    await sendAccountDeletionEmail(email, code);
    deleteCooldown.set(email, now);

    return NextResponse.json({ message: "Deletion code sent to your email" });
  } catch (error: unknown) {
    console.error("Account delete request error:", error);
    const message =
      process.env.NODE_ENV === "development"
        ? `Email error: ${(error as Error).message || "Unknown"}`
        : "Failed to send deletion code. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
