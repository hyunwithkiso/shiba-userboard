"use client";

import { useState, useRef, DragEvent } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function isImage(file: File) {
  return file.type.startsWith("image/");
}

export default function GalleryUploader({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const onFile = (f: File) => {
    if (!isImage(f)) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      const target = 16 / 9;
      const tolerance = 0.02;
      if (Math.abs(ratio - target) > tolerance) {
        toast.error("이미지는 16:9 비율이어야 합니다.");
        URL.revokeObjectURL(url);
        setFile(null);
        setPreview(null);
        return;
      }
      setFile(f);
      setPreview(url);
    };
    img.onerror = () => {
      toast.error("이미지를 확인할 수 없습니다.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFile(e.dataTransfer.files[0]);
    }
  };

  const upload = async () => {
    if (!file) {
      toast.error("파일을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      const res = await fetch("/api/admin/gallery/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "업로드 실패");
      toast.success("업로드되었습니다.");
      setFile(null);
      setPreview(null);
      setTitle("");
      onUploaded?.();
    } catch (e: any) {
      toast.error(e.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative w-full max-w-2xl h-56 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition ${dragOver ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:bg-muted/60"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
        onClick={pick}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <NextImage
            src={preview}
            alt="preview"
            fill
            className="object-cover rounded-lg"
            unoptimized
          />
        ) : (
          <div className="text-sm text-muted-foreground text-center px-6">
            <div className="font-semibold mb-1">이미지를 드래그하거나 클릭하여 선택</div>
            <div>16:9 비율 권장, 용량 제한 없음</div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && onFile(e.target.files[0])} />
      </div>
      <div className="max-w-2xl space-y-2">
        <Label htmlFor="title">제목 (선택)</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
      </div>
      <div className="flex justify-end max-w-2xl">
        <Button onClick={upload} disabled={loading || !file} className="min-w-28">
          {loading ? "업로드 중..." : "업로드"}
        </Button>
      </div>
    </div>
  );
}

