"use client";

import { NextUIProvider } from "@nextui-org/react";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextUIProvider className="dark text-foreground bg-background min-h-screen">
        {children}
      </NextUIProvider>
    </SessionProvider>
  );
}
