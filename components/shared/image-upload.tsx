"use client";

import { ChangeEvent, useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  previewWidth?: number;
  previewHeight?: number;
  exactWidth?: number;  // 정확한 픽셀 크기 (필수)
  exactHeight?: number; // 정확한 픽셀 크기 (필수)
  minWidth?: number;    // 기존 호환성 유지
  maxWidth?: number;    // 기존 호환성 유지
  minHeight?: number;   // 기존 호환성 유지
  maxHeight?: number;   // 기존 호환성 유지
}

export const ImageUpload = ({
  onFileSelect,
  maxSize = 500 * 1024, // 기본 500KB
  acceptedTypes = ["image/png", "image/webp", "image/gif"],
  previewWidth = 300,
  previewHeight = 300,
  exactWidth,
  exactHeight,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // 정확한 크기가 지정된 경우 (새로운 방식)
        if (exactWidth && exactHeight) {
          if (width !== exactWidth || height !== exactHeight) {
            setError(`이미지 크기는 정확히 ${exactWidth} x ${exactHeight}px 이어야 합니다. (현재: ${width} x ${height}px)`);
            resolve(false);
            return;
          }
          resolve(true);
          return;
        }

        // 기존 방식 (호환성 유지)
        if (minWidth && width < minWidth) {
          setError(`이미지 너비가 ${minWidth}px 이상이어야 합니다.`);
          resolve(false);
        } else if (maxWidth && width > maxWidth) {
          setError(`이미지 너비가 ${maxWidth}px 이하여야 합니다.`);
          resolve(false);
        } else if (minHeight && height < minHeight) {
          setError(`이미지 높이가 ${minHeight}px 이상이어야 합니다.`);
          resolve(false);
        } else if (maxHeight && height > maxHeight) {
          setError(`이미지 높이가 ${maxHeight}px 이하여야 합니다.`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File) => {
    setError(null);

    if (!file) return;

    // 파일 타입 검증
    if (!acceptedTypes.includes(file.type)) {
      setError("지원하지 않는 파일 형식입니다.");
      return;
    }

    // 파일 크기 검증
    if (file.size > maxSize) {
      setError(`파일 크기는 ${Math.round(maxSize / 1024)}KB 이하여야 합니다.`);
      return;
    }

    // 이미지 크기 검증
    if (exactWidth || exactHeight || minWidth || maxWidth || minHeight || maxHeight) {
      const isValidDimensions = await validateImageDimensions(file);
      if (!isValidDimensions) return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      await processFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getSizeInfo = () => {
    const widthInfo = minWidth && maxWidth 
      ? `너비 ${minWidth}~${maxWidth}px`
      : minWidth 
      ? `최소 너비 ${minWidth}px`
      : maxWidth 
      ? `최대 너비 ${maxWidth}px`
      : "";
    
    const heightInfo = minHeight && maxHeight
      ? `높이 ${minHeight}~${maxHeight}px`
      : minHeight
      ? `최소 높이 ${minHeight}px`
      : maxHeight
      ? `최대 높이 ${maxHeight}px`
      : "";
    
    return [widthInfo, heightInfo].filter(Boolean).join(" / ");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative w-full max-w-md h-60 border-2 border-dashed rounded-lg flex items-center justify-center transition-all cursor-pointer ${
          isDragOver 
            ? "border-primary bg-primary/10 scale-105" 
            : "border-border bg-muted hover:bg-muted/80"
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="이미지 업로드"
      >
        {preview ? (
          <div className="relative w-full h-full">
            <Image
              src={preview}
              alt="미리보기"
              fill
              className="object-contain rounded-lg"
            />
            <div className="absolute top-2 right-2 bg-background/80 rounded-md p-1">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-6 text-center">
            <Upload className={`w-12 h-12 transition-transform ${isDragOver ? "scale-110" : ""}`} />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragOver ? "파일을 놓아주세요" : "이미지를 업로드하세요"}
              </p>
              <p className="text-sm">
                클릭하거나 파일을 드래그해서 업로드
              </p>
              <p className="text-sm">
                {acceptedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")} 파일만 가능
              </p>
              <p className="text-sm font-medium">
                최대 {Math.round(maxSize / 1024)}KB
              </p>
              {getSizeInfo() && (
                <p className="text-sm font-medium text-primary">
                  {getSizeInfo()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedTypes.join(",")}
      />

      {error && (
        <div className="w-full max-w-md p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      {preview && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPreview(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        >
          다시 선택
        </Button>
      )}
    </div>
  );
};
