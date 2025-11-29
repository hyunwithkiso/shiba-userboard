"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Download, ArrowUpDown, CalendarDays, Search } from "lucide-react";

type GalleryItem = {
  id: string;
  url: string;
  title?: string | null;
  downloadCount?: number | null;
  createdAt?: string | Date | null;
  width?: number | null;
  height?: number | null;
};

function toDate(d?: string | Date | null) {
  if (!d) return null;
  try {
    return typeof d === "string" ? new Date(d) : d;
  } catch {
    return null;
  }
}

function daysAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function formatRelative(date?: Date | null) {
  if (!date) return "알 수 없음";
  const diffMin = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}년 전`;
}

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recommend" | "popular" | "latest">("recommend");
  const [range, setRange] = useState<"all" | "today" | "week" | "month">("all");

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isInRange = (d: Date | null) => {
      if (!d) return range === "all";
      switch (range) {
        case "today":
          return d >= startOfToday;
        case "week":
          return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "month":
          return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    };

    let list = items
      .map((it) => {
        const created = toDate(it.createdAt);
        return { ...it, createdAtDate: created };
      })
      .filter((it) => {
        const title = (it.title ?? "").toLowerCase();
        const q = query.toLowerCase();
        return title.includes(q) && isInRange(it.createdAtDate);
      });

    switch (sort) {
      case "popular":
        list.sort((a, b) => (b.downloadCount ?? 0) - (a.downloadCount ?? 0));
        break;
      case "latest":
        list.sort(
          (a, b) =>
            (b.createdAtDate?.getTime() ?? 0) - (a.createdAtDate?.getTime() ?? 0)
        );
        break;
      case "recommend":
      default: {
        // 간단 추천 점수: 다운로드*2 + 최근 보너스
        const score = (it: any) => {
          const dl = it.downloadCount ?? 0;
          const d = it.createdAtDate ? daysAgo(it.createdAtDate) : 9999;
          const recencyBonus =
            d <= 1 ? 12 : d <= 3 ? 8 : d <= 7 ? 6 : d <= 14 ? 3 : 0;
          return dl * 2 + recencyBonus;
        };
        list.sort((a, b) => score(b) - score(a));
        break;
      }
    }

    return list;
  }, [items, query, sort, range]);

  return (
    <div className="space-y-8">
      {/* 헤더 + 툴바 */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">DISCOVER</h1>
          <p className="text-muted-foreground">
            매일 새로운 작품들을 발견해 보세요. 💜
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="w-40">
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="h-9">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommend">추천순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="latest">최신순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Select value={range} onValueChange={(v) => setRange(v as any)}>
              <SelectTrigger className="h-9">
                <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="기간" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">이번주</SelectItem>
                <SelectItem value="month">이번달</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="작품 검색"
              className="pl-8 w-64 h-9"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-muted-foreground">조건에 맞는 작품이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((it) => {
            const created = toDate(it.createdAt);
            return (
              <div
                key={it.id}
                className="group relative rounded-lg border border-border overflow-hidden bg-card"
              >
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={it.url}
                    alt={(it.title ?? "gallery image") as string}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </AspectRatio>

                {/* 오버레이 */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/25 to-transparent text-white">
                  <div className="flex items-center justify-between">
                    <div className="truncate font-medium">
                      {it.title || "작품"}
                    </div>
                    <div className="flex items-center gap-2 opacity-90">
                      <Badge variant="secondary" className="bg-white/15 text-white">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        {(it.downloadCount ?? 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs opacity-80">
                    {formatRelative(created)}
                  </div>

                  {/* 액션 (호버 시 표시) */}
                  <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/api/gallery/download/${it.id}`} prefetch={false}>
                      <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/35">
                        다운로드
                      </Button>
                    </Link>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/35">
                        원본 열기
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}