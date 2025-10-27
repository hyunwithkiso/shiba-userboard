"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminGalleryForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!url.trim()) {
      toast.error("이미지 URL을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "업로드 실패");
      }
      toast.success("갤러리에 등록되었습니다.");
      setUrl("");
      setTitle("");
    } catch (e: any) {
      toast.error(e.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">이미지 URL (16:9)</Label>
        <Input
          id="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">제목 (선택)</Label>
        <Input
          id="title"
          placeholder="표시할 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={submit} disabled={loading} className="min-w-28">
          {loading ? "등록 중..." : "등록"}
        </Button>
      </div>
    </div>
  );
}

