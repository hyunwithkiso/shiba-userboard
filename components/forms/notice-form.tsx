"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import {
  createNoticeAction,
  updateNoticeAction,
} from "@/actions/notice-actions";

// Zod 스키마 (서버 액션과 동기화)
const formSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요.")
    .max(100, "제목은 100자 이내"),
  content: z.string().min(1, "내용을 입력해주세요."),
  isPinned: z.boolean().optional(),
});

type NoticeFormValues = z.infer<typeof formSchema>;

interface NoticeFormProps {
  mode: "create" | "edit";
  noticeId?: string; // Edit mode only
  initialData?: {
    // Edit mode only
    title: string;
    content: string;
    isPinned: boolean;
  };
}

export function NoticeForm({ mode, noticeId, initialData }: NoticeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      isPinned: initialData?.isPinned || false,
    },
  });

  const onSubmit = (values: NoticeFormValues) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("isPinned", String(values.isPinned ?? false));

      try {
        let result;
        if (mode === "create") {
          result = await createNoticeAction(formData);
        } else if (mode === "edit" && noticeId) {
          result = await updateNoticeAction(noticeId, formData);
        } else {
          throw new Error("Invalid form mode or missing noticeId");
        }

        if (result.success) {
          router.push(mode === "edit" ? `/notices/${noticeId}` : "/notices");
          router.refresh();
        } else {
          setError(result.error || "알 수 없는 오류가 발생했습니다.");
          if (result.errors) {
            Object.entries(result.errors).forEach(([key, value]) => {
              if (key === "title" || key === "content" || key === "isPinned") {
                form.setError(key, { message: value?.[0] || "Invalid value" });
              }
            });
          }
        }
      } catch (e) {
        console.error("Form submission error:", e);
        setError("요청 처리 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          placeholder="공지사항 제목을 입력하세요"
          {...form.register("title")}
          disabled={isPending}
          aria-invalid={form.formState.errors.title ? "true" : "false"}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* 내용 (Textarea) */}
      <div className="space-y-2">
        <Label htmlFor="content">내용 (Markdown)</Label>
        <Textarea
          id="content"
          placeholder="마크다운 형식으로 내용을 입력하세요..."
          {...form.register("content")}
          disabled={isPending}
          rows={15}
          className="min-h-[300px]"
          aria-invalid={form.formState.errors.content ? "true" : "false"}
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* 상단 고정 */}
      <div className="flex items-center space-x-2">
        <Switch
          id="isPinned"
          checked={form.watch("isPinned")}
          onCheckedChange={(checked) => form.setValue("isPinned", checked)}
          disabled={isPending}
          aria-label="상단 고정"
          {...form.register("isPinned")}
        />
        <Label htmlFor="isPinned">상단 고정</Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "공지 작성" : "수정 완료"}
      </Button>
    </form>
  );
}
