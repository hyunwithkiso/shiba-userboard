/**
 * 캐시 동기화 및 일관성 보장을 위한 이벤트 시스템
 * 멀티탭, 멀티디바이스 간 데이터 일관성 문제 해결
 */

import { TebexCacheUtils } from "@/lib/tebex";

// 브라우저 환경에서만 동작
if (typeof window !== 'undefined') {
  
  // ✅ 브라우저 탭 간 동기화 (localStorage 이벤트 활용)
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith('tebex_cache_invalidate:')) {
      const cacheKey = event.key.replace('tebex_cache_invalidate:', '');
      
      // 다른 탭에서 무효화한 캐시를 현재 탭에서도 무효화
      if (cacheKey.startsWith('basket:')) {
        const basketIdent = cacheKey.replace('basket:', '');
        TebexCacheUtils.invalidateBasket(basketIdent);
        console.log(`[Cache Sync] Synced basket invalidation: ${basketIdent}`);
      } else if (cacheKey === 'packages') {
        TebexCacheUtils.invalidatePackages();
        console.log(`[Cache Sync] Synced packages invalidation`);
      }
      
      // localStorage에서 이벤트 키 제거 (일회성)
      localStorage.removeItem(event.key);
    }
  });
  
  // ✅ 페이지 포커스 시 캐시 무결성 검사
  window.addEventListener('focus', () => {
    console.log('[Cache Sync] Page focused, validating cache...');
    TebexCacheUtils.validateAndCleanup();
  });
  
  // ✅ 페이지 언로드 시 캐시 정리
  window.addEventListener('beforeunload', () => {
    TebexCacheUtils.validateAndCleanup();
  });
}

/**
 * 다른 탭들에게 캐시 무효화 신호 보내기
 */
export const CacheSyncUtils = {
  /**
   * 모든 탭에서 특정 장바구니 캐시 무효화
   */
  broadcastBasketInvalidation(basketIdent: string) {
    if (typeof window !== 'undefined') {
      const key = `tebex_cache_invalidate:basket:${basketIdent}`;
      localStorage.setItem(key, Date.now().toString());
      console.log(`[Cache Sync] Broadcasting basket invalidation: ${basketIdent}`);
    }
  },

  /**
   * 모든 탭에서 상품 목록 캐시 무효화
   */
  broadcastPackagesInvalidation() {
    if (typeof window !== 'undefined') {
      const key = `tebex_cache_invalidate:packages`;
      localStorage.setItem(key, Date.now().toString());
      console.log(`[Cache Sync] Broadcasting packages invalidation`);
    }
  },

  /**
   * 현재 탭의 캐시 상태 진단
   */
  diagnoseCache() {
    const stats = TebexCacheUtils.getStats();
    console.log('[Cache Sync] Cache diagnosis:', {
      ...stats,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    return stats;
  }
};

// ✅ 개발 환경에서 디버깅 헬퍼
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).CacheSyncUtils = CacheSyncUtils;
  (window as any).TebexCacheUtils = TebexCacheUtils;
  console.log('[Cache Sync] Debug utilities attached to window object');
}
