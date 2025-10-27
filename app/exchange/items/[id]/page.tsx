import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getItemById, getPriceSeries, getRecentListings, getTradeHistory } from "@/services/exchange-mock";
import ItemDetailClient from "@/components/exchange/item-detail-client";

export const metadata: Metadata = {
  title: "거래소 상세 | SHIBA 유저보드",
};

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getItemById(id);
  if (!item) return notFound();

  const history = getPriceSeries(id, "1d");
  const listings = getRecentListings(id);
  const trades = getTradeHistory(id);

  return (
    <div className="container max-w-8xl mx-auto py-24">
      <ItemDetailClient item={item} history={history} listings={listings} trades={trades} />
    </div>
  );
}
