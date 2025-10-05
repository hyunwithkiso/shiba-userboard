import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { fetchPackage, type TebexPackage } from "@/lib/tebex";
import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"; // 카테고리 표시용
import AddToCartForm from "@/components/add-to-cart-form"; // 새로 만든 컴포넌트 임포트
import { auth } from "@/lib/auth"; // auth 임포트
import { getUserBasketAction } from "@/actions/basket-action"; // 장바구니 정보 가져오기
import { CartSummary } from "@/components/cart/cart-summary"; // 장바구니 요약 컴포넌트 추가
import { getExchangeRate } from "@/lib/currency";
import PriceDisplay from "@/components/price-display";

type Props = {
  params: Promise<{ packageId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 동적 메타데이터 생성
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const packageId = (await params).packageId;
  const product = await fetchPackage(packageId);

  const description = product?.description
    ? product.description.replace(/<[^>]*>?/gm, "").substring(0, 150) // HTML 태그 제거 후 요약
    : "상품 상세 정보";

  return {
    title: product
      ? `${product.name} | SHIBA 상점`
      : "상품 정보 없음 | SHIBA 상점",
    description: description,
    openGraph: {
      title: product ? product.name : "상품 정보 없음",
      description: description,
      images: product?.image ? [{ url: product.image, alt: product.name }] : [],
    },
  };
}

// 물품 상세 페이지 컴포넌트 (레이아웃 수정)
export default async function PackageDetailPage({ params }: Props) {
  // --- 인증 체크 추가 ---
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const packageId = (await params).packageId;

  const product = await fetchPackage(packageId);

  if (!product) {
    notFound();
  }

  // 장바구니 정보 가져오기
  const basketResult = await getUserBasketAction();
  const basket = basketResult.success ? basketResult.data : null;

  const {
    id,
    name,
    description,
    image,
    price,
    total_price,
    currency,
    category,
  } = product;

  // 가격 및 통화 결정
  const displayPrice = total_price !== undefined ? total_price : price?.amount;
  const displayCurrency = currency || price?.currency;

  // 환율 정보 가져오기 (USD인 경우에만)
  let exchangeRate: number | undefined;
  if (displayCurrency === 'USD') {
    try {
      exchangeRate = await getExchangeRate();
    } catch (error) {
      console.warn('환율 정보를 가져오는데 실패했습니다:', error);
    }
  }

  return (
    // 가운데 정렬 및 최대 너비 설정
    <div className="container mx-auto max-w-6xl px-4 py-24 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 상품 이미지 */}
        <div className="lg:col-span-2">
          <div className="aspect-video md:aspect-square relative overflow-hidden rounded-lg border bg-card shadow-sm">
            {image ? (
              <Image
                src={image}
                alt={`${name} 상품 이미지`}
                fill
                className="object-contain p-4" // contain 및 padding 추가
                sizes="(max-width: 768px) 90vw, 45vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground rounded-lg">
                <span>이미지 없음</span>
              </div>
            )}
          </div>

          {/* 상품 정보 (이미지 아래 배치) */}
          <div className="flex flex-col space-y-4 mt-6">
            <div className="space-y-2">
              {/* 카테고리 (Badge 사용) */}
              {category?.name && (
                <Badge variant="outline">{category.name}</Badge>
              )}
              {/* 상품명 */}
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                {name}
              </h1>
            </div>

            {/* 가격 */}
            <PriceDisplay 
              price={displayPrice}
              currency={displayCurrency}
              exchangeRate={exchangeRate}
            />
          </div>

          <Separator className="my-6" />

          {/* 상품 설명 */}
          {description && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                상품 설명
              </h2>
              {/* prose-sm으로 가독성 확보, HTML 렌더링 */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          )}
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 수량 선택 및 장바구니 추가 (클라이언트 컴포넌트 사용) */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">상품 구매</h2>
            <AddToCartForm packageId={id} />
          </div>

          {/* 장바구니 요약 정보 표시 */}
          {basket && basket.packages && basket.packages.length > 0 && (
            <CartSummary basket={basket} className="shadow-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
