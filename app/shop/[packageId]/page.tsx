import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { fetchPackage, type TebexPackage } from "@/lib/tebex";
import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge"; // 카테고리 표시용
import AddToCartForm from "@/components/add-to-cart-form"; // 새로 만든 컴포넌트 임포트
import { auth } from "@/lib/auth"; // auth 임포트

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

  return (
    // 가운데 정렬 및 최대 너비 설정
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="flex flex-col space-y-8">
        {/* 상품 이미지 */}
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
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            {/* 카테고리 (Badge 사용) */}
            {category?.name && <Badge variant="outline">{category.name}</Badge>}
            {/* 상품명 */}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {name}
            </h1>
          </div>

          {/* 가격 */}
          <span className="text-4xl font-bold text-primary">
            {formatPrice(displayPrice, displayCurrency)}
          </span>
        </div>

        <Separator />

        {/* 수량 선택 및 장바구니 추가 (클라이언트 컴포넌트 사용) */}
        <AddToCartForm packageId={id} />

        <Separator />

        {/* 상품 설명 */}
        {description && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">상품 설명</h2>
            {/* prose-sm으로 가독성 확보, HTML 렌더링 */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
