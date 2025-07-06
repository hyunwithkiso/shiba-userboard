"use server";

import { auth } from "@/lib/auth";
import { realtimeService } from "@/services/realtime-service";
import { revalidatePath } from "next/cache";

/**
 * 킬피드 티켓 차감
 */
export async function deductKillFeedTicketAction(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    // userId가 제공되지 않으면 현재 사용자의 userId 사용
    const targetUserId = userId || session.user.userId;
    if (!targetUserId) {
      return { success: false, error: "사용자 ID를 찾을 수 없습니다." };
    }

    // 관리자가 아닌 경우 본인의 티켓만 차감 가능
    if (!session.user.isAdmin && targetUserId !== session.user.userId) {
      return { success: false, error: "권한이 없습니다." };
    }

    console.log(`[TicketAction] Deducting KillFeed ticket for user ${targetUserId}`);
    const result = await realtimeService.updateKillFeedAmount(targetUserId);
    
    console.log(`[TicketAction] KillFeed ticket deduction result:`, result);
    
    // 페이지 새로고침으로 티켓 수량 업데이트
    revalidatePath("/killfeed");
    
    return { success: true, data: result };
  } catch (error) {
    console.error("[TicketAction] Error deducting KillFeed ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 차감 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 채팅 칭호 티켓 차감
 */
export async function deductChatTitleTicketAction(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    // userId가 제공되지 않으면 현재 사용자의 userId 사용
    const targetUserId = userId || session.user.userId;
    if (!targetUserId) {
      return { success: false, error: "사용자 ID를 찾을 수 없습니다." };
    }

    // 관리자가 아닌 경우 본인의 티켓만 차감 가능
    if (!session.user.isAdmin && targetUserId !== session.user.userId) {
      return { success: false, error: "권한이 없습니다." };
    }

    console.log(`[TicketAction] Deducting ChatTitle ticket for user ${targetUserId}`);
    const result = await realtimeService.updateChatTitleAmount(targetUserId);
    
    console.log(`[TicketAction] ChatTitle ticket deduction result:`, result);
    
    // 페이지 새로고침으로 티켓 수량 업데이트
    revalidatePath("/chat-title");
    
    return { success: true, data: result };
  } catch (error) {
    console.error("[TicketAction] Error deducting ChatTitle ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 차감 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 킬피드 티켓 롤백 (거절 시)
 */
export async function rollbackKillFeedTicketAction(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    // 관리자만 롤백 가능
    if (!session.user.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    console.log(`[TicketAction] Rolling back KillFeed ticket for user ${userId}`);
    const result = await realtimeService.rollBackKillFeedAmount(userId);
    
    console.log(`[TicketAction] KillFeed ticket rollback result:`, result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error("[TicketAction] Error rolling back KillFeed ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 롤백 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 채팅 칭호 티켓 롤백 (거절 시)
 */
export async function rollbackChatTitleTicketAction(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    // 관리자만 롤백 가능
    if (!session.user.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    console.log(`[TicketAction] Rolling back ChatTitle ticket for user ${userId}`);
    const result = await realtimeService.rollBackChatTitleAmount(userId);
    
    console.log(`[TicketAction] ChatTitle ticket rollback result:`, result);
    
    return { success: true, data: result };
  } catch (error) {
    console.error("[TicketAction] Error rolling back ChatTitle ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 롤백 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 킬피드 티켓 보유량 확인
 */
export async function checkKillFeedTicketAction(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    const targetUserId = userId || session.user.userId;
    if (!targetUserId) {
      return { success: false, error: "사용자 ID를 찾을 수 없습니다." };
    }

    const ticketInfo = await realtimeService.getCheckAvailableKillFeed(Number(targetUserId));
    
    return { success: true, data: ticketInfo };
  } catch (error) {
    console.error("[TicketAction] Error checking KillFeed ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 확인 중 오류가 발생했습니다." 
    };
  }
}

/**
 * 채팅 칭호 티켓 보유량 확인
 */
export async function checkChatTitleTicketAction(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "인증이 필요합니다." };
    }

    const targetUserId = userId || session.user.userId;
    if (!targetUserId) {
      return { success: false, error: "사용자 ID를 찾을 수 없습니다." };
    }

    const ticketInfo = await realtimeService.getCheckAvailableChatTitle(Number(targetUserId));
    
    return { success: true, data: ticketInfo };
  } catch (error) {
    console.error("[TicketAction] Error checking ChatTitle ticket:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "티켓 확인 중 오류가 발생했습니다." 
    };
  }
} 