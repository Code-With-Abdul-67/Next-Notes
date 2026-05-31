import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

/**
 * GET /api/vault/status
 * Returns whether the authenticated user has a vault password set up.
 * Does NOT touch the rate limiter — safe to call on every page load.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vaultPassword: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ hasVaultPassword: user.vaultPassword !== null });
  } catch (error) {
    console.error("Vault status error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
