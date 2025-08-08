"use server";

import { auth } from "@/lib/auth";
import { imageService } from "@/services/image-service";
import { UploadService } from "@/services/upload-service";
import { revalidatePath } from "next/cache";

interface UpdateImageOptions {
  imageId: number;
  name?: string;
  file?: File;
  metadata?: any;
}

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * 이미지 이름만 수정하는 액션 (기존 함수 개선)
 */
export async function updateImageNameAction(id: number, name: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    if (!name?.trim()) {
      return { success: false, error: "이미지 이름을 입력해주세요." };
    }

    if (name.length > 10) {
      return { success: false, error: "이미지 이름은 최대 10자까지 가능합니다." };
    }

    const success = await imageService.updateImageName(id, name.trim());
    
    if (success) {
      revalidatePath("/admin/images");
      revalidatePath("/my-uploads");
      return { success: true, message: "이미지 이름이 수정되었습니다." };
    } else {
      return { success: false, error: "이미지 이름 수정에 실패했습니다." };
    }
  } catch (error) {
    console.error("Image name update error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

/**
 * 이미지 파일과 메타데이터를 수정하는 액션
 */
export async function updateImageAction(options: UpdateImageOptions): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    const { imageId, name, file, metadata } = options;

    // 기본 검증
    if (name && name.length > 10) {
      return { success: false, error: "이미지 이름은 최대 10자까지 가능합니다." };
    }

    // 기존 이미지 정보 조회
    const existingImage = await imageService.getImageSubmission(imageId);
    if (!existingImage) {
      return { success: false, error: "이미지를 찾을 수 없습니다." };
    }

    let updateData: any = {};

    // 이름 업데이트
    if (name?.trim()) {
      updateData.name = name.trim();
    }

    // 메타데이터 업데이트 (채팅 칭호만)
    if (metadata && existingImage.type === "chattitle") {
      updateData.metadata = metadata;
    }

    // 파일 업데이트
    if (file) {
      // 기존 이미지 타입에 따른 업로드
      const imageType = existingImage.type === "chattitle" ? "chat-title" : "killfeed";
      
      const uploadResult = await UploadService.uploadToExternalStorage({
        file,
        type: imageType as "killfeed" | "chat-title"
      });

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      updateData.image = uploadResult.fileName;
    }

    // DB 업데이트
    const success = await imageService.updateImageData(imageId, updateData);
    
    if (success) {
      // 이미지가 승인된 상태라면 게임 서버에 갱신 알림
      if (existingImage.approved === 1) {
        try {
          await imageService.refreshUserBoardItem({
            insert_id: imageId,
            user_id: existingImage.user_id,
            isNew: false // 수정이므로 false
          });
          console.log(`[AdminImageActions] User board item refreshed for user ${existingImage.user_id} after modification`);
        } catch (refreshError) {
          console.error("[AdminImageActions] Error refreshing user board item after modification:", refreshError);
          // 갱신 알림 실패해도 수정 처리는 성공으로 간주
        }
      }

      revalidatePath("/admin/images");
      revalidatePath("/my-uploads");
      
      let message = "이미지가 성공적으로 수정되었습니다.";
      if (file && name) {
        message = "이미지 파일과 이름이 수정되었습니다.";
      } else if (file) {
        message = "이미지 파일이 수정되었습니다.";
      } else if (name) {
        message = "이미지 이름이 수정되었습니다.";
      } else if (metadata) {
        message = "이미지 메타데이터가 수정되었습니다.";
      }
      
      return { success: true, message };
    } else {
      return { success: false, error: "이미지 수정에 실패했습니다." };
    }
  } catch (error) {
    console.error("Image update error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}

/**
 * 채팅 칭호 메타데이터만 수정하는 액션
 */
export async function updateChatTitleMetadataAction(
  imageId: number, 
  metadata: any
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return { success: false, error: "관리자 권한이 필요합니다." };
    }

    // 기존 이미지가 채팅 칭호인지 확인
    const existingImage = await imageService.getImageSubmission(imageId);
    if (!existingImage) {
      return { success: false, error: "이미지를 찾을 수 없습니다." };
    }

    if (existingImage.type !== "chattitle") {
      return { success: false, error: "채팅 칭호 이미지만 메타데이터를 수정할 수 있습니다." };
    }

    const success = await imageService.updateMetadata(imageId, metadata);
    
    if (success) {
      // 이미지가 승인된 상태라면 게임 서버에 갱신 알림
      if (existingImage.approved === 1) {
        try {
          await imageService.refreshUserBoardItem({
            insert_id: imageId,
            user_id: existingImage.user_id,
            isNew: false // 메타데이터 수정이므로 false
          });
          console.log(`[AdminImageActions] User board item refreshed for user ${existingImage.user_id} after metadata update`);
        } catch (refreshError) {
          console.error("[AdminImageActions] Error refreshing user board item after metadata update:", refreshError);
          // 갱신 알림 실패해도 수정 처리는 성공으로 간주
        }
      }

      revalidatePath("/admin/images");
      revalidatePath("/my-uploads");
      return { success: true, message: "채팅 칭호 설정이 수정되었습니다." };
    } else {
      return { success: false, error: "메타데이터 수정에 실패했습니다." };
    }
  } catch (error) {
    console.error("Metadata update error:", error);
    return { success: false, error: "서버 오류가 발생했습니다." };
  }
}