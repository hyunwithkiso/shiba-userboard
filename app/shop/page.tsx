import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchPackages } from "@/lib/tebex"; // Tebex API 함수 경로 확인
import ProductCard from "@/components/product-card"; // ProductCard 컴포넌트 경로 확인
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // 경로 수정
import { Skeleton } from "@/components/ui/skeleton"; // 경로 수정
import { auth } from "@/lib/auth"; // auth 임포트
import { redirect } from "next/navigation"; // redirect 임포트
import { basketService } from "@/services/basket-service"; // Import basket service
import { getBasket as getTebexBasket } from "@/lib/tebex"; // getTebexBasket import 추가
import { BasketAuthRequired } from "@/components/basket/basket-auth-required"; // 인증 필요 컴포넌트 import
import { BasketWelcome } from "@/components/basket/basket-welcome"; // 환영 메시지 컴포넌트 import
import { TebexAuthLink } from "@/lib/tebex"; // 타입 import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle2 } from "lucide-react";

// 페이지 메타데이터 설정
export const metadata: Metadata = {
  title: "상점 | SHIBA", // 사이트 이름에 맞게 수정하세요
  description: "SHIBA 서버의 다양한 상품을 만나보세요.", // 설명 수정 가능
};

// Revalidate 설정 (선택 사항): 주기적으로 데이터를 다시 가져올 시간 (초)
// 예: export const revalidate = 3600; // 1시간마다 캐시 갱신

// 로딩 스켈레톤 컴포넌트 (이전 코드 참고)
function StoreLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border bg-card">
          <Skeleton className="aspect-video w-full" /> {/* 비율 조정 */}
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 상품 목록을 비동기로 로드하고 표시하는 내부 컴포넌트
async function ProductList() {
  const packages = await fetchPackages();

  if (packages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
        <p className="text-muted-foreground">등록된 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {packages.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// 상점 페이지 메인 컴포넌트
export default async function ShopPage() {
  const session = await auth();
  console.log(session, "session");

  if (!session) {
    redirect("/login");
  }
  const userId = session.user?.id;
  if (!userId) {
    redirect("/login");
  }
  if (session.user && session.user?.nickname === null) {
    redirect("/init");
  }

  // --- 장바구니 생성 보장 ---
  try {
    console.log(`[ShopPage] Ensuring basket exists for user ${userId}...`);
    // ensureUserBasket은 userId가 필요할 수 있음 (내부 구현 확인 필요)
    const ensureResult = await basketService.ensureUserBasket(userId);
    if (!ensureResult.success) {
      console.error(
        `[ShopPage] Failed to ensure basket for user ${userId}:`,
        ensureResult.error
      );
    } else {
      console.log(`[ShopPage] Basket ensured for user ${userId}.`);
    }
  } catch (error) {
    console.error(
      `[ShopPage] Error ensuring basket for user ${userId}:`,
      error
    );
  }
  // --- 장바구니 생성 보장 끝 ---

  // --- 장바구니 정보 및 인증 상태 확인 ---
  let basketIdent: string | null = null;
  let fetchedBasketInfo: any = null;
  let authLinks: TebexAuthLink[] | null = null;
  let needsAuthentication = false;
  let authFetchError: string | null = null;
  let basketUsername: string | null = null; // username 저장 변수 추가

  try {
    const initialBasketData = await basketService.getUserBasket();
    if (
      initialBasketData &&
      typeof initialBasketData === "object" &&
      "ident" in initialBasketData &&
      typeof initialBasketData.ident === "string"
    ) {
      basketIdent = initialBasketData.ident;
      console.log(
        `[ShopPage] Retrieved Basket Identifier for user ${userId}:`,
        basketIdent
      );

      if (basketIdent) {
        try {
          fetchedBasketInfo = await getTebexBasket(basketIdent);
          console.log(
            `[ShopPage] Fetched Basket Info via ident (${basketIdent}):`,
            fetchedBasketInfo
          );

          if (fetchedBasketInfo) {
            basketUsername = fetchedBasketInfo.username; // username 추출
            if (basketUsername === null) {
              console.log(
                `[ShopPage] Basket ${basketIdent} needs authentication (username is null).`
              );
              needsAuthentication = true;
              try {
                const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shop`;
                authLinks = await basketService.getBasketAuthUrl(
                  basketIdent,
                  returnUrl
                );
                if (!authLinks || authLinks.length === 0) {
                  throw new Error("No auth links returned from service.");
                }
              } catch (authError) {
                console.error(
                  `[ShopPage] Failed to fetch auth links for basket ${basketIdent}:`,
                  authError
                );
                authFetchError =
                  authError instanceof Error
                    ? authError.message
                    : "인증 링크를 가져오는 중 오류 발생";
                needsAuthentication = false;
              }
            }
          } else {
            // getTebexBasket이 null을 반환한 경우 (예: 404)
            console.warn(
              `[ShopPage] Basket info not found for ident ${basketIdent}`
            );
            // 이 경우, ident는 있지만 실제 장바구니가 없는 상태. 필요시 추가 처리.
          }
        } catch (fetchError) {
          console.error(
            `[ShopPage] Error fetching basket details with ident ${basketIdent}:`,
            fetchError
          );
        }
      }
    } else {
      console.warn(
        `[ShopPage] Could not retrieve valid basket data or ident for user ${userId}. Received:`,
        initialBasketData
      );
    }
  } catch (error) {
    console.error(
      `[ShopPage] Error in initial basket retrieval/fetching process for user ${userId}:`,
      error
    );
  }
  // --- 장바구니 조회 끝 ---

  // 카테고리 로딩은 추후 추가

  return (
    <div className="min-h-screen bg-background">
      {/* 상점 헤더 (이전 코드 참고) */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-cyan-800/70 to-blue-900/80 z-0" />
        <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-20 mix-blend-soft-light z-0" />

        {/* 장식 요소 */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse z-0"></div>
        <div className="absolute bottom-10 left-1/4 w-3 h-3 bg-blue-300 rounded-full shadow-lg shadow-blue-500/50 z-0">
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-300 opacity-75"></div>
        </div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 z-0">
          <div className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-75 animation-delay-1000"></div>
        </div>

        <div className="container relative mx-auto px-4 py-16 md:py-24 z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-blue-500/30 p-3 rounded-lg backdrop-blur-sm border border-blue-500/40 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z"></path>
                <path d="m3.09 8.84 12.35-6.61a1.93 1.93 0 0 1 1.81 0l3.65 1.9a2.12 2.12 0 0 1 .1 3.69L8.73 14.75a2 2 0 0 1-1.94 0L3 12.51a2.12 2.12 0 0 1 .09-3.67Z"></path>
                <line x1="12" y1="22" x2="12" y2="13"></line>
                <path d="M20 13.5v3.37a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13.5"></path>
              </svg>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              SHIBA{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                상점
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto">
              게임 내 아이템, 스킨, 패키지 등 다양한 상품을 구매하실 수
              있습니다.
            </p>
          </div>
        </div>

        {/* 장식적 요소 - 배너 하단 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600"></div>
      </section>

      {/* 안내 섹션 (이전 코드 참고) */}
      <section className="border-b bg-blue-900/5 backdrop-blur-sm">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              구매 안내
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* VAT 안내 카드 */}
            <Card className="bg-background/80 border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-shadow h-full">
              <CardHeader className="flex flex-row items-start space-x-4 pb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                    <path d="M13 5v2M13 17v2M13 11v2" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg mb-1 text-blue-800 dark:text-blue-300">
                    부가가치세(VAT) 안내
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    모든 제품의 구매 가격에는 10%의 부가세가 포함되어 있습니다.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
            {/* 결제 안내 카드 */}
            <Card className="bg-background/80 border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-shadow h-full">
              <CardHeader className="flex flex-row items-start space-x-4 pb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg mb-1 text-blue-800 dark:text-blue-300">
                    결제 안내
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    PayPal, 카카오페이, 신용카드로 결제 가능하며, USD 기준으로
                    결제됩니다.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
            {/* 수령 안내 카드 */}
            <Card className="bg-background/80 border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-shadow h-full">
              <CardHeader className="flex flex-row items-start space-x-4 pb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 border border-blue-500/20 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg mb-1 text-blue-800 dark:text-blue-300">
                    수령 안내
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    구매 후 최대 5분 이내에 게임 내에서 아이템을 수령하실 수
                    있습니다.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 상품 목록 섹션 */}
      <section className="container mx-auto py-12 px-4">
        <div className="space-y-8">
          {/* 섹션 헤더 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                상품 목록
              </h2>
              <p className="text-muted-foreground">
                다양한 게임 아이템과 패키지를 둘러보세요
              </p>
            </div>
            {/* 카테고리 필터 등은 추후 추가 */}
          </div>

          {/* 인증 완료 환영 메시지 또는 인증 요구 메시지 또는 오류 메시지 */}
          {
            needsAuthentication && authLinks ? (
              <BasketAuthRequired
                authLinks={authLinks}
                basketIdent={basketIdent!}
              />
            ) : authFetchError ? (
              <Alert variant="destructive" className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{authFetchError}</AlertDescription>
              </Alert>
            ) : basketUsername ? (
              <BasketWelcome basketUsername={basketUsername} />
            ) : null /* basketUsername도 없고 인증 필요도 아닌 경우 (예: 초기 로딩 실패)는 아무것도 표시 안 함 */
          }

          {/* 상품 목록 (인증 완료 시에만 표시) */}
          {!needsAuthentication && !authFetchError && basketUsername && (
            <Suspense fallback={<StoreLoadingSkeleton />}>
              <ProductList />
            </Suspense>
          )}
        </div>
      </section>
    </div>
  );
}
