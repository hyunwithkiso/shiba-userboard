/* eslint-disable @typescript-eslint/no-unused-vars */
// Tebex API 기본 URL, Secret Key, Public Token
const TEBEX_API_URL =
  process.env.TEBEX_API_URL || "https://headless.tebex.io/api";
const TEBEX_PRIVATE_KEY = process.env.TEBEX_PRIVATE_KEY;
const TEBEX_PUBLIC_TOKEN = process.env.TEBEX_PUBLIC_TOKEN; // 웹스토어 식별자 (Account ID)

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
      throw new Error(`Failed to fetch Tebex API (${url}): ${errorMessage}`);
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
 * 참고: 실제 API 엔드포인트는 문서 확인 후 정확히 명시해야 합니다.
 * 현재는 '/packages'를 가정하고 작성합니다.
 */
export async function fetchPackages(): Promise<TebexPackage[]> {
  try {
    // `/accounts/{publicToken}/packages` 엔드포인트 사용, 인증 불필요
    const packages = await fetchTebexApi<TebexPackage[]>(
      "/packages",
      {},
      false,
      true
    );
    return packages || [];
  } catch (error) {
    console.error("Failed to fetch Tebex packages:", error);
    return [];
  }
}

/**
 * 특정 ID를 가진 상품(패키지)의 상세 정보를 가져옵니다.
 * 참고: 실제 API 엔드포인트는 문서 확인 후 정확히 명시해야 합니다.
 * 현재는 '/packages/{packageId}'를 가정하고 작성합니다.
 */
export async function fetchPackage(
  packageId: string | number
): Promise<TebexPackage | null> {
  try {
    // `/accounts/{publicToken}/packages/{packageId}` 엔드포인트 사용, 인증 불필요
    const pkg = await fetchTebexApi<TebexPackage>(
      `/packages/${packageId}`,
      {},
      false,
      true
    );
    return pkg || null;
  } catch (error) {
    console.error(`Failed to fetch Tebex package (ID: ${packageId}):`, error);
    return null;
  }
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
  try {
    // BasketService의 getUserBasket 참고: `/accounts/{publicToken}/baskets/{ident}` 호출
    // 이 엔드포인트가 Secret Key 없이 접근 가능한지 확인 필요 (문서 권장)
    // 우선은 Secret Key 없이 시도
    const basket = await fetchTebexApi<TebexBasket>(
      `/baskets/${basketIdent}`,
      {},
      false, // 인증 불필요 가정
      true // /accounts/{token} 경로 사용
    );
    return basket || null;
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
  // BasketService는 추가된 상품 정보만 반환하지만, 여기서는 전체 바스켓 반환
  // BasketService 참고: `/baskets/{ident}/packages` 엔드포인트, 인증 필요 없음?
  // 하지만 BasketService의 `addPackageToTebexBasket`에는 Secret Key 언급이 없으나, Basket 생성에는 사용함.
  // 일반적으로 장바구니 수정은 인증이 필요할 가능성이 높음.
  // 우선 인증(Secret Key) 사용으로 구현.
  return fetchTebexApi<TebexBasket>(
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
  // API 문서상 성공 시 Basket 객체 반환
  return fetchTebexApi<TebexBasket>( // 반환 타입 TebexBasket으로 명시
    `/baskets/${basketIdent}/packages/remove`, // API 엔드포인트
    {
      method: "POST", // POST 요청
      body: JSON.stringify({ package_id: packageId }), // 본문에 package_id 포함
    },
    true, // 인증 필요 가정
    false // /accounts/{token} 경로 아님
  );
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
    // 0 이하 수량 요청 시 에러 발생시키는 것이 더 안전할 수 있음
    // throw new Error("Quantity must be greater than 0. Use removePackageFromBasket to remove.");
  }
  return fetchTebexApi<any>(
    `/baskets/${basketIdent}/packages/${packageId}`, // URL 경로에 packageId 사용
    {
      method: "PUT",
      body: JSON.stringify({ quantity: quantity }),
    },
    true, // 인증 필요 가정
    false // /accounts/{token} 경로 아님
  );
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
        `Failed to fetch Tebex Checkout API (${url}): ${errorMessage}`
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
  const result = await fetch(
    `https://checkout.tebex.io/api/baskets/${basketIdent}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TEBEX_PUBLIC_TOKEN}:${process.env.TEBEX_PRIVATE_KEY}`
        ).toString("base64")}`,
      },
    }
  );
  return result.json();
}
