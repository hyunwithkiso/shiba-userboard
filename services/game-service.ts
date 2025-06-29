import pool from "@/lib/mysql"; // MySQL 연결 풀 가져오기
import mysql2 from "mysql2/promise"; // mysql2/promise 모듈 가져오기

/**
 * Discord ID를 사용하여 게임 데이터베이스에서 게임 ID(userId)를 조회합니다.
 * @param discordId Discord 사용자의 고유 ID.
 * @returns 사용자의 게임 ID (숫자 또는 문자열) 또는 null (찾지 못한 경우).
 * @throws 데이터베이스 조회 중 오류 발생 시.
 */
export async function getGameIdByDiscordId(
  discordId: string
): Promise<number | string | null> {
  if (!discordId) {
    console.warn("[GameService] Discord ID is required to fetch game ID.");
    return null;
  }

  // Discord ID를 게임 DB의 identifier 형식으로 변환 (예: 'discord:12345')
  const identifier = `discord:${discordId}`;
  console.log(
    `[GameService] Searching for game ID with identifier: ${identifier}`
  );

  let connection;
  try {
    connection = await pool.getConnection();
    // SELECT 할 컬럼을 user_id로, 테이블 이름을 vrp_user_ids로 변경
    const [rows] = await connection.execute(
      "SELECT `user_id` FROM `vrp_user_ids` WHERE `identifier` = ?",
      [identifier]
    );

    if (rows.length > 0) {
      // 조회된 컬럼명 user_id 사용
      const gameId = rows[0].user_id as number | string;
      console.log(
        `[GameService] Found game ID: ${gameId} for identifier: ${identifier}`
      );
      return gameId;
    } else {
      console.log(
        `[GameService] No game ID found for identifier: ${identifier}`
      );
      return null; // 찾지 못한 경우 null 반환
    }
  } catch (error) {
    console.error("[GameService] Error fetching game ID from MySQL:", error);
    // 오류를 다시 throw하여 상위 호출자(init 페이지)가 처리하도록 함
    throw new Error(
      "게임 데이터베이스에서 사용자 ID를 조회하는 중 오류가 발생했습니다."
    );
  } finally {
    if (connection) {
      connection.release(); // 연결 반환
    }
  }
}

/**
 * 이미지 이름 중복 검사
 * @param name 검사할 이름
 * @param type 이미지 타입 (killfeed 또는 chattitle)
 * @returns 중복 여부 (true: 중복됨, false: 사용가능)
 */
export async function checkImageNameDuplicate(
  name: string,
  type: "killfeed" | "chattitle"
): Promise<boolean> {
  if (!name || !type) {
    console.warn("[GameService] Name and type are required for duplicate check.");
    return false;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM `dokku_userboard` WHERE `type` = ? AND `name` = ?",
      [type, name]
    );

    const count = (rows[0] as any).count;
    const isDuplicate = count > 0;
    
    console.log(
      `[GameService] Name duplicate check - name: ${name}, type: ${type}, isDuplicate: ${isDuplicate}`
    );
    
    return isDuplicate;
  } catch (error) {
    console.error("[GameService] Error checking name duplicate:", error);
    // 에러 발생 시 안전하게 false 반환 (중복 아님으로 처리)
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * dokku_userboard 테이블에서 모든 이미지 목록 조회
 * @param filters 필터 조건
 * @returns 이미지 목록
 */
export async function getImagesFromGameDB(filters?: {
  type?: "killfeed" | "chattitle";
  approved?: boolean;
  name?: string;
  userId?: number;
}) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    let query = "SELECT * FROM `dokku_userboard` WHERE 1=1";
    const params: any[] = [];
    
    if (filters?.type) {
      query += " AND `type` = ?";
      params.push(filters.type);
    }
    
    if (filters?.approved !== undefined) {
      query += " AND `approved` = ?";
      params.push(filters.approved ? 1 : 0);
    }
    
    if (filters?.name) {
      query += " AND `name` LIKE ?";
      params.push(`%${filters.name}%`);
    }
    
    if (filters?.userId) {
      query += " AND `user_id` = ?";
      params.push(filters.userId);
    }
    
    query += " ORDER BY `id` DESC";
    
    const [rows] = await connection.execute(query, params);
    
    // metadata JSON 파싱
    return (rows as any[]).map(row => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    }));
  } catch (error) {
    console.error("[GameService] Error fetching images from game DB:", error);
    throw new Error("게임 데이터베이스에서 이미지 목록을 조회하는 중 오류가 발생했습니다.");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 필요한 경우 GameService 클래스로 래핑할 수 있습니다.
// export class GameService {
//   async getGameIdByDiscordId(discordId: string): Promise<number | string | null> { ... }
// }
// export const gameService = new GameService();
