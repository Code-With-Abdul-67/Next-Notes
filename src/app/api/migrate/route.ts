import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/prisma";

// One-time migration endpoint — adds missing columns to production DB.
// Protected by a secret token so only you can call it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Add themeConfig column to User if missing
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themeConfig" TEXT;`
    );
    results.push("✓ themeConfig column added to User");
  } catch (e) {
    results.push(`✗ themeConfig: ${e}`);
  }

  try {
    // Add tags column to Note if missing
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '';`
    );
    results.push("✓ tags column added to Note");
  } catch (e) {
    results.push(`✗ tags: ${e}`);
  }

  try {
    // Create Todo table if missing
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Todo" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "isCompleted" BOOLEAN NOT NULL DEFAULT false,
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "dueDate" TIMESTAMP(3),
        "tags" TEXT NOT NULL DEFAULT '',
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
      );
    `);
    results.push("✓ Todo table created");
  } catch (e) {
    results.push(`✗ Todo table: ${e}`);
  }

  try {
    // Add foreign key if missing
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Todo" DROP CONSTRAINT IF EXISTS "Todo_userId_fkey";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    results.push("✓ Todo foreign key added");
  } catch (e) {
    results.push(`✗ Todo FK: ${e}`);
  }

  return NextResponse.json({ success: true, results });
}
