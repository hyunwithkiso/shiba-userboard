import pool from "@/lib/mysql";
import { generateRandomCode } from "@/lib/utils";

interface ImageSubmission {
  id?: number;
  user_id: number;
  code: string;
  name: string;
  type: "killfeed" | "chattitle";
  image: string;
  metadata: any;
  approved: boolean;
}

class ImageService {
  /**
   * 이미지 정보를 dokku_userboard 테이블에 직접 저장
   */
  async createImageSubmission(data: {
    userId: number;
    name: string;
    type: "killfeed" | "chattitle";
    fileName: string;
    metadata?: any;
  }) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const code = generateRandomCode();
      const fullCode = data.type === "killfeed" 
        ? `killfeed_${code}` 
        : `chattitle_${code}`;
      
      const metadataString = JSON.stringify(data.metadata || {});
      
      const [result] = await connection.execute(
        `INSERT INTO dokku_userboard (user_id, code, name, type, image, metadata, approved) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          fullCode,
          data.type === "chattitle" ? `${data.name} 채팅 칭호` : `${data.name} 킬피드`,
          data.type,
          data.fileName,
          metadataString,
          0 // approved = false (0)
        ]
      );
      
      const insertId = (result as any).insertId;
      console.log(`[ImageService] Created image submission with ID: ${insertId}`);
      
      return {
        id: insertId,
        code: fullCode,
        success: true
      };
    } catch (error: any) {
      console.error("[ImageService] Error creating image submission:", error);
      
      // 중복 키 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error("이미 존재하는 이름입니다.");
      }
      
      throw new Error("이미지 정보 저장 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 정보 조회
   */
  async getImageSubmission(id: number) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        "SELECT * FROM dokku_userboard WHERE id = ?",
        [id]
      );
      
      if ((rows as any[]).length === 0) {
        return null;
      }
      
      const row = (rows as any[])[0];
      return {
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      };
    } catch (error) {
      console.error("[ImageService] Error getting image submission:", error);
      throw new Error("이미지 정보 조회 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 승인 상태 업데이트
   */
  async updateApprovalStatus(id: number, status: "approved" | "rejected", metadata?: any) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      // 상태를 숫자로 변환: approved=1, rejected=2
      const approvedValue = status === "approved" ? 1 : 2;
      
      let query = "UPDATE dokku_userboard SET approved = ?, approved_at = NOW()";
      const params: any[] = [approvedValue];
      
      if (metadata) {
        query += ", metadata = ?";
        params.push(JSON.stringify(metadata));
      }
      
      query += " WHERE id = ?";
      params.push(id);
      
      const [result] = await connection.execute(query, params);
      const affectedRows = (result as any).affectedRows;
      
      console.log(`[ImageService] Updated approval status for ID ${id}: ${status} (${approvedValue})`);
      
      return affectedRows > 0;
    } catch (error) {
      console.error("[ImageService] Error updating approval status:", error);
      throw new Error("승인 상태 업데이트 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 삭제
   */
  async deleteImage(id: number) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        "DELETE FROM dokku_userboard WHERE id = ?",
        [id]
      );
      
      const affectedRows = (result as any).affectedRows;
      console.log(`[ImageService] Deleted image with ID: ${id}`);
      
      return affectedRows > 0;
    } catch (error) {
      console.error("[ImageService] Error deleting image:", error);
      throw new Error("이미지 삭제 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 특정 사용자의 이미지 목록 조회
   */
  async getUserImages(userId: number) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const query = `
        SELECT 
          du.*,
          SUBSTRING_INDEX(u.last_login, ' ', -1) as user_nickname
        FROM dokku_userboard du
        LEFT JOIN vrp_users u ON du.user_id = u.id
        WHERE du.user_id = ?
        ORDER BY du.id DESC
      `;
      
      const [rows] = await connection.execute(query, [userId]);
      
      return (rows as any[]).map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
        // 상태를 문자열로 변환하여 반환
        status: row.approved === 1 ? "approved" : row.approved === 2 ? "rejected" : "pending"
      }));
    } catch (error) {
      console.error("[ImageService] Error getting user images:", error);
      throw new Error("사용자 이미지 목록 조회 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 모든 이미지 목록 조회 (관리자용)
   */
  async getAllImages(filters?: {
    type?: "killfeed" | "chattitle";
    approved?: "pending" | "approved" | "rejected";
    name?: string;
    limit?: number;
    offset?: number;
  }) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      let query = `
        SELECT 
          du.*,
          SUBSTRING_INDEX(u.last_login, ' ', -1) as user_nickname
        FROM dokku_userboard du
        LEFT JOIN vrp_users u ON du.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (filters?.type) {
        query += " AND du.type = ?";
        params.push(filters.type);
      }
      
      if (filters?.approved !== undefined) {
        const approvedValue = 
          filters.approved === "approved" ? 1 :
          filters.approved === "rejected" ? 2 : 0;
        query += " AND du.approved = ?";
        params.push(approvedValue);
      }
      
      if (filters?.name) {
        query += " AND du.name LIKE ?";
        params.push(`%${filters.name}%`);
      }
      
      query += " ORDER BY du.id DESC";
      
      if (filters?.limit) {
        query += " LIMIT ?";
        params.push(filters.limit);
        
        if (filters?.offset) {
          query += " OFFSET ?";
          params.push(filters.offset);
        }
      }
      
      const [rows] = await connection.execute(query, params);
      
      return (rows as any[]).map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
        // 상태를 문자열로 변환하여 반환
        status: row.approved === 1 ? "approved" : row.approved === 2 ? "rejected" : "pending"
      }));
    } catch (error) {
      console.error("[ImageService] Error getting all images:", error);
      throw new Error("이미지 목록 조회 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 메타데이터 업데이트
   */
  async updateMetadata(id: number, metadata: any) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        "UPDATE dokku_userboard SET metadata = ? WHERE id = ?",
        [JSON.stringify(metadata), id]
      );
      
      const affectedRows = (result as any).affectedRows;
      console.log(`[ImageService] Updated metadata for ID: ${id}`);
      
      return affectedRows > 0;
    } catch (error) {
      console.error("[ImageService] Error updating metadata:", error);
      throw new Error("메타데이터 업데이트 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 이름(name)만 변경
   */
  async updateImageName(id: number, name: string) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [result] = await connection.execute(
        "UPDATE dokku_userboard SET name = ? WHERE id = ?",
        [name, id]
      );
      const affectedRows = (result as any).affectedRows;
      console.log(`[ImageService] Updated image name for ID ${id}: ${name}`);
      return affectedRows > 0;
    } catch (error) {
      console.error("[ImageService] Error updating image name:", error);
      throw new Error("이미지 이름 변경 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 이미지 데이터 전체 업데이트 (어드민용)
   */
  async updateImageData(id: number, data: {
    name?: string;
    image?: string;
    metadata?: any;
  }) {
    let connection;
    try {
      connection = await pool.getConnection();
      
      const updateFields: string[] = [];
      const params: any[] = [];
      
      if (data.name !== undefined) {
        updateFields.push("name = ?");
        params.push(data.name);
      }
      
      if (data.image !== undefined) {
        updateFields.push("image = ?");
        params.push(data.image);
      }
      
      // file_path 컬럼이 테이블에 없으므로 제거
      // 파일 경로는 image 컬럼에 저장됨
      
      if (data.metadata !== undefined) {
        updateFields.push("metadata = ?");
        params.push(JSON.stringify(data.metadata));
      }
      
      if (updateFields.length === 0) {
        throw new Error("업데이트할 필드가 없습니다.");
      }
      
      params.push(id);
      
      const query = `UPDATE dokku_userboard SET ${updateFields.join(", ")} WHERE id = ?`;
      const [result] = await connection.execute(query, params);
      
      const affectedRows = (result as any).affectedRows;
      console.log(`[ImageService] Updated image data for ID ${id}:`, data);
      
      return affectedRows > 0;
    } catch (error) {
      console.error("[ImageService] Error updating image data:", error);
      throw new Error("이미지 데이터 업데이트 중 오류가 발생했습니다.");
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 게임 서버에 유저보드 아이템 갱신 알림
   */
  async refreshUserBoardItem(data: {
    insert_id: number;
    user_id: number;
    isNew: boolean;
  }) {
    try {
      if (!process.env.SHIBA_API_URL) {
        console.warn("[ImageService] SHIBA_API_URL is not defined, skipping refresh");
        return { success: false, error: "API URL not configured" };
      }

      const response = await fetch(
        `${process.env.SHIBA_API_URL}/refreshUserBoardItem`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            key: process.env.SHIBA_API_KEY || "",
          },
          body: JSON.stringify({
            insert_id: data.insert_id,
            user_id: data.user_id,
            isNew: data.isNew
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.warn(`[ImageService] Failed to refresh user board item: ${response.status}`);
        return { 
          success: false, 
          error: `API responded with status ${response.status}` 
        };
      }

      const result = await response.json();
      console.log(`[ImageService] Successfully refreshed user board item for user ${data.user_id}, insert_id: ${data.insert_id}, isNew: ${data.isNew}`);
      
      return { success: true, data: result };
    } catch (error) {
      console.error("[ImageService] Error refreshing user board item:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

export const imageService = new ImageService();
