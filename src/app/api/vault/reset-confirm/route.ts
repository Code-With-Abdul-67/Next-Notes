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
  const userId = (session.user as any).id as string;

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

    // Constant-time comparison to prevent timing attacks
    const storedBuf = Buffer.from(verificationRecord.code.padEnd(64));
    const inputBuf = Buffer.from(code.padEnd(64));
    const codeMatch = storedBuf.length === inputBuf.length && timingSafeEqual(storedBuf, inputBuf);

    if (!codeMatch) {
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 400 });
    }

    if (new Date() > verificationRecord.expiresAt) {
      await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
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
