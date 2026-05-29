import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // Ensure your PrismaClient initialization path is correct

export const authOptions: NextAuthOptions = {
  // Linking Next-Auth with Vercel Postgres via Prisma Client
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request clean user attributes profile from Google identity scope
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],

  // Using JWT Strategy fixes token callbacks loops on production database write states
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Days session validity expiration
  },

  pages: {
    signIn: "/login",       // Redirects here if unauthenticated
    error: "/login",        // Redirects back to login on validation errors
  },

  callbacks: {
    // Attaching user unique identity attributes to the active token payload
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Injecting user ID token inside active Client Session contexts
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
      }
      return session;
    },

    // Secure callback controls to verify active user routing flow paths
    async redirect({ url, baseUrl }) {
      // Allows relative callback paths or same-origin redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Enable debug logs on development mode to check error logs right inside terminal or Vercel dashboard
  debug: process.env.NODE_ENV === "development",
};