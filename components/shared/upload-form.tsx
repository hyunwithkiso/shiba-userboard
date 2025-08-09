"use client";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Loader2, AlertCircle, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UploadFormProps {
  type: "killfeed" | "chat";
  endpoint: string;
  exactWidth?: number;
  exactHeight?: number;
  previewWidth?: number;
  previewHeight?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  successMessage?: string;
  onSuccess?: () => void;
}

export function UploadForm({
  type,
  endpoint,
  exactWidth,
  exactHeight,
  previewWidth,
  previewHeight,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  successMessage = "이미지가 성공적으로 업로드되었습니다.",
  onSuccess,
}: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  
  // 중복 검사 상태
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateCheckMessage, setDuplicateCheckMessage] = useState("");

  // 파일 크기 제한 설정
  const maxSize = type === "chat" ? 200 * 1024 : 500 * 1024; // 채팅칭호: 200KB, 킬피드: 500KB

  // 중복 검사 함수
  const checkDuplicate = useCallback(async (name: string) => {
    if (!name.trim()) {
      setIsDuplicate(false);
      setDuplicateCheckMessage("");
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const typeParam = type === "chat" ? "chattitle" : "killfeed";
      const response = await fetch(
        `/api/check/duplicate?name=${encodeURIComponent(name)}&type=${typeParam}`
      );
      const data = await response.json();
      
      setIsDuplicate(data.isDuplicate);
      setDuplicateCheckMessage(data.message);
    } catch (error) {
      console.error("중복 검사 오류:", error);
      setDuplicateCheckMessage("중복 검사를 수행할 수 없습니다.");
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, [type]);

  // 디바운싱된 중복 검사
  useEffect(() => {
    const timer = setTimeout(() => {
      if (imageName) {
        checkDuplicate(imageName);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [imageName, checkDuplicate]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 최대 10글자까지만 입력 가능
    const value = e.target.value.slice(0, 10);
    setImageName(value);
  };

  const handleUploadClick = () => {
    if (!selectedFile) return;
    if (!imageName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    
    if (isDuplicate) {
      toast.error("이미 사용 중인 이름입니다.");
      return;
    }

    // 확인 모달 표시
    setShowConfirmDialog(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setShowConfirmDialog(false);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", imageName.trim());

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "업로드에 실패했습니다.");
      }

      setUploadSuccess(true);
      toast.success(successMessage);

      // 성공 상태를 3초간 표시 후 리다이렉트
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 3000);

      onSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
              업로드 완료!
            </h3>
            <p className="text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              관리자 검토 후 게임에 적용됩니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>3초 후 메인 페이지로 이동합니다...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-name">이미지 이름 (최대 10자)</Label>
          <div className="relative">
            <Input
              id="image-name"
              value={imageName}
              onChange={handleNameChange}
              placeholder="이미지 이름을 입력하세요"
              maxLength={10}
              disabled={isUploading}
              className={isDuplicate ? "pr-10 border-destructive" : "pr-10"}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isCheckingDuplicate ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : imageName && !isDuplicate ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : imageName && isDuplicate ? (
                <AlertCircle className="w-4 h-4 text-destructive" />
              ) : null}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {imageName.length}/10 자
            </p>
            {duplicateCheckMessage && (
              <p className={`text-xs ${isDuplicate ? "text-destructive" : "text-emerald-600"}`}>
                {duplicateCheckMessage}
              </p>
            )}
          </div>
        </div>

        <ImageUpload
          onFileSelect={handleFileSelect}
          maxSize={maxSize}
          acceptedTypes={["image/png", "image/webp", "image/gif"]}
          exactWidth={exactWidth}
          exactHeight={exactHeight}
          previewWidth={previewWidth}
          previewHeight={previewHeight}
          minWidth={minWidth}
          maxWidth={maxWidth}
          minHeight={minHeight}
          maxHeight={maxHeight}
        />
      </div>

      <div className="flex justify-end">
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogTrigger asChild>
            <Button
              onClick={handleUploadClick}
              disabled={isUploading || !selectedFile || !imageName.trim() || isDuplicate}
              className="min-w-32"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  업로드
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>업로드 확인</AlertDialogTitle>
              <AlertDialogDescription>
                신청한 아이템 이름은 <strong>"{imageName} {type === 'killfeed' ? '킬피드' : '채팅칭호'}"</strong>로 생성됩니다.
                <br />
                계속 진행하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUpload}>
                확인
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
