"use client";

import * as React from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DateRangeFilterProps {
  className?: string;
  startParamName?: string;
  endParamName?: string;
}

export function DateRangeFilter({
  className,
  startParamName = "startDate",
  endParamName = "endDate",
}: DateRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL에서 날짜 파라미터 가져오기
  const startDateParam = searchParams.get(startParamName);
  const endDateParam = searchParams.get(endParamName);

  // 날짜 범위 상태
  const [date, setDate] = React.useState<DateRange | undefined>(() => {
    if (startDateParam || endDateParam) {
      return {
        from: startDateParam ? new Date(startDateParam) : undefined,
        to: endDateParam ? new Date(endDateParam) : undefined,
      };
    }
    return undefined;
  });

  // 필터 적용 함수
  const applyFilter = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // 날짜 파라미터 설정
    if (date?.from) {
      params.set(startParamName, format(date.from, "yyyy-MM-dd"));
    } else {
      params.delete(startParamName);
    }

    if (date?.to) {
      params.set(endParamName, format(date.to, "yyyy-MM-dd"));
    } else {
      params.delete(endParamName);
    }

    // 페이지 파라미터 초기화 (필터 변경 시 1페이지로)
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  }, [date, router, pathname, searchParams, startParamName, endParamName]);

  // 필터 초기화 함수
  const resetFilter = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(startParamName);
    params.delete(endParamName);

    // 페이지 파라미터 초기화
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
    setDate(undefined);
  }, [router, pathname, searchParams, startParamName, endParamName]);

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="h-4 w-4 text-primary" />
        <Label htmlFor="date-range" className="text-sm font-medium">
          기간 선택
        </Label>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-9 bg-background/70 border-input/80",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "yyyy-MM-dd")} ~{" "}
                  {format(date.to, "yyyy-MM-dd")}
                </>
              ) : (
                format(date.from, "yyyy-MM-dd")
              )
            ) : (
              <span>날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-accent" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ko}
            className="bg-card"
          />
          <div className="flex items-center justify-between p-3 border-t border-accent/30 bg-card">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilter}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              초기화
            </Button>
            <Button
              size="sm"
              onClick={applyFilter}
              className="bg-primary/90 hover:bg-primary"
            >
              적용
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
