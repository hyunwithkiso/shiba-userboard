import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { userService } from "@/services/user-service";
import { redirect } from "next/navigation";
import GalleryUploader from "@/components/gallery/GalleryUploader";
import GalleryAdminList from "@/components/gallery/GalleryAdminList";

export const metadata: Metadata = {
  title: "갤러리 업로드 (관리자)",
  description: "갤러리 이미지 URL 등록",
};

export default async function AdminGalleryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const me = await userService.getUserInfo(session.user.id);
  if (!me.success || !me.user?.isAdmin) {
    redirect("/");
  }

  return (
    <main className="container max-w-3xl py-24 space-y-8 mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">갤러리 업로드</h1>
        <p className="text-muted-foreground">16:9 이미지 URL을 등록합니다.</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
        <GalleryUploader onUploaded={undefined} />
        <GalleryAdminList />
      </div>
    </main>
  );
}
