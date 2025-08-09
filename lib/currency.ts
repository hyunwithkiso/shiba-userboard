export interface ExchangeRate {
  rates: {
    KRW: number;
  };
  base: string;
  date: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5분
let cachedRates: { data: ExchangeRate; timestamp: number } | null = null;

export async function getExchangeRate(): Promise<number> {
  try {
    // 캐시된 데이터가 있고 아직 유효한지 확인
    if (
      cachedRates &&
      Date.now() - cachedRates.timestamp < CACHE_DURATION
    ) {
      return cachedRates.data.rates.KRW;
    }

    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=KRW',
      {
        next: { revalidate: 300 }, // 5분마다 재검증
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data: ExchangeRate = await response.json();
    
    // 캐시에 저장
    cachedRates = {
      data,
      timestamp: Date.now(),
    };

    return data.rates.KRW;
  } catch (error) {
    console.error('환율 조회 실패:', error);
    // 실패 시 기본 환율 반환 (대략적인 USD-KRW 환율)
    return 1300;
  }
}

export function convertUsdToKrw(usdAmount: number, exchangeRate: number): number {
  return Math.round(usdAmount * exchangeRate);
}

export function formatKrwPrice(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}