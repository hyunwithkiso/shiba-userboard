"use server";

import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { basketService } from "@/services/basket-service";

// init-form 에서 전달받는 Discord 역할 객체 타입
type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

// Discord API 응답 타입 (필요한 부분만 정의)
interface DiscordGuildMember {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null; // 새로운 사용자명 시스템
  };
  nick: string | null; // 서버 닉네임
  avatar: string | null; // 서버별 프로필 아바타 (Nitro 필요)
  roles: string[]; // 역할 ID 배열
  joined_at: string;
  // ... 기타 필드
}

interface DiscordGuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  // ... 기타 필드
}

// 서버 액션 결과 타입
interface MembershipCheckResult {
  success: boolean;
  error?: string;
  profile?: {
    nickname: string; // 서버 닉네임 또는 전역 이름
    roles: DiscordRole[]; // 서버 역할 정보
    avatar?: string | null; // Discord 아바타 URL
    username?: string; // Discord 사용자명 (예: user#1234 또는 user)
    discriminator?: string; // 태그 (예전 시스템)
  };
}

/**
 * Discord ID로 특정 길드의 멤버십을 확인하고, 멤버 프로필 정보를 가져옵니다.
 * @param discordId 확인할 사용자의 Discord ID.
 * @returns 멤버십 확인 결과 및 프로필 정보.
 */
export async function checkGuildMembershipAndFetchProfile(
  discordId: string
): Promise<MembershipCheckResult> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.GUILD_ID;

  if (!botToken || !guildId) {
    console.error("DISCORD_BOT_TOKEN or DISCORD_GUILD_ID is not configured.");
    return { success: false, error: "서버 설정 오류입니다." };
  }
  if (!discordId) {
    return { success: false, error: "Discord ID가 필요합니다." };
  }

  const apiUrl = `https://discord.com/api/v10/guilds/1095732640696516640/members/${discordId}`;
  const rolesApiUrl = `https://discord.com/api/v10/guilds/1095732640696516640/roles`;

  console.log(apiUrl, rolesApiUrl);

  try {
    // 1. 길드 멤버 정보 가져오기
    const memberResponse = await fetch(apiUrl, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      cache: "no-store", // 멤버 정보는 실시간으로 가져오도록 캐시 비활성화
    });

    if (!memberResponse.ok) {
      if (memberResponse.status === 404) {
        return {
          success: false,
          error: "지정된 Discord 서버의 멤버가 아닙니다.",
        };
      }
      console.error(
        `Discord API Error (Get Member): ${memberResponse.status} ${memberResponse.statusText}`
      );
      const errorBody = await memberResponse.text();
      console.error("Error Body:", errorBody);
      return {
        success: false,
        error: `Discord 멤버 정보 조회 실패 (${memberResponse.status})`,
      };
    }

    const memberData: DiscordGuildMember = await memberResponse.json();

    // 2. 길드 역할 정보 가져오기 (역할 이름, 색상 등을 위해)
    const rolesResponse = await fetch(rolesApiUrl, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      // 역할 정보는 자주 바뀌지 않으므로 캐싱 가능 (Next.js 기본 캐시 사용)
      // next: { revalidate: 3600 } // 예: 1시간마다 갱신
    });

    let guildRoles: DiscordGuildRole[] = [];
    if (rolesResponse.ok) {
      guildRoles = await rolesResponse.json();
    } else {
      console.warn(
        `Failed to fetch guild roles (${rolesResponse.status}), role details might be incomplete.`
      );
      // 역할 정보를 못 가져와도 일단 진행 가능 (ID만 사용하거나 기본값 처리)
    }

    // 3. 역할 ID를 실제 역할 정보(이름, 색상 등)로 매핑
    const memberRoles: DiscordRole[] = memberData.roles
      .map((roleId) => {
        const roleInfo = guildRoles.find((r) => r.id === roleId);
        return roleInfo
          ? {
              id: roleInfo.id,
              name: roleInfo.name,
              color: roleInfo.color,
              position: roleInfo.position,
            }
          : null; // 해당 ID의 역할을 찾지 못한 경우 null
      })
      .filter((role): role is DiscordRole => role !== null) // null 제거
      .sort((a, b) => b.position - a.position); // position 높은 순 정렬 (선택사항)

    // 사용자 닉네임 결정 (서버 닉네임 우선, 없으면 전역 이름 또는 사용자명)
    const nickname =
      memberData.nick ||
      memberData.user?.global_name ||
      memberData.user?.username ||
      "Unknown";

    // Discord 아바타 URL 생성
    let avatarUrl: string | null = null;
    if (memberData.user?.id && memberData.user?.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${memberData.user.id}/${memberData.user.avatar}.png`;
    }
    // 서버별 프로필 아바타 처리 (필요시 추가)
    // if (memberData.avatar) { ... }

    return {
      success: true,
      profile: {
        nickname: nickname,
        roles: memberRoles,
        avatar: avatarUrl,
        username: memberData.user?.username,
        discriminator:
          memberData.user?.discriminator !== "0"
            ? memberData.user?.discriminator
            : undefined, // 태그가 0이면 표시 안함
      },
    };
  } catch (error) {
    console.error("Error checking Discord membership:", error);
    return { success: false, error: "Discord 멤버십 확인 중 오류 발생" };
  }
}

/**
 * 초기 설정 후 사용자의 닉네임, 역할, 게임 ID를 데이터베이스에 업데이트합니다.
 * @param userId 업데이트할 사용자의 NextAuth ID.
 * @param nickname 저장할 Discord 닉네임 (서버 기준).
 * @param discordRoles Discord 역할 객체의 배열.
 * @param gameId 저장할 게임 ID (숫자 또는 문자열).
 * @returns 성공 또는 실패를 나타내는 객체.
 */
export async function updateUserMetadataAction(
  userId: string,
  nickname: string,
  discordRoles: DiscordRole[],
  gameId: number | string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    // 권한 확인
    if (!currentUserId || currentUserId !== userId) {
      return { success: false, error: "권한 없는 접근입니다." };
    }

    // 입력값 유효성 검사 (gameId 포함)
    if (
      !userId ||
      typeof nickname !== "string" ||
      !Array.isArray(discordRoles) ||
      gameId === undefined // gameId가 null일 수는 있지만 undefined는 안됨
    ) {
      return {
        success: false,
        error:
          "잘못된 입력: userId, nickname, discordRoles 배열, gameId가 필요합니다.",
      };
    }

    // --- 장바구니 생성 보장 ---
    console.log(
      `[Action:updateUserMetadata] Ensuring basket exists for user ${userId}...`
    );
    const basketResult = await basketService.ensureUserBasket(userId);
    if (!basketResult.success) {
      console.error(
        `[Action:updateUserMetadata] Failed to ensure basket for user ${userId}:`,
        basketResult.error
      );
      return {
        success: false,
        error: `장바구니 준비 중 오류 발생: ${basketResult.error}`,
      };
    }
    console.log(
      `[Action:updateUserMetadata] Basket ensured for user ${userId}. Ident: ${basketResult.ident}`
    );
    // --- 장바구니 생성 보장 끝 ---

    console.log(
      `[Action:updateUserMetadata] 사용자 ${userId} 정보 업데이트 중 (Nickname: ${nickname}, GameID: ${gameId})`
    );

    const roleNames = discordRoles.map((role) => role.name);

    // 업데이트할 데이터 준비 (isInit: true 추가)
    const updateData: Partial<typeof users.$inferInsert> = {
      nickname: nickname,
      roles: roleNames,
      userId: gameId !== null ? String(gameId) : null,
      isInit: true, // isInit 필드를 true로 설정
      updatedAt: new Date(),
    };

    // users.userId 필드에 대한 unique 제약 조건 등이 있다면 처리 필요

    await db.update(users).set(updateData).where(eq(users.id, userId));

    console.log(
      `[Action:updateUserMetadata] 사용자 ${userId} 정보 업데이트 성공`
    );

    // 캐시 무효화 (기존 유지)
    revalidatePath("/profile");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error(
      `[Action:updateUserMetadata] 사용자 ${userId} 정보 업데이트 실패`,
      error
    );
    // 데이터베이스 오류 등 상세 정보 로깅 고려
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return {
        success: false,
        error: "이미 사용 중인 게임 ID 또는 다른 고유 정보와 충돌합니다.",
      };
    }
    return {
      success: false,
      error: "사용자 정보 업데이트 중 서버 오류가 발생했습니다.",
    };
  }
}
