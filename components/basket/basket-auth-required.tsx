"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";
import type { TebexAuthLink } from "@/lib/tebex"; // Import the type

interface BasketAuthRequiredProps {
  authLinks: TebexAuthLink[];
  basketIdent: string;
}

export function BasketAuthRequired({
  authLinks,
  basketIdent,
}: BasketAuthRequiredProps) {
  // Find the FiveM auth link (or prioritize others if needed)
  const fivemAuthLink =
    authLinks.find((link) => link.name.toLowerCase() === "fivem") ||
    authLinks[0];

  if (!fivemAuthLink) {
    // Handle case where no auth links are available (should ideally not happen)
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>
          계정 인증 링크를 가져올 수 없습니다. 관리자에게 문의해주세요. (Basket:{" "}
          {basketIdent})
        </AlertDescription>
      </Alert>
    );
  }

  const handleAuthClick = () => {
    // Open the auth URL in a new tab
    window.open(fivemAuthLink.url, "_blank", "noopener,noreferrer");
    // Optionally, you could add a state to show a message like "Check the new tab..."
  };

  return (
    <Alert
      variant="default"
      className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300"
    >
      <Info className="h-4 w-4 stroke-current" />
      <AlertTitle className="font-semibold">계정 인증 필요</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          상점 및 장바구니를 이용하려면 먼저 계정 인증이 필요합니다. 아래 버튼을
          클릭하여 FiveM 계정으로 로그인해주세요.
        </p>
        <p className="text-xs">
          인증이 완료되면 이 페이지가 자동으로 새로고침되거나, 직접 새로고침
          해주세요.
        </p>
        <Button
          onClick={handleAuthClick}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          FiveM 계정으로 인증하기
        </Button>
      </AlertDescription>
    </Alert>
  );
}
