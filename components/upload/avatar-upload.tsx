import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, XCircle, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/image-upload-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export interface AvatarUploadProps {
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

export default function AvatarUpload({
  onImageUpload,
  onImageRemove,
  defaultImage,
  className,
}: AvatarUploadProps) {
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
      // 파일 크기 검증 (300KB 제한)
      if (file.size > 300 * 1024) {
        toast.error("파일 크기는 300KB 이하여야 합니다.");
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
      toast.success("아바타가 업로드되었습니다.");
    } catch (error) {
      console.error("아바타 업로드 오류:", error);
      toast.error("아바타 업로드에 실패했습니다.");
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
    toast.success("아바타가 제거되었습니다.");
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
        <p className="text-sm font-medium text-neutral-700">프로필 아바타</p>
        <p className="text-xs text-neutral-500">
          권장 사이즈: 200 x 200 (최대 300KB)
        </p>
      </div>

      {/* 아바타 업로드 영역 */}
      <div
        className={cn(
          "relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed p-2 transition-colors mx-auto",
          imagePreview
            ? "border-primary/20 bg-primary/5 hover:border-primary/30"
            : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
        )}
        onClick={handleClickUpload}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="아바타 업로드"
        role="button"
      >
        {imagePreview ? (
          /* 이미지 미리보기 영역 */
          <div className="relative h-full w-full">
            <Image
              src={imagePreview}
              alt="프로필 아바타"
              fill
              className="rounded-full object-cover"
            />

            {/* 이미지 제거 버튼 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    aria-label="아바타 제거"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>아바타 제거</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          /* 업로드 안내 영역 */
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="rounded-full bg-neutral-200 p-2">
              <User className="h-8 w-8 text-neutral-500" />
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500">클릭하여 업로드</p>
            </div>
          </div>
        )}

        {/* 상태 표시 */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
            <div className="rounded-md bg-white p-2 text-xs font-medium">
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
