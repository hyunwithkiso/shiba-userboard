"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Clock, Info, Search } from "lucide-react";
import { formatKoreanPrice } from "@/lib/utils";
import Link from "next/link";
import { mockItems as allItems } from "@/services/exchange-mock";

type MapleItem = typeof allItems[number];

function formatNumber(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function MapleAuction() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"latest" | "priceAsc" | "priceDesc" | "name">("latest");

  const filtered = useMemo(() => {
    const nameMatch = (name: string) => name.toLowerCase().includes(search.toLowerCase());
    const catMatch = (c: string) => (category === "all" ? true : c === category);
    const priceMatch = (p: number) => {
      const min = minPrice ? Number(minPrice) : -Infinity;
      const max = maxPrice ? Number(maxPrice) : Infinity;
      return p >= min && p <= max;
    };
    let list = allItems.filter((i) => nameMatch(i.name) && catMatch(i.category) && priceMatch(i.price));
    switch (sort) {
      case "priceAsc":
        list = [...list].sort((a, b) => a.price - b.price); break;
      case "priceDesc":
        list = [...list].sort((a, b) => b.price - a.price); break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ko")); break;
      default:
        list = [...list].sort((a, b) => Number(b.id) - Number(a.id));
    }
    return list;
  }, [search, category, minPrice, maxPrice, sort]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      {/* 좌측 필터 패널 */}
      <Card className="h-fit sticky top-24">
        <CardHeader>
          <CardTitle className="text-base">빠른검색</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* 상단 대검색바 */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="아이템명으로 검색"
                className="pl-8"
              />
            </div>

            {/* 분류 */}
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label className="text-xs">아이템분류</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="무기">무기</SelectItem>
                    <SelectItem value="방어구">방어구</SelectItem>
                    <SelectItem value="소비아이템">소비아이템</SelectItem>
                    <SelectItem value="캐시아이템">캐시아이템</SelectItem>
                    <SelectItem value="기타아이템">기타아이템</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 가격 */}
            <div className="grid grid-cols-1 gap-2">
              <div>
                <Label className="text-xs">가격</Label>
                <div className="flex items-center gap-1">
                  <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="최소" className="h-8 text-xs" inputMode="numeric" />
                  <span className="text-xs text-muted-foreground">~</span>
                  <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="최대" className="h-8 text-xs" inputMode="numeric" />
                </div>
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <Label className="text-xs">정렬</Label>
              <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신 등록순</SelectItem>
                  <SelectItem value="priceAsc">가격 오름차순</SelectItem>
                  <SelectItem value="priceDesc">가격 내림차순</SelectItem>
                  <SelectItem value="name">이름순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" className="flex-1">초기화</Button>
              <Button className="flex-1">검색시작</Button>
            </div>

            <Separator />

            {/* 빠른 카테고리 */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">빠른 카테고리</div>
              <div className="flex flex-wrap gap-2">
                {[
                  "무기",
                  "소비아이템",
                  "캐시아이템",
                  "기타아이템",
                ].map((c) => (
                  <Button key={c} variant="secondary" className="h-7" onClick={() => setCategory(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 우측 결과 패널 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">검색결과 <span className="text-muted-foreground font-normal">· {filtered.length}건</span></CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[64px] text-center">{page} / 12</span>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => p + 1)}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[560px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>아이템</TableHead>
                  <TableHead className="w-[180px]">가격</TableHead>
                  <TableHead className="w-[140px]">월간 거래량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, idx) => (
                  <TableRow key={item.id} className={`hover:bg-muted/40 ${idx % 2 ? "bg-muted/20" : ""}`}>
                    <TableCell>
                      <Link href={`/exchange/items/${item.id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-muted" />
                        <div className="flex items-center gap-2">
                          {item.cash && <Badge variant="secondary" className="text-[10px]">W</Badge>}
                          <div>
                            <div className="font-medium leading-tight">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        {formatKoreanPrice(item.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        {item.monthlyTradeVolume}회
                        <div className="text-xs text-muted-foreground">최근 한달</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* 선택 영역 표시 (간단 버전) */}
          <div className="mt-4 rounded-md border p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5" /> 선택된 아이템이 없습니다. 목록에서 아이템을 선택해 주세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
