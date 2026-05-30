import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const userId = (session.user as any).id;

  try {
    const { code, newPassword } = await request.json();
    if (!code || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "Invalid arguments. Password must be at least 4 characters." }, { status: 400 });
    }

    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { email },
    });

    if (!verificationRecord) {
      return NextResponse.json({ error: "No verification code requested" }, { status: 400 });
    }

    // Verify code
    if (verificationRecord.code !== code) {
      return NextResponse.json({ error: "Incorrect verification code" }, { status: 400 });
    }

    // Check expiration (5 minute limit)
    if (new Date() > verificationRecord.expiresAt) {
      return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Password reset is authorized
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // All vault notes encrypted with the old password are now unreadable.
    // Delete them to prevent orphaned, undecryptable data.
    await prisma.$transaction([
      prisma.note.deleteMany({
        where: { userId, isLocked: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { vaultPassword: hashedPassword },
      }),
      prisma.verificationCode.delete({
        where: { email },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Vault password reset successfully" });
  } catch (error) {
    console.error("Vault reset confirmation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
