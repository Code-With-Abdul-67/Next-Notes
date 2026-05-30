import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const userEmail = session.user.email;

    await prisma.user.delete({
      where: { email: userEmail },
    });

    return NextResponse.json({ message: "Account completely deleted" }, { status: 200 });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}