"use client";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Upload, ArrowDown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ChatTitleExample from "@/components/chat/chat-title-example";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export default function ChatTitleUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scale, setScale] = useState(0.7);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // 이미지 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 최대 10글자까지만 입력 가능
    const value = e.target.value.slice(0, 10);
    setImageName(value);
  };

  const handleScaleChange = (value: number[]) => {
    setScale(value[0] / 100);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!imageName.trim()) {
      toast({
        variant: "destructive",
        title: "이름 필요",
        description: "이미지 이름을 입력해주세요.",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", imageName.trim());
      formData.append("scale", scale.toString());

      const response = await fetch("/api/images/chat-title", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "업로드에 실패했습니다.");
      }

      toast({
        title: "업로드 성공",
        description: "이미지가 성공적으로 업로드되었습니다.",
      });

      // 잠시 후 홈으로 리다이렉트
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "업로드 실패",
        description:
          error instanceof Error
            ? error.message
            : "업로드 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
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
          previewWidth={180}
          previewHeight={40}
          minWidth={180}
          maxWidth={220}
          minHeight={40}
          maxHeight={50}
        />
      </div>

      {imagePreview && (
        <div className="pt-4">
          <div className="flex items-center justify-center mb-2">
            <ArrowDown className="text-muted-foreground w-5 h-5" />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="text-sm font-medium mb-3">채팅창 미리보기</h3>
              <div className="border rounded-lg p-4 bg-background">
                <ChatTitleExample imageSrc={imagePreview} scale={scale} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Label>크기 조절</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
                <Slider
                  value={[scale * 100]}
                  onValueChange={handleScaleChange}
                  min={50}
                  max={90}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  * 이미지 크기를 조절해 채팅창에서의 모습을 확인해보세요. 최종
                  승인 시 관리자가 조정할 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
