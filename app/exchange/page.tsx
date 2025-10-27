import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserData } from "@/lib/user-validation";
import ExchangeClient from "@/app/exchange/client";

export const metadata: Metadata = {
  title: "거래소 | SHIBA 유저보드",
  description: "메이플 경매장/서든 플리마켓 UX를 참고한 테스트 거래소 UI",
};

export default async function ExchangePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userData = await getCurrentUserData();
  if (!userData?.userId || !userData.nickname) {
    redirect("/init");
  }

  return (
    <div className="container max-w-7xl mx-auto py-24">
      <ExchangeClient
        currentUser={{
          id: userData.userId!,
          nickname: userData.nickname || "사용자",
          isAdmin: !!userData.isAdmin,
        }}
      />
    </div>
  );
}