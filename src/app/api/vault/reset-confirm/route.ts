import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const userId = (session.user as { id: string }).id as string;

  try {
    const body = await request.json();
    const { code, newPassword } = body;

    if (!code || typeof code !== "string" || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
    }

    const verificationRecord = await prisma.verificationCode.findUnique({ where: { email } });

    if (!verificationRecord) {
      return NextResponse.json({ error: "No verification code requested." }, { status: 400 });
    }

    // Check expiry BEFORE comparing the code to avoid leaking whether the code is correct
    if (new Date() > verificationRecord.expiresAt) {
      await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Constant-time comparison to prevent timing attacks.
    // Both codes are 6-digit strings; pad to a fixed 64-byte hex representation so
    // timingSafeEqual never throws due to mismatched buffer lengths.
    const normalize = (s: string) => Buffer.from(s.slice(0, 64).padEnd(64, "\0"), "utf8");
    const storedBuf = normalize(verificationRecord.code);
    const inputBuf  = normalize(code);
    const codeMatch = timingSafeEqual(storedBuf, inputBuf);

    if (!codeMatch) {
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.note.deleteMany({ where: { userId, isLocked: true } }),
      prisma.user.update({ where: { id: userId }, data: { vaultPassword: hashedPassword } }),
      prisma.verificationCode.delete({ where: { email } }),
    ]);

    return NextResponse.json({ success: true, message: "Vault password reset successfully" });
  } catch (error) {
    console.error("Vault reset confirmation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
