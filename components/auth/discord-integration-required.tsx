"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, ExternalLink, Info } from "lucide-react";

export function DiscordIntegrationRequired() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* 메인 카드 */}
        <Card className="bg-background/95 backdrop-blur border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit">
              <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl text-purple-800 dark:text-purple-300">
              디스코드 연동이 필요합니다
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <Info className="h-4 w-4 stroke-purple-600 dark:stroke-purple-400" />
              <AlertDescription className="text-purple-800 dark:text-purple-200 text-sm">
                SHIBA 유저보드의 모든 기능을 이용하려면 디스코드 계정 연동이 필요합니다.
              </AlertDescription>
            </Alert>
            
            <div className="pt-4 space-y-3">
              <Button 
                asChild
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Link 
                  href="/init" 
                  className="flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                디스코드 연동하기
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                size="sm"
              >
                <Link href="/notices">
                  공지사항 먼저 보기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}