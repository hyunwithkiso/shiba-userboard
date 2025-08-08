import { validateImageFile, ImageValidationOptions } from "@/lib/image-upload-utils";

interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

interface UploadOptions {
  type: "killfeed" | "chat-title";
  file: File;
}

export class UploadService {
  private static readonly ALLOWED_TYPES = ["image/png", "image/webp", "image/gif"];
  
  // 정확한 이미지 크기 설정
  private static readonly VALIDATION_OPTIONS: Record<string, ImageValidationOptions> = {
    killfeed: {
      maxSizeKB: 500,
      allowedFormats: ["image/png", "image/webp", "image/gif"],
      maxWidth: 640, // 640px x 140px
      maxHeight: 140,
      minWidth: 640,
      minHeight: 140,
    },
    "chat-title": {
      maxSizeKB: 200,
      allowedFormats: ["image/png", "image/webp", "image/gif"],
      maxWidth: 200, // 200px x 50px
      maxHeight: 50,
      minWidth: 200,
      minHeight: 50,
    }
  };
  
  /**
   * 파일 유효성 검증 (기본 파일 검증만, 차원 검증은 클라이언트에서)
   */
  static async validateFile(file: File, type: "killfeed" | "chat-title"): Promise<{ valid: boolean; error?: string }> {
    const options = this.VALIDATION_OPTIONS[type];
    if (!options) {
      return { valid: false, error: "지원하지 않는 이미지 타입입니다." };
    }

    // 기본 파일 검증 (파일 타입, 크기만 - 서버에서 안전하게 실행 가능)
    const basicValidation = validateImageFile(
      file, 
      options.maxSizeKB * 1024, // KB를 bytes로 변환
        options.allowedFormats
      );

    if (!basicValidation.valid) {
      return { valid: false, error: basicValidation.message };
    }

    // 서버 사이드에서는 차원 검증 건너뛰기 (클라이언트에서 이미 검증됨)
    // 차원 검증은 AdminImageEditDialog, chat-title-upload-form 등에서 클라이언트 사이드에서 수행
    
    return { valid: true };
  }

  /**
   * 외부 저장소로 이미지 업로드
   */
  static async uploadToExternalStorage(options: UploadOptions): Promise<UploadResult> {
    const { file, type } = options;

    // 파일 검증 (비동기로 변경)
    const validation = await this.validateFile(file, type);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("files", file);
      formData.append("bucket", "game");
    formData.append("folder", type === "killfeed" ? "killfeed" : "chat");

      const uploadUrl = `https://screenshot.dokku.co.kr/files?type=${type === "killfeed" ? "killfeed" : "chat"}`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "응답을 파싱할 수 없습니다." };
        }
        
        return {
          success: false,
          error: errorData.error || "이미지 업로드에 실패했습니다."
        };
      }

      // 성공 응답 처리
      const responseData = await response.json();
      
      // fileName이 없으면 URL에서 추출
      let fileName = responseData.fileName;
      if (!fileName && responseData.url) {
        fileName = responseData.url.split('/').pop() || 'uploaded_file';
      }
      
      return {
        success: true,
        url: responseData.url,
        fileName: fileName
      };
    } catch (error) {
      console.error("외부 API 업로드 오류:", error);
      return {
        success: false,
        error: "이미지 업로드 중 네트워크 오류가 발생했습니다."
      };
    }
  }
}

export const uploadService = new UploadService();