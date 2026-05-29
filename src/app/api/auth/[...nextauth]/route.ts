import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Next.js ko sirf GET aur POST routes explicit chahiye hotay hain
export { handler as GET, handler as POST };