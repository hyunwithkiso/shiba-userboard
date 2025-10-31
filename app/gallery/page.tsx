import { Metadata } from "next";
import { galleryService } from "@/services/gallery-service";
import GalleryGrid from "@/components/gallery/GalleryGrid";

// 갤러리 페이지는 항상 최신 데이터를 보여주도록 SSR 강제
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "갤러리",
  description: "SHIBA 서버 갤러리",
};

export default async function GalleryPage() {
  const items = await galleryService.list({ limit: 100 });

  return (
    <main className="container max-w-8xl py-24 space-y-8 mx-auto min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">갤러리</h1>
        <p className="text-muted-foreground">SHIBA 서버의 순간들</p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">아직 등록된 이미지가 없습니다.</p>
      ) : (
        <GalleryGrid items={items} />
      )}
    </main>
  );
}
