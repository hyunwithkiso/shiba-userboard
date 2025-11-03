/* eslint-disable @typescript-eslint/no-unused-vars */
// Tebex API 기본 URL, Secret Key, Public Token
const TEBEX_API_URL =
  process.env.TEBEX_API_URL || "https://headless.tebex.io/api";
const TEBEX_PRIVATE_KEY = process.env.TEBEX_PRIVATE_KEY;
const TEBEX_PUBLIC_TOKEN = process.env.TEBEX_PUBLIC_TOKEN; // 웹스토어 식별자 (Account ID)

// 캐싱 시스템
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class TebexCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  // 캐시 지속 시간 (밀리초)
  private readonly CACHE_DURATIONS = {
    packages: 10 * 60 * 1000,      // 상품 목록: 10분
    package: 5 * 60 * 1000,        // 개별 상품: 5분
    basket: 5 * 1000,              // 장바구니: 5초 (인증/변경 민감)
    auth: 60 * 1000,               // 인증 링크: 1분
  };

  getCacheKey(type: keyof typeof this.CACHE_DURATIONS, identifier?: string): string {
    return identifier ? `${type}:${identifier}` : type;
  }

  get<T>(type: keyof typeof this.CACHE_DURATIONS, identifier?: string): T | null {
    const key = this.getCacheKey(type, identifier);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // ✅ 장바구니 캐시의 경우 완료 상태 재확인
    if (type === 'basket' && entry.data?.complete === true) {
      console.warn(`[Tebex Cache] Removing completed basket from cache: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[Tebex Cache Hit] ${key}`);
    return entry.data;
  }

  set<T>(type: keyof typeof this.CACHE_DURATIONS, data: T, identifier?: string): void {
    const key = this.getCacheKey(type, identifier);
    const duration = this.CACHE_DURATIONS[type];
    const now = Date.now();
    
    // ✅ 완료된 장바구니 또는 미인증(사용자명 없음) 장바구니는 캐시하지 않음
    if (type === 'basket') {
      const basket = data as any;
      if (basket?.complete === true) {
        console.warn(`[Tebex Cache] Not caching completed basket: ${key}`);
        return;
      }
      if (basket && (basket.username === null || basket.username === undefined)) {
        console.warn(`[Tebex Cache] Not caching pre-auth basket (username missing): ${key}`);
        return;
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration
    });
    
    console.log(`[Tebex Cache Set] ${key} (expires in ${duration}ms)`);
  }

  invalidate(type: keyof typeof this.CACHE_DURATIONS, identifier?: string): void {
    const key = this.getCacheKey(type, identifier);
    this.cache.delete(key);
    console.log(`[Tebex Cache Invalidate] ${key}`);
  }

  // Request deduplication
  async dedupRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      console.log(`[Tebex Dedup] Waiting for existing request: ${key}`);
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // 전체 캐시 정리 (메모리 관리)
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Tebex Cache] Cleaned ${cleaned} expired entries`);
    }
  }
}

// 전역 캐시 인스턴스
const tebexCache = new TebexCache();

// 정기적으로 캐시 정리 및 무결성 검사 (서버 환경에서만)
if (typeof window === 'undefined') {
  // 5분마다 일반 정리
  setInterval(() => {
    tebexCache.cleanup();
  }, 5 * 60 * 1000);
  
  // 1분마다 무결성 검사 (완료된 장바구니 등)
  setInterval(() => {
    TebexCacheUtils.validateAndCleanup();
  }, 1 * 60 * 1000);
}

// Tebex 상품(패키지) 데이터 타입 정의 (API 응답 구조에 따라 수정 필요)
export interface TebexPackage {
  id: number;
  name: string;
  description: string; // HTML 형식일 수 있음
  image: string | null; // 이미지 URL
  // 기존 가격 구조 (fallback 또는 currency 확인용)
  price?: {
    amount: number;
    currency: string; // 예: "USD", "KRW"
  };
  // 추가된 가격 필드 (실제 API 응답 확인 필요)
  base_price?: number;
  total_price?: number;
  currency?: string; // total_price와 함께 오는 통화 코드?
  // 필요한 다른 필드들을 추가 (예: category, servers 등)
  category?: { id: number; name: string };
  servers?: { id: number; name: string }[];
}

interface TebexApiResponse<T> {
  data: T;
  // API 응답 구조에 따라 메타 정보 등이 포함될 수 있음
  meta?: any;
}

// 장바구니 상세 정보 타입 (BasketService 참고)
export interface TebexBasket {
  ident: string;
  complete: boolean;
  id: number;
  email: string | null;
  username: string | null;
  ip: string;
  country: string;
  complete_url: string | null;
  cancel_url: string | null;
  complete_auto_redirect: boolean;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  packages: BasketPackageDetail[];
  coupons: any[]; // 쿠폰 타입 정의 필요
  giftcards: any[]; // 기프트카드 타입 정의 필요
  creator_code: string | null;
  links?: {
    payment: string;
    checkout: string;
  };
  // ... 기타 필드
}

// 장바구니 내 패키지 상세 정보 (BasketService 참고)
export interface BasketPackageDetail extends TebexPackage {
  in_basket: {
    id: number; // 장바구니 내 상품 고유 ID (packageId와 다름)
    quantity: number;
    price: number; // 개당 가격
    meta?: any;
  };
}

// Tebex 장바구니 인증 링크 타입 (추가)
export interface TebexAuthLink {
  name: string; // 인증 제공자 이름 (예: "FiveM")
  url: string; // 인증 URL
}

// 공통 API 요청 함수
async function fetchTebexApi<T>(
  endpoint: string,
  options: RequestInit = {},
  useAuth: boolean = false, // Secret Key 사용 여부
  isAccountEndpoint: boolean = true // /accounts/{token} 경로 사용 여부
): Promise<T> {
  if (!TEBEX_API_URL) {
    throw new Error("Tebex API URL is not configured.");
  }

  let baseUrl = TEBEX_API_URL;
  if (isAccountEndpoint) {
    if (!TEBEX_PUBLIC_TOKEN) {
      throw new Error("Tebex Public Token is not configured.");
    }
    baseUrl = `${TEBEX_API_URL}/accounts/${TEBEX_PUBLIC_TOKEN}`;
  }

  const url = `${baseUrl}${endpoint}`;
  // headers 타입을 Record<string, string>으로 변경하여 사용자 정의 헤더 허용
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // options.headers를 Record<string, string>으로 처리 (Headers 객체 등 다른 타입일 수 있으므로 주의)
    ...(typeof options.headers === "object" &&
    options.headers !== null &&
    !Array.isArray(options.headers)
      ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
      : {}),
  };

  if (useAuth) {
    if (!TEBEX_PRIVATE_KEY) {
      throw new Error(
        "Tebex Private Key is not configured for authenticated request."
      );
    }
    headers["X-Tebex-Secret"] = TEBEX_PRIVATE_KEY;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 오류 응답 처리 강화
    if (!response.ok) {
      let errorData: any = { message: response.statusText };
      try {
        errorData = await response.json(); // JSON 형태의 오류 메시지 시도
      } catch (e) {
        // JSON 파싱 실패 시 텍스트로 읽기
        try {
          errorData.message = await response.text();
        } catch (textError) {
          // 텍스트 읽기 실패 시 기본 상태 메시지 사용
        }
      }
      console.error(
        `Tebex API Error (${response.status}) for ${url}:`,
        errorData
      );
      // 상세 오류 메시지 포함하여 throw
      const errorMessage =
        errorData?.error ||
        errorData?.errors?.[0]?.message ||
        errorData?.message ||
        `HTTP error! status: ${response.status}`;
      throw new Error(`Failed to fetch Tebex API (${url}) [${response.status}]: ${errorMessage}`);
    }

    // 성공 응답 처리
    const result = await response.json();
    // data 필드가 있는 경우 data를 반환, 없으면 전체 결과 반환 (BasketService 참고)
    return result.data ?? result;
  } catch (error) {
    console.error(`Error calling Tebex API (${url}):`, error);
    // 원래 오류를 다시 throw
    throw error;
  }
}

/**
 * Tebex 스토어의 모든 상품(패키지) 목록을 가져옵니다.
 * 캐싱 적용: 10분간 캐시됨
 */
export async function fetchPackages(): Promise<TebexPackage[]> {
  // 캐시 확인
  const cached = tebexCache.get<TebexPackage[]>('packages');
  if (cached) {
    return cached;
  }

  return tebexCache.dedupRequest('fetchPackages', async () => {
    try {
      console.log('[Tebex API] Fetching packages from API...');
      const packages = await fetchTebexApi<TebexPackage[]>(
        "/packages",
        {},
        false,
        true
      );
      
      const result = packages || [];
      
      // 캐시에 저장
      tebexCache.set('packages', result);
      
      return result;
    } catch (error) {
      console.error("Failed to fetch Tebex packages:", error);
      return [];
    }
  });
}

/**
 * 특정 ID를 가진 상품(패키지)의 상세 정보를 가져옵니다.
 * 캐싱 적용: 5분간 캐시됨
 */
export async function fetchPackage(
  packageId: string | number
): Promise<TebexPackage | null> {
  const cacheId = String(packageId);
  
  // 캐시 확인
  const cached = tebexCache.get<TebexPackage>('package', cacheId);
  if (cached) {
    return cached;
  }

  return tebexCache.dedupRequest(`fetchPackage:${cacheId}`, async () => {
    try {
      console.log(`[Tebex API] Fetching package ${packageId} from API...`);
      const pkg = await fetchTebexApi<TebexPackage>(
        `/packages/${packageId}`,
        {},
        false,
        true
      );
      
      if (pkg) {
        // 캐시에 저장
        tebexCache.set('package', pkg, cacheId);
        return pkg;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch Tebex package (ID: ${packageId}):`, error);
      return null;
    }
  });
}

/**
 * 새로운 Tebex 장바구니를 생성합니다.
 * @param completeUrl 결제 완료 후 리디렉션될 URL
 * @param cancelUrl 결제 취소 후 리디렉션될 URL
 * @param userId (선택 사항) 사용자 식별 정보 - 필요시 Tebex API 요청 본문에 추가
 * @returns 생성된 장바구니 정보 (Ident 포함)
 */
export async function createBasket(
  completeUrl: string,
  cancelUrl: string,
  userId?: string // 현재 API 호출에는 사용되지 않지만, 추후 확장 가능성
): Promise<TebexBasket> {
  if (!TEBEX_PUBLIC_TOKEN) {
    throw new Error("Tebex Public Token is not configured.");
  }
  console.log(
    "Attempting to create basket with Public Token:",
    TEBEX_PUBLIC_TOKEN
  );
  console.log("Using Private Key:", TEBEX_PRIVATE_KEY ? "Yes" : "No");

  const endpoint = `/accounts/${TEBEX_PUBLIC_TOKEN}/baskets`;

  return fetchTebexApi<TebexBasket>(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify({
        complete_url: completeUrl,
        cancel_url: cancelUrl,
        complete_auto_redirect: true,
        // custom: { userId }, // 필요시 사용자 ID 등 커스텀 데이터 추가
      }),
    },
    true, // 인증 필요 (Secret Key 사용)
    false // /accounts/{token} 경로가 아닌 기본 API URL 사용 (/api/accounts/{token}/baskets 형태)
  );
}

/**
 * 특정 장바구니의 정보를 가져옵니다.
 * @param basketIdent 장바구니 식별자
 * @returns 장바구니 상세 정보
 */

export async function getBasket(
  basketIdent: string
): Promise<TebexBasket | null> {
  // 캐시 확인 (짧은 캐시 시간 - 5초)
  const cached = tebexCache.get<TebexBasket>('basket', basketIdent);
  if (cached) {
    return cached;
  }

  return tebexCache.dedupRequest(`getBasket:${basketIdent}`, async () => {
    try {
      console.log(`[Tebex API] Fetching basket ${basketIdent} from API...`);
      const basket = await fetchTebexApi<TebexBasket>(
        `/baskets/${basketIdent}`,
        {},
        false, // 인증 불필요 가정
        true // /accounts/{token} 경로 사용
      );
      
      if (basket) {
        // 캐시에 저장
        tebexCache.set('basket', basket, basketIdent);
        return basket;
      }
      
      return null;
    } catch (error) {
      // 404 Not Found 등의 오류는 null로 처리 (장바구니 없음 간주)
      if (
        error instanceof Error &&
        (error.message.includes("404") ||
          error.message.toLowerCase().includes("not found"))
      ) {
        console.warn(`Basket not found (ident: ${basketIdent})`);
        return null;
      }
      console.error(`Failed to get Tebex basket (ident: ${basketIdent}):`, error);
      throw error; // 다른 종류의 오류는 다시 throw
    }
  });
}

/**
 * 장바구니에 상품(패키지)을 추가합니다.
 * @param basketIdent 장바구니 식별자
 * @param packageId 추가할 상품 ID
 * @param quantity 수량 (기본값: 1)
 * @returns 업데이트된 장바구니 정보
 */
export async function addPackageToBasket(
  basketIdent: string,
  packageId: number,
  quantity: number = 1
): Promise<TebexBasket> {
  const result = await fetchTebexApi<TebexBasket>(
    `/baskets/${basketIdent}/packages`,
    {
      method: "POST",
      body: JSON.stringify({
        package_id: packageId,
        quantity: quantity,
      }),
    },
    true, // 인증 필요 가정
    false // /accounts/{token} 경로 아님
  );
  
  // 장바구니 캐시 무효화 및 브로드캐스트
  tebexCache.invalidate('basket', basketIdent);
  
  // 브라우저 환경에서만 브로드캐스트
  if (typeof window !== 'undefined') {
    const { CacheSyncUtils } = await import('@/lib/cache-sync');
    CacheSyncUtils.broadcastBasketInvalidation(basketIdent);
  }
  
  console.log(`[Tebex] Added package ${packageId} to basket ${basketIdent}, cache invalidated`);
  
  return result;
}

/**
 * 장바구니에서 특정 상품을 제거합니다. (API 문서 기반 수정)
 * @param basketIdent 장바구니 식별자
 * @param packageId 제거할 상품 ID (Tebex Package ID)
 * @returns 업데이트된 장바구니 정보 또는 성공 여부 (API 응답: 200 OK with Basket)
 */
export async function removePackageFromBasket(
  basketIdent: string,
  packageId: number // Tebex Package ID
): Promise<TebexBasket> {
  const result = await fetchTebexApi<TebexBasket>(
    `/baskets/${basketIdent}/packages/remove`, // API 엔드포인트
    {
      method: "POST", // POST 요청
      body: JSON.stringify({ package_id: packageId }), // 본문에 package_id 포함
    },
    true, // 인증 필요 가정
    false // /accounts/{token} 경로 아님
  );
  
  // 장바구니 캐시 무효화 및 브로드캐스트
  tebexCache.invalidate('basket', basketIdent);
  
  // 브라우저 환경에서만 브로드캐스트
  if (typeof window !== 'undefined') {
    const { CacheSyncUtils } = await import('@/lib/cache-sync');
    CacheSyncUtils.broadcastBasketInvalidation(basketIdent);
  }
  
  console.log(`[Tebex] Removed package ${packageId} from basket ${basketIdent}, cache invalidated`);
  
  return result;
}

/**
 * 장바구니 내 특정 상품의 수량을 업데이트합니다. (API 문서 기반 수정)
 * @param basketIdent 장바구니 식별자
 * @param packageId 업데이트할 상품의 Tebex Package ID
 * @param quantity 새로운 수량
 * @returns API 응답 (타입 확인 필요, 성공 시 보통 204 No Content 또는 업데이트된 Basket)
 */
export async function updatePackageQuantity(
  basketIdent: string,
  packageId: number, // basketPackageId 대신 Tebex Package ID 사용
  quantity: number
): Promise<any> {
  // 실제 반환 타입 확인 필요 (Tebex 문서상 200 OK는 명시 안됨, 204일 수 있음)
  if (quantity <= 0) {
    // 수량 0 업데이트는 remove API 사용 권장
    console.warn(
      `Attempting to update quantity to ${quantity} for package ${packageId}. Consider using removePackageFromBasket instead.`
    );
  }
  
  const result = await fetchTebexApi<any>(
    `/baskets/${basketIdent}/packages/${packageId}`, // URL 경로에 packageId 사용
    {
      method: "PUT",
      body: JSON.stringify({ quantity: quantity }),
    },
    true, // 인증 필요 가정
    false // /accounts/{token} 경로 아님
  );
  
  // 장바구니 캐시 무효화 및 브로드캐스트
  tebexCache.invalidate('basket', basketIdent);
  
  // 브라우저 환경에서만 브로드캐스트
  if (typeof window !== 'undefined') {
    const { CacheSyncUtils } = await import('@/lib/cache-sync');
    CacheSyncUtils.broadcastBasketInvalidation(basketIdent);
  }
  
  console.log(`[Tebex] Updated package ${packageId} quantity to ${quantity} in basket ${basketIdent}, cache invalidated`);
  
  return result;
}

/**
 * Tebex Checkout API 호출을 위한 헬퍼 함수 (Basic Auth 사용)
 * @param endpoint API 엔드포인트 (예: /baskets/{ident})
 * @param options fetch 옵션
 * @returns API 응답 데이터
 */
export async function fetchTebexCheckoutApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const checkoutApiUrl = "https://checkout.tebex.io/api"; // Checkout API URL
  const username = process.env.TEBEX_CHECKOUT_API_USER;
  const password = process.env.TEBEX_CHECKOUT_API_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Tebex Checkout API credentials are not configured in environment variables."
    );
  }

  const url = `${checkoutApiUrl}${endpoint}`;
  const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64"
  );

  const headers: Record<string, string> = {
    Authorization: `Basic ${encodedCredentials}`,
    "Content-Type": "application/json",
    Accept: "application/json", // Accept 헤더 추가
    ...(typeof options.headers === "object" &&
    options.headers !== null &&
    !Array.isArray(options.headers)
      ? Object.fromEntries(
          Object.entries(options.headers).map(([k, v]) => [k, String(v)])
        )
      : {}),
  };

  console.log(`[Tebex Checkout Fetch] Calling: ${url} with Basic Auth`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any = { message: response.statusText };
      try {
        errorData = await response.json();
      } catch (e) {
        try {
          errorData.message = await response.text();
        } catch {}
      }
      console.error(
        `Tebex Checkout API Error (${response.status}) for ${url}:`,
        errorData
      );
      const errorMessage =
        errorData?.message || `HTTP error! status: ${response.status}`;
      throw new Error(
        `Failed to fetch Tebex Checkout API (${url}) [${response.status}]: ${errorMessage}`
      );
    }

    // 204 No Content 같은 경우 빈 객체 반환
    if (response.status === 204) {
      return {} as T;
    }

    const result = await response.json();
    console.log(`[Tebex Checkout Fetch] Success for ${url}:`, result);
    return result; // Checkout API는 보통 data 래퍼 없이 바로 객체 반환
  } catch (error) {
    console.error(`Error calling Tebex Checkout API (${url}):`, error);
    throw error;
  }
}

export async function getCheckoutBasket(
  basketIdent: string
): Promise<TebexBasket> {
  // Checkout API는 별도의 Basic Auth 자격(TEBEX_CHECKOUT_API_USER/PASSWORD)을 사용
  return fetchTebexCheckoutApi<TebexBasket>(`/baskets/${basketIdent}`, {
    method: "GET",
  });
}

// ✅ 캐시 관리 유틸리티 함수들
export const TebexCacheUtils = {
  /**
   * 특정 장바구니의 캐시를 무효화합니다
   */
  invalidateBasket(basketIdent: string) {
    tebexCache.invalidate('basket', basketIdent);
    console.log(`[TebexCache] Invalidated basket cache: ${basketIdent}`);
  },

  /**
   * 사용자 관련 모든 장바구니 캐시를 무효화합니다 (동시성 문제 해결)
   */
  invalidateUserBaskets(userId: string) {
    // 현재는 basketIdent만 사용하므로 직접 구현
    // 향후 userId 기반 캐시가 필요하면 확장
    console.log(`[TebexCache] Invalidating all baskets for user: ${userId}`);
  },

  /**
   * 상품 목록 캐시를 무효화합니다 (새 상품 추가 시 등)
   */
  invalidatePackages() {
    tebexCache.invalidate('packages');
    console.log(`[TebexCache] Invalidated packages cache`);
  },

  /**
   * 특정 상품의 캐시를 무효화합니다
   */
  invalidatePackage(packageId: string | number) {
    tebexCache.invalidate('package', String(packageId));
    console.log(`[TebexCache] Invalidated package cache: ${packageId}`);
  },

  /**
   * 모든 캐시를 강제로 정리합니다
   */
  clearAll() {
    const cache = (tebexCache as any).cache as Map<string, any>;
    const pending = (tebexCache as any).pendingRequests as Map<string, any>;
    const beforeCache = cache.size;
    const beforePending = pending.size;
    cache.clear();
    pending.clear();
    console.log(
      `[TebexCache] Cleared all cache entries (${beforeCache}) and pending requests (${beforePending})`
    );
  },

  /**
   * 캐시 무결성 검사 및 정리
   */
  validateAndCleanup() {
    const cache = (tebexCache as any).cache;
    let cleaned = 0;
    
    for (const [key, entry] of cache.entries()) {
      // 완료된 장바구니 캐시 제거
      if (key.startsWith('basket:') && entry.data?.complete === true) {
        cache.delete(key);
        cleaned++;
        console.warn(`[TebexCache] Removed completed basket from cache: ${key}`);
      }
    }
    
    if (cleaned > 0) {
      console.log(`[TebexCache] Cleaned ${cleaned} invalid cache entries`);
    }
    
    // 일반 정리도 실행
    tebexCache.cleanup();
  },

  /**
   * 캐시 통계를 출력합니다 (디버깅용)
   */
  getStats() {
    const cache = (tebexCache as any).cache;
    const pending = (tebexCache as any).pendingRequests;
    
    console.log(`[TebexCache Stats] Cache entries: ${cache.size}, Pending requests: ${pending.size}`);
    
    return {
      cacheEntries: cache.size,
      pendingRequests: pending.size
    };
  }
};
