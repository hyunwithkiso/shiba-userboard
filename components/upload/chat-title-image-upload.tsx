"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/image-upload-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export interface ChatTitleImageUploadProps {
  /**
   * 이미지가 업로드될 때 호출되는 함수
   */
  onImageUpload: (file: File) => Promise<void>;

  /**
   * 이미지가 제거될 때 호출되는 함수
   */
  onImageRemove?: () => void;

  /**
   * 기본 이미지 URL (선택적)
   */
  defaultImage?: string;

  /**
   * 추가 클래스명 (선택적)
   */
  className?: string;
}

export default function ChatTitleImageUpload({
  onImageUpload,
  onImageRemove,
  defaultImage,
  className,
}: ChatTitleImageUploadProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultImage || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 입력 필드 클릭 핸들러
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // 이미지 업로드 핸들러
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 파일 크기 검증 (500KB 제한)
      if (file.size > 500 * 1024) {
        toast.error("파일 크기는 500KB 이하여야 합니다.");
        return;
      }

      // 파일 형식 검증
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("지원되는 파일 형식은 JPG, PNG, WebP입니다.");
        return;
      }

      // 미리보기 생성
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);

      // 업로드 처리
      setIsUploading(true);
      await onImageUpload(file);
      toast.success("이미지가 업로드되었습니다.");
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);

      // 파일 입력 필드 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setImagePreview(null);
    onImageRemove?.();
    toast.success("이미지가 제거되었습니다.");
  };

  // 키보드 접근성 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClickUpload();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">채팅 칭호 이미지</p>
        <p className="text-xs text-neutral-500">
          권장 사이즈: 600 x 200 (최대 500KB)
        </p>
      </div>

      {/* 이미지 업로드 영역 */}
      <div
        className={cn(
          "relative flex h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-2 transition-colors",
          imagePreview
            ? "border-primary/20 bg-primary/5 hover:border-primary/30"
            : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
        )}
        onClick={handleClickUpload}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="이미지 업로드"
        role="button"
      >
        {imagePreview ? (
          /* 이미지 미리보기 영역 */
          <div className="relative h-full w-full">
            <Image
              src={imagePreview}
              alt="채팅 칭호 이미지"
              fill
              className="rounded object-cover"
            />

            {/* 이미지 제거 버튼 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    aria-label="이미지 제거"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>이미지 제거</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          /* 업로드 안내 영역 */
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700">
                이미지를 업로드하려면 클릭하세요
              </p>
              <p className="text-xs text-neutral-500">
                PNG, JPG, WebP (최대 500KB)
              </p>
            </div>
          </div>
        )}

        {/* 상태 표시 */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
            <div className="rounded-md bg-white p-2 text-sm font-medium">
              업로드 중...
            </div>
          </div>
        )}

        {/* 숨겨진 파일 입력 필드 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          onChange={handleImageChange}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
