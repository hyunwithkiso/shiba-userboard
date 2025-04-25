"use client";

import React from "react";
import { DateRangeFilter } from "@/components/filter/date-range-filter";
import { SortFilter, SortOption } from "@/components/filter/sort-filter";
import { Button } from "@/components/ui/button";
import { FilterX, SlidersHorizontal, Calendar, Clock } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// 이벤트 정렬 옵션
export const eventsSortOptions: SortOption[] = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
  { label: "시작일 임박순", value: "start-soon" },
  { label: "마감일 임박순", value: "end-soon" },
];

// 이벤트 상태 옵션
export const eventStatusOptions: SortOption[] = [
  { label: "전체", value: "all" },
  { label: "진행 예정", value: "upcoming" },
  { label: "진행 중", value: "ongoing" },
  { label: "종료됨", value: "ended" },
];

interface EventFiltersProps {
  filterCount?: number;
}

export function EventFilters({ filterCount = 0 }: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 필터 초기화 함수
  const handleResetFilters = () => {
    const params = new URLSearchParams();
    // 페이지 파라미터만 유지 (필요하다면)
    const page = searchParams.get("page");
    if (page) {
      params.set("page", "1"); // 필터 초기화시 1페이지로
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // 이벤트 상태 변경 핸들러
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }

    // 페이지 파라미터 초기화
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  // 필터가 적용되어 있는지 확인
  const hasActiveFilters =
    searchParams.get("eventStartDate") ||
    searchParams.get("eventEndDate") ||
    searchParams.get("sort") ||
    searchParams.get("status");

  // 현재 상태 값
  const statusParam = searchParams.get("status") || "all";

  // 상태 레이블 가져오기
  const getStatusLabel = (value: string) => {
    const option = eventStatusOptions.find((opt) => opt.value === value);
    return option ? option.label : "전체";
  };

  return (
    <div className="rounded-lg border border-accent bg-gradient-to-b from-card/80 to-card/50 p-4 backdrop-blur-sm shadow-lg">
      {hasActiveFilters && (
        <div className="flex items-center justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            <FilterX className="mr-1 h-4 w-4" />
            초기화
          </Button>
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <Label htmlFor="status-select" className="text-sm font-medium">
                이벤트 상태
              </Label>
            </div>
            <Select value={statusParam} onValueChange={handleStatusChange}>
              <SelectTrigger
                id="status-select"
                className="h-9 bg-background/70"
              >
                <SelectValue placeholder="이벤트 상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {eventStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateRangeFilter
            startParamName="eventStartDate"
            endParamName="eventEndDate"
            className="lg:col-span-2"
          />

          <SortFilter
            options={eventsSortOptions}
            defaultValue="start-soon"
            paramName="sort"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-accent/30">
            <div className="text-xs text-muted-foreground/80">
              <span className="font-medium">적용된 필터:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {statusParam !== "all" && (
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    {getStatusLabel(statusParam)}
                  </span>
                )}
                {searchParams.get("eventStartDate") && (
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    {searchParams.get("eventStartDate")} 이후
                  </span>
                )}
                {searchParams.get("eventEndDate") && (
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    {searchParams.get("eventEndDate")} 이전
                  </span>
                )}
                {searchParams.get("sort") &&
                  searchParams.get("sort") !== "start-soon" && (
                    <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                      {eventsSortOptions.find(
                        (opt) => opt.value === searchParams.get("sort")
                      )?.label || ""}
                    </span>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
