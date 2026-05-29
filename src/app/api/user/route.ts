import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client"; 
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    // 1. Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // 2. Delete the user from the database
    await prisma.user.delete({
      where: {
        email: userEmail,
      },
    });

    // 3. Return success response
    return NextResponse.json(
      { message: "Account completely deleted" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again." },
      { status: 500 }
    );
  }
}