"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress"; // Comment out Progress import
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadCloud, X, Image as ImageIcon, Loader2 } from "lucide-react";
// import { uploadImageAction } from "@/actions/image-actions"; // 서버 액션 import 제거

interface ImageUploadProps {
  initialImageUrl?: string | null;
  onUploadComplete: (url: string) => void; // Callback to return the URL
  disabled?: boolean;
}

export function ImageUpload({
  initialImageUrl,
  onUploadComplete,
  disabled,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const [uploadProgress, setUploadProgress] = useState(0); // Comment out progress state

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    // setUploadProgress(0); // Comment out progress reset

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Create FormData
    const formData = new FormData();
    formData.append("files", file); // API 라우트에서 "files" 키를 사용하므로 동일하게 맞춤

    try {
      // 서버 액션 대신 /api/upload 엔드포인트 호출
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // API 라우트에서 반환한 에러 메시지 사용
        throw new Error(responseData.error || "이미지 업로드 실패");
      }

      // API 응답에서 URL 추출 (API 응답 형식에 따라 키 이름 조정 필요, 예: responseData.url)
      const uploadedUrl = responseData.url; // API 응답에 url 필드가 있다고 가정
      if (!uploadedUrl) {
        throw new Error("업로드 응답에서 이미지 URL을 찾을 수 없습니다.");
      }

      onUploadComplete(uploadedUrl); // Pass the URL back via callback
    } catch (e) {
      console.error("Upload error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "이미지 업로드 중 오류 발생";
      setError(errorMessage);
      setPreviewUrl(initialImageUrl || null); // Revert preview on error
    } finally {
      setIsUploading(false);
      // Optional: Hide progress bar after a delay
      // setTimeout(() => setUploadProgress(0), 1000); // Comment out progress reset timeout
      // Reset file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUploadComplete(""); // Notify parent that image is removed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full border-2 border-dashed rounded-md overflow-hidden flex items-center justify-center group">
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="썸네일 미리보기"
              fill
              style={{ objectFit: "contain" }} // contain or cover based on preference
            />
            {!disabled && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                onClick={handleRemoveImage}
                type="button" // Prevent form submission
                aria-label="이미지 제거"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            <ImageIcon className="mx-auto h-10 w-10 mb-2" />
            <p className="text-sm">썸네일 이미지 업로드</p>
            <p className="text-xs">5MB 이하 (jpg, png, webp, gif)</p>
          </div>
        )}

        {/* Loading/Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">업로드 중...</p>
            {/* Comment out Optional Progress Bar */}
            {/* {uploadProgress > 0 && <Progress value={uploadProgress} className="w-3/4 mt-2 h-1.5" />} */}
          </div>
        )}
      </div>

      {/* Hidden File Input and Trigger Button */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            id="image-upload"
            className="hidden"
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isUploading}
          />
          <Button
            type="button" // Prevent form submission
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {previewUrl ? "이미지 변경" : "이미지 선택"}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              이미지 제거
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="p-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
