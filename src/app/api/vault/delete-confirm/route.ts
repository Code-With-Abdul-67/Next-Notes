import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const userId = (session.user as any).id;

  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Invalid arguments. Code is required." }, { status: 400 });
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

    // Check expiration (60s limit)
    if (new Date() > verificationRecord.expiresAt) {
      return NextResponse.json({ error: "Verification code has expired (60s limit)" }, { status: 400 });
    }

    // Deletion is authorized
    await prisma.$transaction([
      // Delete all locked notes for this user
      prisma.note.deleteMany({
        where: { userId, isLocked: true },
      }),
      // Remove vault password
      prisma.user.update({
        where: { id: userId },
        data: { vaultPassword: null },
      }),
      // Delete verification code
      prisma.verificationCode.delete({
        where: { email },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Vault deleted successfully" });
  } catch (error) {
    console.error("Vault delete confirmation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
