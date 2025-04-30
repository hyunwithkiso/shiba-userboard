import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 가격을 통화 형식에 맞게 포맷팅합니다.
 * @param amount 숫자 가격
 * @param currency 통화 코드 (예: "KRW", "USD")
 * @returns 포맷팅된 가격 문자열 (예: "₩10,000")
 */
export function formatPrice(
  amount: number | undefined | null,
  currency: string | undefined | null
): string {
  if (amount === undefined || amount === null || !currency) {
    return "가격 정보 없음"; // 또는 다른 기본값
  }
  try {
    // 한국 원화(KRW)는 소수점 없이 표시, 다른 통화는 기본 설정 사용
    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency.toUpperCase() === "KRW" ? 0 : undefined,
      maximumFractionDigits: currency.toUpperCase() === "KRW" ? 0 : undefined,
    };
    return new Intl.NumberFormat("ko-KR", options).format(amount);
  } catch (error) {
    console.warn(`Failed to format price for currency ${currency}:`, error);
    // Intl 미지원 또는 오류 발생 시 기본 형식 반환
    return `${amount.toLocaleString()} ${currency}`;
  }
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환합니다.
 * @param bytes 파일 크기 (바이트 단위)
 * @param decimals 소수점 이하 자릿수 (기본값: 2)
 * @returns 포맷팅된 파일 크기 문자열 (예: "1.23 MB")
 */
export function formatFileSize(
  bytes: number | undefined | null,
  decimals = 2
): string {
  if (bytes === undefined || bytes === null || bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
/**
 * 랜덤한 5글자 소문자 영어 문자열을 생성합니다.
 * @returns 5글자 소문자 영어 문자열
 */
export function generateRandomCode(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}
