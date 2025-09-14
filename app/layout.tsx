import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import ProviderWrapper from "@/components/wrapper/provider-wrapper";
// ✅ 캐시 동기화 시스템 초기화 (클라이언트에서만 동작)
import "@/lib/cache-sync";

export const metadata: Metadata = {
  title: "SHIBA 유저보드",
  description: "SHIBA 유저보드입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-x-hidden"
        )}
      >
        <ProviderWrapper>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-grow flex-1">{children}</div>
            <Footer />
          </div>
        </ProviderWrapper>
      </body>
    </html>
  );
}
