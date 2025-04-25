"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { XCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fileToDataUrl, uploadKillfeedImage } from "@/lib/image-upload-utils";

export interface KillfeedImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  onImageRemove: () => void;
  defaultImage?: string;
  className?: string;
}

export const KillfeedImageUpload = ({
  onImageUpload,
  onImageRemove,
  defaultImage,
  className,
}: KillfeedImageUploadProps) => {
  const [preview, setPreview] = useState<string | undefined>(defaultImage);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 이미지 미리보기 생성
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);

      // 이미지 업로드 시작
      setIsUploading(true);
      const imageUrl = await uploadKillfeedImage(file);

      // 업로드 성공 시 콜백 호출
      onImageUpload(imageUrl);
      toast.success("킬피드 이미지가 업로드되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "이미지 업로드에 실패했습니다.");
      // 업로드 실패 시 미리보기 초기화
      if (!defaultImage) {
        setPreview(undefined);
      } else {
        setPreview(defaultImage);
      }
    } finally {
      setIsUploading(false);
      // 파일 인풋 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(undefined);
    onImageRemove();
    toast.success("킬피드 이미지가 제거되었습니다.");
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">킬피드 이미지</h3>
            <span className="text-xs text-muted-foreground">(선택사항)</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>
            게임 킬피드 스타일의 이미지를 업로드하세요.
            <br />• 권장 크기: 400x200px
            <br />• 최대 파일 크기: 300KB
            <br />• 지원 형식: PNG, WebP, GIF
          </p>
        </TooltipContent>
      </Tooltip>

      <div className="space-y-4">
        {/* 파일 입력 (숨김) */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* 이미지 미리보기 */}
        {preview ? (
          <div className="relative rounded-md border overflow-hidden h-24 max-w-md">
            <Image
              src={preview}
              alt="킬피드 이미지 미리보기"
              className="object-contain"
              fill
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 rounded-full bg-background/80 hover:bg-background/90"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <span className="sr-only">이미지 제거</span>
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={handleSelectFile}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              클릭하여 킬피드 이미지 업로드
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, WebP 또는 GIF • 최대 300KB
            </p>
          </div>
        )}

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-2">
          {!preview ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSelectFile}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              이미지 선택
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSelectFile}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              이미지 변경
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
