import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await prisma.verificationCode.upsert({
      where: { email },
      update: { code, expiresAt, createdAt: new Date() },
      create: { email, code, expiresAt },
    });

    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Vault reset request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
