"use client";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UploadFormProps {
  endpoint: string;
  previewWidth: number;
  previewHeight: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function UploadForm({
  endpoint,
  previewWidth,
  previewHeight,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
}: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const router = useRouter();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 최대 10글자까지만 입력 가능
    const value = e.target.value.slice(0, 10);
    setImageName(value);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!imageName.trim()) {
      toast.error("이미지 이름을 입력해주세요.");
      return;
    }

    try {
      setIsUploading(true);
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

      toast.success("이미지가 성공적으로 업로드되었습니다.");

      // 잠시 후 홈으로 리다이렉트
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "업로드 중 오류가 발생했습니다."
      );
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setImageName("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image-name">이미지 이름 (최대 10자)</Label>
        <Input
          id="image-name"
          value={imageName}
          onChange={handleNameChange}
          placeholder="이미지 이름을 입력하세요"
          maxLength={10}
        />
        <p className="text-xs text-muted-foreground">
          {imageName.length}/10 자
        </p>
      </div>

      <ImageUpload
        onFileSelect={handleFileSelect}
        maxSize={500 * 1024}
        acceptedTypes={["image/png", "image/webp", "image/gif"]}
        previewWidth={previewWidth}
        previewHeight={previewHeight}
        minWidth={minWidth}
        maxWidth={maxWidth}
        minHeight={minHeight}
        maxHeight={maxHeight}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !imageName.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "업로드 중..." : "업로드"}
        </Button>
      </div>
    </div>
  );
}
