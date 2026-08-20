import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

// One-time migration — adds isDeleted column to Todo table.
export async function GET() {
  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;`
    );
    results.push("✓ isDeleted column added to Todo");
  } catch (e) {
    results.push(`✗ isDeleted: ${e}`);
  }

  return NextResponse.json({ success: true, results });
}
