"use client";

import { NextUIProvider } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/frontend/context/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider>
        <NextUIProvider className="dark text-foreground bg-transparent min-h-screen">
          {children}
        </NextUIProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

