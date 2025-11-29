"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(80);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileNameBase = useMemo(() => (file ? file.name.replace(/\.[^/.]+$/, "") : "output"), [file]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    const validTypes = ['image/png', 'image/gif', 'image/webp', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.gif', '.webp', '.jpeg', '.jpg'];

    const isValid = validTypes.includes(f.type) ||
      validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      toast.error("PNG, GIF, WEBP, JPEG 파일을 드래그해주세요.");
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

    const validTypes = ['image/png', 'image/gif', 'image/webp', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.png', '.gif', '.webp', '.jpeg', '.jpg'];

    const isValid = validTypes.includes(f.type) ||
      validExtensions.some(ext => f.name.toLowerCase().endsWith(ext));

    if (!isValid) {
      toast.error("PNG, GIF, WEBP, JPEG 파일을 선택해주세요.");
      e.target.value = "";
      return;
    }
    setFile(f);
    setOutputUrl(null);
    e.target.value = "";
  };

  const convert = async () => {
    if (!file) {
      toast.error("먼저 이미지 파일을 올려주세요.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quality", quality.toString());

      const res = await fetch("/api/images/tools/image-to-webp", {
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
      toast.success("변환이 완료되었습니다!");
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
      .then((b) => downloadBlob(b, `${fileNameBase}_q${quality}.webp`));
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-md p-8 text-center text-sm text-muted-foreground hover:bg-muted/30 cursor-pointer"
      >
        <Label className="block font-medium mb-2">이미지 파일을 여기로 드래그 & 드랍</Label>
        <p className="text-xs mb-3">PNG, GIF, WEBP, JPEG 지원</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/gif,image/webp,image/jpeg,image/jpg,.png,.gif,.webp,.jpeg,.jpg"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {file ? (
          <div className="space-y-2">
            <div className="text-foreground font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="relative mx-auto h-64 w-full">
              <Image
                src={URL.createObjectURL(file)}
                alt="원본 이미지"
                fill
                className="object-contain rounded border"
                unoptimized
              />
            </div>
          </div>
        ) : (
          <div>또는 파일 선택창에서 올려주세요.</div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">품질 설정: {quality}%</Label>
          <Slider
            value={[quality]}
            onValueChange={(value) => setQuality(value[0])}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>최소 압축 (10%)</span>
            <span>최대 압축 (100%)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={convert} disabled={!file || loading}>
            {loading ? "변환 중..." : "WEBP로 변환"}
          </Button>
          <Button variant="outline" onClick={onDownload} disabled={!outputUrl}>
            결과 다운로드
          </Button>
        </div>
      </div>

      <div>
        <Label className="block mb-2">결과 미리보기</Label>
        {outputUrl ? (
          <div className="space-y-2">
            <div className="relative h-80 w-full">
              <Image
                src={outputUrl}
                alt="변환된 WEBP"
                fill
                className="object-contain rounded border"
                unoptimized
              />
            </div>
            <p className="text-sm text-muted-foreground">
              품질 {quality}%로 WEBP 변환 완료
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">아직 변환 전입니다.</div>
        )}
      </div>
    </div>
  );
}