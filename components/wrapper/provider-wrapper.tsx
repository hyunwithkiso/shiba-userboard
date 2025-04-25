"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function ProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
