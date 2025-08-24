"use client";

import React, { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImageCompressionTool() {
  const [file, setFile] = useState<File | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(80);
  const [lossless, setLossless] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    optimizedSize: number;
    compressionRatio: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileNameBase = useMemo(() => (file ? file.name.replace(/\.[^/.]+$/, "") : "output"), [file]);

  const isWebpFile = useMemo(() => {
    if (!file) return false;
    return file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp');
  }, [file]);

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
    setCompressionInfo(null);
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
    setCompressionInfo(null);
    e.target.value = "";
  };

  const processImage = async () => {
    if (!file) {
      toast.error("먼저 이미지 파일을 올려주세요.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("quality", quality.toString());
      
      let endpoint = "/api/images/tools/image-to-webp";
      
      // WEBP 파일인 경우 최적화 엔드포인트 사용
      if (isWebpFile) {
        endpoint = "/api/images/tools/webp-optimize";
        fd.append("effort", "4"); // 고정값으로 설정
        fd.append("lossless", lossless.toString());
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "처리 실패");
      }
      
      // WEBP 최적화의 경우 압축 정보 추출
      if (isWebpFile) {
        const originalSize = parseInt(res.headers.get("X-Original-Size") || "0");
        const optimizedSize = parseInt(res.headers.get("X-Optimized-Size") || "0");
        const compressionRatio = res.headers.get("X-Compression-Ratio") || "0";
        
        if (originalSize && optimizedSize) {
          setCompressionInfo({
            originalSize,
            optimizedSize,
            compressionRatio
          });
        }
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      toast.success(isWebpFile ? "최적화가 완료되었습니다!" : "변환이 완료되었습니다!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onDownload = () => {
    if (!outputUrl) return;
    let filename: string;
    
    if (isWebpFile) {
      const suffix = lossless ? "lossless" : `q${quality}`;
      filename = `${fileNameBase}_optimized_${suffix}.webp`;
    } else {
      filename = `${fileNameBase}_q${quality}.webp`;
    }
    
    fetch(outputUrl)
      .then((r) => r.blob())
      .then((b) => downloadBlob(b, filename));
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">이미지 압축 & 변환</h3>
        <p className="text-sm text-muted-foreground">
          모든 이미지 포맷을 WEBP로 변환하거나 기존 WEBP를 최적화합니다. (애니메이션 지원)
        </p>
      </div>

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
                {formatFileSize(file.size)} • {isWebpFile ? "WEBP 최적화" : "WEBP 변환"}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(file)} alt="원본 이미지" className="mx-auto max-h-64 rounded border" />
            </div>
          ) : (
            <div>또는 파일 선택창에서 올려주세요.</div>
          )}
        </div>

        <div className="space-y-4">
          {isWebpFile && (
            <div className="flex items-center justify-between">
              <Label htmlFor="lossless" className="text-sm font-medium">무손실 압축</Label>
              <Switch
                id="lossless"
                checked={lossless}
                onCheckedChange={setLossless}
              />
            </div>
          )}

          {(!isWebpFile || !lossless) && (
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
                <span>최소 품질 (10%)</span>
                <span>최대 품질 (100%)</span>
              </div>
            </div>
          )}


          <div className="flex items-center gap-2">
            <Button onClick={processImage} disabled={!file || loading}>
              {loading ? "처리 중..." : isWebpFile ? "최적화" : "WEBP 변환"}
            </Button>
            <Button variant="outline" onClick={onDownload} disabled={!outputUrl}>
              결과 다운로드
            </Button>
          </div>
        </div>

        {compressionInfo && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <Label className="block mb-2 font-medium">압축 정보</Label>
            <div className="space-y-1 text-sm">
              <div>원본 크기: {formatFileSize(compressionInfo.originalSize)}</div>
              <div>최적화 크기: {formatFileSize(compressionInfo.optimizedSize)}</div>
              <div className="font-medium text-green-600">
                압축률: {compressionInfo.compressionRatio}% 감소
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="block mb-2">결과 미리보기</Label>
          {outputUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={outputUrl} alt="처리된 이미지" className="max-h-80 w-auto rounded border" />
              <p className="text-sm text-muted-foreground">
                {isWebpFile 
                  ? `${lossless ? "무손실" : `품질 ${quality}%`}로 최적화 완료`
                  : `품질 ${quality}%로 WEBP 변환 완료`
                }
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">아직 처리 전입니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
