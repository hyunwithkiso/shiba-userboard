import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserData } from "@/lib/user-validation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Shield, 
  Hash, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export const metadata: Metadata = {
  title: "내 프로필 | SHIBA 유저보드",
  description: "내 계정 정보를 확인합니다.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userData = await getCurrentUserData();
  if (!userData) {
    redirect("/login");
  }

  // 인증 상태 결정
  let authStatus: "verified" | "unverified" | "pending";
  let authMessage: string;
  let authColor: string;

  if (userData.userId) {
    authStatus = "verified";
    authMessage = "인증 완료";
    authColor = "text-green-600 dark:text-green-400";
  } else if (userData.isInit) {
    authStatus = "unverified"; 
    authMessage = "인증 안됨 - 게임 서버에 등록되지 않은 계정";
    authColor = "text-red-600 dark:text-red-400";
  } else {
    authStatus = "pending";
    authMessage = "Discord 연동 대기중";
    authColor = "text-yellow-600 dark:text-yellow-400";
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-lg">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">내 프로필</h1>
          <p className="text-muted-foreground">계정 정보 및 인증 상태를 확인하세요</p>
        </div>
      </div>

      {/* 인증 상태 알림 */}
      <Alert className={
        authStatus === "verified" 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
          : authStatus === "unverified"
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      }>
        {authStatus === "verified" ? (
          <CheckCircle className="h-4 w-4 stroke-green-600 dark:stroke-green-400" />
        ) : authStatus === "unverified" ? (
          <XCircle className="h-4 w-4 stroke-red-600 dark:stroke-red-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 stroke-yellow-600 dark:stroke-yellow-400" />
        )}
        <AlertDescription className={authColor}>
          <strong>인증 상태:</strong> {authMessage}
          {authStatus === "unverified" && (
            <div className="mt-2 text-sm">
              게임 서버(FiveM)에 등록된 Discord 계정이 아닙니다. 관리자에게 문의하여 계정을 등록해주세요.
            </div>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              기본 정보
            </CardTitle>
            <CardDescription>
              인게임 연동된 기본 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">이메일</span>
              <span>{session.user?.email || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">닉네임</span>
              <span>{userData.nickname || "설정되지 않음"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Discord ID</span>
              <span className="font-mono text-xs">
                {userData.discordId || "Unknown"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 인증 및 권한 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              인증 및 권한
            </CardTitle>
            <CardDescription>
              계정의 인증 상태와 권한 정보입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">고유번호</span>
              <div className="flex items-center gap-2">
                {userData.userId ? (
                  <>
                    <Hash className="h-4 w-4" />
                    <span className="font-mono">{userData.userId}</span>
                  </>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    인증 안됨
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">초기화 상태</span>
              <Badge variant={userData.isInit ? "default" : "secondary"}>
                {userData.isInit ? "완료" : "대기중"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">인증 상태</span>
              <Badge 
                variant={
                  authStatus === "verified" 
                    ? "default" 
                    : authStatus === "unverified" 
                    ? "destructive" 
                    : "secondary"
                }
                className="text-xs"
              >
                {authMessage}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 사용 가능한 기능 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>사용 가능한 기능</CardTitle>
          <CardDescription>
            현재 계정 상태에 따라 사용 가능한 기능입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className={`p-3 rounded-lg border ${
              authStatus === "verified" 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {authStatus === "verified" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">킬피드 업로드</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {authStatus === "verified" ? "사용 가능" : "인증 후 사용 가능"}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${
              authStatus === "verified" 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {authStatus === "verified" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">채팅 칭호 업로드</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {authStatus === "verified" ? "사용 가능" : "인증 후 사용 가능"}
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${
              authStatus === "verified" 
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                : "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {authStatus === "verified" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium">상점 이용</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {authStatus === "verified" ? "사용 가능" : "인증 후 사용 가능"}
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">공지사항 및 이벤트</span>
              </div>
              <p className="text-xs text-muted-foreground">
                항상 사용 가능
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {authStatus === "unverified" && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              인증 필요 안내
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>현재 계정은 게임 서버(FiveM)에 등록되지 않은 상태입니다.</p>
              <p><strong>해결 방법:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>게임 서버에 접속하여 계정을 생성해주세요</li>
                <li>Discord 서버의 관리자에게 계정 등록을 요청해주세요</li>
                <li>등록 완료 후 다시 Discord 연동을 진행해주세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}