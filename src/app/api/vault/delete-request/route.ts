import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/mail";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration after 60 seconds (1 minute timeout as requested)
    const expiresAt = new Date(Date.now() + 60 * 1000);

    // Upsert verification code for this email
    await prisma.verificationCode.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
      },
    });

    // Send code to user's registered email
    const mailResult = await sendVerificationCode(
      email, 
      code, 
      "Vault Deletion", 
      "You requested to permanently delete your Next Notes Secret Vault and all locked notes."
    );

    return NextResponse.json({ 
      success: true, 
      warning: !mailResult.success ? mailResult.error : undefined,
      message: mailResult.success 
        ? "Verification code sent to your email" 
        : `Verification code generated. (Dev Mode: check terminal console logs for code)`
    });
  } catch (error) {
    console.error("Vault delete request error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
