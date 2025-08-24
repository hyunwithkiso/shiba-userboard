"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GifToWebpConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileNameBase = useMemo(() => (file ? file.name.replace(/\.[^/.]+$/, "") : "output"), [file]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!/gif$/i.test(f.type) && !/\.gif$/i.test(f.name)) {
      toast.error("GIF 파일을 드래그해주세요.");
      return;
    }
    setFile(f);
    setOutputUrl(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/gif$/i.test(f.type) && !/\.gif$/i.test(f.name)) {
      toast.error("GIF 파일을 선택해주세요.");
      e.target.value = "";
      return;
    }
    setFile(f);
    setOutputUrl(null);
    // allow reselecting the same file
    e.target.value = "";
  };

  const convert = async () => {
    if (!file) {
      toast.error("먼저 GIF 파일을 올려주세요.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/images/tools/gif-to-webp", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "서버 변환 실패");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onDownload = () => {
    if (!outputUrl) return;
    fetch(outputUrl)
      .then((r) => r.blob())
      .then((b) => downloadBlob(b, `${fileNameBase}.webp`));
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-md p-8 text-center text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer"
      >
        <Label className="block font-medium mb-2">GIF 파일을 여기로 드래그 & 드랍</Label>
        <input
          ref={inputRef}
          type="file"
          accept="image/gif,.gif"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {file ? (
          <div className="space-y-2">
            <div className="text-foreground">{file.name}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={URL.createObjectURL(file)} alt="원본 GIF" className="mx-auto max-h-64 rounded border" />
          </div>
        ) : (
          <div>또는 파일 선택창에서 올려주세요.</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={convert} disabled={!file || loading}>
          {loading ? "변환 중..." : "변환"}
        </Button>
        <Button variant="outline" onClick={onDownload} disabled={!outputUrl}>
          결과 다운로드
        </Button>
      </div>

      <div>
        <Label className="block mb-2">결과 미리보기</Label>
        {outputUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={outputUrl} alt="변환된 WEBP" className="max-h-80 w-auto rounded border" />
        ) : (
          <div className="text-sm text-muted-foreground">아직 변환 전입니다.</div>
        )}
      </div>
    </div>
  );
}
