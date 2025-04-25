"use client";

import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  previewWidth?: number;
  previewHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export const ImageUpload = ({
  onFileSelect,
  maxSize = 500 * 1024, // 기본 500KB
  acceptedTypes = ["image/png", "image/webp", "image/gif"],
  previewWidth = 300,
  previewHeight = 300,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.onload = () => {
        const width = img.width;
        const height = img.height;

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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    // 파일 타입 검증
    if (!acceptedTypes.includes(file.type)) {
      setError("지원하지 않는 파일 형식입니다.");
      return;
    }

    // 파일 크기 검증
    if (file.size > maxSize) {
      setError(`파일 크기는 ${maxSize / 1024}KB 이하여야 합니다.`);
      return;
    }

    // 이미지 크기 검증
    if (minWidth || maxWidth || minHeight || maxHeight) {
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-md h-60 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
        onClick={() => document.getElementById("fileInput")?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            document.getElementById("fileInput")?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="이미지 업로드"
      >
        {preview ? (
          <Image
            src={preview}
            alt="미리보기"
            width={previewWidth}
            height={previewHeight}
            className="object-contain max-h-full rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="w-8 h-8" />
            <p>클릭하여 이미지 업로드</p>
            <p className="text-sm">
              {acceptedTypes.map((type) => type.split("/")[1]).join(", ")}{" "}
              파일만 가능
            </p>
            <p className="text-sm">최대 {maxSize / 1024}KB</p>
            {(minWidth || maxWidth || minHeight || maxHeight) && (
              <p className="text-sm">
                {minWidth && maxWidth
                  ? `너비 ${minWidth}~${maxWidth}px`
                  : minWidth
                  ? `최소 너비 ${minWidth}px`
                  : maxWidth
                  ? `최대 너비 ${maxWidth}px`
                  : ""}{" "}
                {(minWidth || maxWidth) && (minHeight || maxHeight) ? "/ " : ""}
                {minHeight && maxHeight
                  ? `높이 ${minHeight}~${maxHeight}px`
                  : minHeight
                  ? `최소 높이 ${minHeight}px`
                  : maxHeight
                  ? `최대 높이 ${maxHeight}px`
                  : ""}
              </p>
            )}
          </div>
        )}
      </div>

      <input
        id="fileInput"
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedTypes.join(",")}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
};
