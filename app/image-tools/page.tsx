import { Metadata } from "next";
import { Wand2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUserData } from "@/lib/user-validation";
import { checkUserInitialization } from "@/lib/auth-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import ImageToolsTabs from "@/components/tools/ImageToolsTabs";

export const metadata: Metadata = {
  title: "이미지 압축 도구",
  description: "GIF를 WEBP로 변환하고 WEBP를 압축합니다.",
};

export default async function ImageToolsPage() {
  try {
    const [, session, userData] = await Promise.all([
      checkUserInitialization(),
      auth(),
      getCurrentUserData(),
    ]);

    if (!session) redirect("/login");
    if (!userData?.nickname) redirect("/init");

    return (
      <main className="container max-w-5xl py-6 space-y-8 mx-auto">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-sky-600 p-8">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3">
            <Wand2 className="w-48 h-48 text-white/10" />
          </div>
          <div className="relative">
            <h1 className="text-3xl font-bold text-white mb-2">이미지 압축 도구</h1>
            <p className="text-white/80">
              GIF를 WEBP로 변환하고, WEBP를 압축할 수 있습니다.
            </p>
          </div>
        </div>

        <ImageToolsTabs />
      </main>
    );
  } catch (error) {
    console.error("이미지 도구 페이지 로딩 실패:", error);
    redirect("/login");
  }
}
