"use client";

import React from "react";
import { DateRangeFilter } from "@/components/filter/date-range-filter";
import { SortFilter, SortOption } from "@/components/filter/sort-filter";
import { Button } from "@/components/ui/button";
import { FilterX, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// 공지사항 정렬 옵션
export const noticesSortOptions: SortOption[] = [
  { label: "최신순", value: "latest" },
  { label: "오래된순", value: "oldest" },
  { label: "조회수 높은순", value: "most-viewed" },
  { label: "조회수 낮은순", value: "least-viewed" },
];

interface NoticeFiltersProps {
  filterCount?: number;
}

export function NoticeFilters({ filterCount = 0 }: NoticeFiltersProps) {
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

  // 필터가 적용되어 있는지 확인
  const hasActiveFilters =
    searchParams.get("startDate") ||
    searchParams.get("endDate") ||
    searchParams.get("sort");

  return (
    <div className="rounded-lg border border-accent bg-card/50 p-4 backdrop-blur-sm shadow-sm">
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

      <div className="grid gap-4 sm:grid-cols-2">
        <DateRangeFilter className="sm:col-span-1" />
        <SortFilter
          options={noticesSortOptions}
          defaultValue="latest"
          className="sm:col-span-1"
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-3 text-xs text-muted-foreground/80 flex items-center justify-end">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1">
            검색 조건이 적용됨
          </span>
        </div>
      )}
    </div>
  );
}
