"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

const LoginPage = () => {
  const handleDiscordLogin = async () => {
    await signIn("discord", { callbackUrl: "/" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center py-24 bg-black">
      {/* Grid pattern background - more visible */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80" />
        {/* Additional aceternity-style effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
          <CardHeader className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
                <Logo className="relative w-20 h-20 drop-shadow-2xl" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                SHIBA 유저보드 로그인
              </CardTitle>
              <CardDescription className="text-gray-300">
                Discord 계정으로 간편하게 시작하세요.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="default"
              className="w-full text-base font-medium h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl border-0 text-white"
              onClick={handleDiscordLogin}
              aria-label="Discord로 로그인"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleDiscordLogin();
              }}
            >
              <svg
                className="mr-3 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord로 로그인
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-400">
                로그인하면{" "}
                <Link 
                  href="/terms" 
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  서비스 약관
                </Link>
                {" "}및{" "}
                <Link 
                  href="/privacy" 
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  개인정보 처리방침
                </Link>
                에 동의하게 됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
