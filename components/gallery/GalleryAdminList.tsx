"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Item = {
  id: string;
  url: string;
  title: string | null;
  downloadCount: number | null;
  createdAt: string;
};

export default function GalleryAdminList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery/list", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "불러오기 실패");
      setItems(data.items || []);
    } catch (e: any) {
      toast.error(e.message || "목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "삭제 실패");
      toast.success("삭제되었습니다.");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      toast.error(e.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">등록된 이미지</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          새로고침
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 등록된 이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <div key={it.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="relative w-full pt-[56.25%] bg-muted">
                <Image
                  src={it.url}
                  alt={it.title || "image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-3 space-y-2">
                <div className="text-sm font-medium truncate">{it.title || "이미지"}</div>
                <div className="flex items-center justify-between">
                  <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">원본 열기</a>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(it.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

