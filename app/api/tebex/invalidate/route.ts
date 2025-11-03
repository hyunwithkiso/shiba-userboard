import { NextRequest, NextResponse } from 'next/server';
import { TebexCacheUtils } from '@/lib/tebex';

export async function POST(request: NextRequest) {
  // API 키 인증: 대시보드에서 서버-투-서버 호출용
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 API 키입니다.' },
      { status: 401 }
    );
  }

  // 통계(디버깅) - 무효화 전 상태
  const before = TebexCacheUtils.getStats();

  // Tebex 관련 캐시 전부 무효화
  TebexCacheUtils.clearAll();

  // 페이지 레벨 캐시도 필요하면 on-demand revalidate (best-effort)
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/shop');
    revalidatePath('/cart');
    revalidatePath('/');
  } catch (e) {
    // Next.js 환경에 따라 route handler에서 revalidatePath 제한될 수 있음
  }

  // 통계(디버깅) - 무효화 후 상태
  const after = TebexCacheUtils.getStats();

  return NextResponse.json({
    success: true,
    message: 'Tebex caches invalidated',
    before,
    after,
  });
}
