"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";
import { ArrowLeft, Clock, ShoppingCart } from "lucide-react";
import type { ExchangeItem, PricePoint, Listing, Granularity, Trade } from "@/services/exchange-mock";
import { getPriceSeries } from "@/services/exchange-mock";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatKoreanPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function ItemDetailClient({
  item,
  history,
  listings,
  trades,
}: {
  item: ExchangeItem;
  history: PricePoint[];
  listings: Listing[];
  trades: Trade[];
}) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [tableView, setTableView] = useState<"listings" | "trades">("listings");
  const [listingRows, setListingRows] = useState<Listing[]>(listings);
  const [tradeRows, setTradeRows] = useState<Trade[]>(trades);
  const [buyOpen, setBuyOpen] = useState(false);
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [buyQty, setBuyQty] = useState(1);
  const series = useMemo(() => getPriceSeries(item.id, granularity), [item.id, granularity]);
  const prices = series.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const last = series[series.length - 1]?.price || item.price;

  const fmt = (n: number) => formatKoreanPrice(n);

  const openBuy = (l: Listing) => {
    setActiveListing(l);
    setBuyQty(1);
    setBuyOpen(true);
  };

  const confirmBuy = () => {
    if (!activeListing) return;
    const qty = Math.max(1, Math.min(buyQty, activeListing.quantity));
    // 거래 내역 갱신
    const newTrade: Trade = {
      id: `${activeListing.id}-buy-${Date.now()}`,
      time: new Date().toISOString(),
      price: activeListing.price,
      quantity: qty,
      type: "즉시구매",
      buyer: "You",
      seller: activeListing.seller,
    };
    setTradeRows((prev) => [newTrade, ...prev].slice(0, 50));
    // 재고 감소 / 제거
    setListingRows((prev) =>
      prev
        .map((row) =>
          row.id === activeListing.id ? { ...row, quantity: row.quantity - qty } : row
        )
        .filter((row) => row.quantity > 0)
    );
    toast.success("구매가 완료되었습니다.");
    setBuyOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/exchange" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> 목록으로
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <div className="text-sm text-muted-foreground">{item.category}</div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-muted" />
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {item.name}
                {item.cash && <Badge variant="secondary">W</Badge>}
              </CardTitle>
              <div className="text-sm text-muted-foreground">최근가 {formatKoreanPrice(last)}</div>
            </div>
          </div>
          <Button asChild>
            <Link href={`/exchange`}>거래소로 돌아가기</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryBox label="최저가" value={min} />
            <SummaryBox label="최고가" value={max} />
            <SummaryBox label="평균가" value={avg} />
            <SummaryBox label="현재가" value={last} highlight />
          </div>

          {/* 시세 차트 */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">시세 추이</div>
            <div className="rounded-md border p-0.5">
              <div className="grid grid-cols-3 gap-0">
                {(["hour","day","month"] as Granularity[]).map((g) => (
                  <Button
                    key={g}
                    size="sm"
                    variant={granularity === g ? "default" : "ghost"}
                    onClick={() => setGranularity(g)}
                    className="px-3"
                  >
                    {g === "hour" ? "시간별" : g === "day" ? "일별" : "월별"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <ChartContainer
            className="w-full aspect-auto h-[340px] text-sm"
            config={{ price: { label: "가격", color: "#22d3ee" } }}
          >
            <AreaChart data={series} margin={{ left: 12, right: 12, top: 12, bottom: 8 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tickLine={false} axisLine={false} width={76} tickFormatter={(v) => formatKoreanPrice(Number(v))} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(v) => (<span>{formatKoreanPrice(Number(v as number))}</span>)} />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 2.2, strokeWidth: 0 }}
                activeDot={{ r: 3.2 }}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ChartContainer>

          {/* 테이블 영역: 탭 전환 */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="rounded-md border p-0.5">
                <div className="grid grid-cols-2">
                  <Button size="sm" variant={tableView === "listings" ? "default" : "ghost"} onClick={() => setTableView("listings")}>
                    최근 등록
                  </Button>
                  <Button size="sm" variant={tableView === "trades" ? "default" : "ghost"} onClick={() => setTableView("trades")}>
                    거래 내역
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {tableView === "listings" ? `총 ${listingRows.length}건` : `최근 ${tradeRows.length}건`}
              </div>
            </div>

            {tableView === "listings" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>판매자</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingRows.map((l, idx) => (
                    <TableRow key={idx} className={idx % 2 ? "bg-muted/20" : undefined}>
                      <TableCell className="font-medium">{l.seller}</TableCell>
                      <TableCell>{l.quantity}</TableCell>
                      <TableCell className="font-mono">{formatKoreanPrice(l.price)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gap-1" onClick={() => openBuy(l)}>
                          <ShoppingCart className="w-4 h-4" /> 구매
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>총액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeRows.map((t, idx) => (
                    <TableRow key={idx} className={idx % 2 ? "bg-muted/20" : undefined}>
                      <TableCell className="whitespace-nowrap">{new Date(t.time).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell className="text-muted-foreground">{t.type}</TableCell>
                      <TableCell className="font-mono">{formatKoreanPrice(t.price)}</TableCell>
                      <TableCell>{t.quantity}</TableCell>
                      <TableCell className="font-mono">{formatKoreanPrice(t.price * t.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* 구매 다이얼로그 */}
          <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>구매 확인</DialogTitle>
                <DialogDescription>
                  선택한 등록건을 즉시구매합니다. 결제는 데모 동작입니다.
                </DialogDescription>
              </DialogHeader>
              {activeListing && (
                <div className="space-y-3">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">판매자</div>
                      <div className="font-medium">{activeListing.seller}</div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-muted-foreground">가격</div>
                      <div className="font-mono">{fmt(activeListing.price)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">수량 (재고 {activeListing.quantity})</div>
                      <Input type="number" min={1} max={activeListing.quantity} value={buyQty}
                        onChange={(e) => setBuyQty(Number(e.target.value || 1))} />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">총액</div>
                      <div className="text-lg font-semibold font-mono">{fmt(activeListing.price * Math.max(1, Math.min(buyQty, activeListing.quantity)))}</div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setBuyOpen(false)}>취소</Button>
                <Button onClick={confirmBuy} className="gap-1">
                  <ShoppingCart className="w-4 h-4" /> 구매하기
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryBox({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? "text-primary" : ""}`}>{formatKoreanPrice(value)}</div>
    </div>
  );
}
