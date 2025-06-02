"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, setHours, setMinutes, parse } from "date-fns";
import { ImageUpload } from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CalendarIcon } from "lucide-react";
import { createEventAction, updateEventAction } from "@/actions/event-actions";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Zod 스키마 (서버 액션과 동기화)
const formSchema = z
  .object({
    title: z
      .string()
      .min(1, "제목을 입력해주세요.")
      .max(100, "제목은 100자 이내"),
    content: z.string().min(1, "내용을 입력해주세요."),
    thumbnailImage: z
      .string()
      .url("유효한 URL이어야 합니다.")
      .or(z.literal(""))
      .optional(),
    startDate: z.date({
      errorMap: () => ({ message: "유효한 시작일을 입력해주세요." }),
    }),
    endDate: z.date({
      errorMap: () => ({ message: "유효한 종료일을 입력해주세요." }),
    }),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "종료일은 시작일보다 빠를 수 없습니다.",
    path: ["endDate"],
  });

type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: {
    title: string;
    content: string;
    thumbnailImage: string | null;
    startDate?: Date;
    endDate?: Date;
    isPinned: boolean;
  };
}

export function EventForm({ mode, eventId, initialData }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.thumbnailImage || null
  );

  // 기본 날짜 설정 (현재 시간 + 1시간)
  const getDefaultStartDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0); // 1시간 후, 분/초는 0으로
    return now;
  };

  const getDefaultEndDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2, 0, 0, 0); // 2시간 후, 분/초는 0으로
    return now;
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      thumbnailImage: initialData?.thumbnailImage || "",
      startDate: initialData?.startDate || getDefaultStartDate(),
      endDate: initialData?.endDate || getDefaultEndDate(),
      isPinned: initialData?.isPinned || false,
    },
  });

  useEffect(() => {
    form.setValue("thumbnailImage", imageUrl ?? "");
  }, [imageUrl, form]);

  const onSubmit = (values: EventFormValues) => {
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("content", values.content);
      formData.append("thumbnailImage", values.thumbnailImage || "");
      formData.append("startDate", values.startDate.toISOString());
      formData.append("endDate", values.endDate.toISOString());
      formData.append("isPinned", String(values.isPinned ?? false));

      try {
        let result;
        if (mode === "create") {
          result = await createEventAction(formData);
        } else if (mode === "edit" && eventId) {
          result = await updateEventAction(eventId, formData);
        } else {
          throw new Error("Invalid form mode or missing eventId");
        }

        console.log(result);

        if (result.success) {
          router.push(mode === "edit" ? `/events/${eventId}` : "/events");
          router.refresh();
        } else {
          setError(result.error || "알 수 없는 오류가 발생했습니다.");
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, messages]) => {
              if (
                field === "title" ||
                field === "content" ||
                field === "thumbnailImage" ||
                field === "startDate" ||
                field === "endDate" ||
                field === "isPinned"
              ) {
                form.setError(field as keyof EventFormValues, {
                  type: "manual",
                  message: (messages as string[]).join(", "),
                });
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

  // DateTime Picker 컴포넌트 (내부 사용)
  const DateTimePicker = ({ field }: { field: any }) => {
    const [time, setTime] = useState(
      field.value ? format(field.value, "HH:mm") : "09:00" // 초기 시간값 설정
    );
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleDateSelect = (selectedDate: Date | undefined) => {
      if (!selectedDate) return;
      try {
        const [hours, minutes] = time.split(":").map(Number);
        let newDate = setHours(selectedDate, hours);
        newDate = setMinutes(newDate, minutes);
        field.onChange(newDate);
        setPopoverOpen(false); // 날짜 선택 후 Popover 닫기
      } catch (err) {
        console.error("Error setting date with time:", err);
        form.setError(field.name, { message: "유효한 시간이 아닙니다." });
      }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;
      setTime(newTime);
      // 시간 변경 시에도 Date 객체 업데이트 시도
      if (field.value) {
        try {
          const [hours, minutes] = newTime.split(":").map(Number);
          if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            let currentVal =
              field.value instanceof Date ? field.value : new Date();
            let newDate = setHours(currentVal, hours);
            newDate = setMinutes(newDate, minutes);
            field.onChange(newDate);
            form.clearErrors(field.name);
          } else {
            form.setError(field.name, { message: "유효한 시간이 아닙니다." });
          }
        } catch {
          form.setError(field.name, { message: "유효한 시간이 아닙니다." });
        }
      }
    };

    return (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
            disabled={isPending}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? (
              format(field.value, "yyyy-MM-dd HH:mm")
            ) : (
              <span>날짜 및 시간 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={handleDateSelect}
            initialFocus
            disabled={isPending}
          />
          <div className="p-3 border-t border-border">
            <Label htmlFor={`${field.name}-time`} className="text-sm">
              시간 (HH:mm)
            </Label>
            <Input
              id={`${field.name}-time`}
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="mt-1"
              disabled={isPending}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">이벤트 제목</Label>
        <Input
          id="title"
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

      {/* 썸네일 이미지 */}
      <div className="space-y-2">
        <Label>썸네일 이미지</Label>
        <ImageUpload
          initialImageUrl={imageUrl}
          onUploadComplete={setImageUrl}
          disabled={isPending}
        />
        <input type="hidden" {...form.register("thumbnailImage")} />
        {form.formState.errors.thumbnailImage && (
          <p className="text-sm text-destructive">
            {form.formState.errors.thumbnailImage.message}
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

      {/* 이벤트 기간 (DateTime Picker) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일시</Label>
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => <DateTimePicker field={field} />}
          />
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일시</Label>
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => <DateTimePicker field={field} />}
          />
          {/* endDate 유효성 검사 메시지 표시 */}
          {form.formState.errors.endDate && (
            <p className="text-sm text-destructive">
              {form.formState.errors.endDate.message}
            </p>
          )}
          {/* 시작/종료일 비교 에러 메시지 (refine) - 루트 에러로 나올 수 있음 */}
          {form.formState.errors.root?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>
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

      <Button
        onClick={() => {
          startTransition(async () => {
            await onSubmit(form.getValues());
          });
        }}
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "이벤트 작성" : "수정 완료"}
      </Button>
    </form>
  );
}
