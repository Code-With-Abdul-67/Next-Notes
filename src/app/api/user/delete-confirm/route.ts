import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const record = await prisma.verificationCode.findUnique({ where: { email } });

    if (!record) {
      return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
    }

    // Constant-time comparison
    const normalize = (s: string) => Buffer.from(s.slice(0, 64).padEnd(64, "\0"), "utf8");
    const codeMatch = timingSafeEqual(normalize(record.code), normalize(code));

    if (!codeMatch) {
      return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
    }

    // Delete the verification code first, then cascade-delete the user
    // (User deletion cascades to all notes, todos, vault via Prisma schema)
    await prisma.verificationCode.delete({ where: { email } }).catch(() => {});
    await prisma.user.delete({ where: { email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account delete confirm error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
