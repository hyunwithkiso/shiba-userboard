"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from "lucide-react";

export interface SortOption {
  label: string;
  value: string;
}

interface SortFilterProps {
  className?: string;
  options: SortOption[];
  defaultValue?: string;
  paramName?: string;
}

export function SortFilter({
  className,
  options,
  defaultValue,
  paramName = "sort",
}: SortFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL에서 정렬 옵션 가져오기
  const sortParam = searchParams.get(paramName) || defaultValue;

  const handleSortChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }

      // 페이지 파라미터 초기화 (정렬 변경 시 1페이지로)
      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, paramName]
  );

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-4 w-4 text-primary" />
        <Label htmlFor="sort-select" className="text-sm font-medium">
          정렬
        </Label>
      </div>
      <Select value={sortParam || ""} onValueChange={handleSortChange}>
        <SelectTrigger
          id="sort-select"
          className="w-full h-9 bg-background/70 border-input/80"
        >
          <SelectValue placeholder="정렬 방식 선택" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="focus:bg-primary/10 focus:text-foreground data-[state=checked]:bg-primary/20"
            >
              <div className="flex items-center gap-2">
                {option.value.includes("old") ? (
                  <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ArrowUpAZ className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {option.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
