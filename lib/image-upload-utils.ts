import { toast } from "sonner";

// 업로드 유형에 따른 이미지 조건 정의
export interface ImageValidationOptions {
  maxSizeKB: number;
  allowedFormats: readonly string[];
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

// 각 이미지 타입별 조건 설정
const VALIDATION_OPTIONS = {
  chatTitle: {
    maxSizeKB: 500,
    allowedFormats: ["image/png", "image/webp", "image/gif"] as const,
    maxWidth: 800,
    maxHeight: 400,
    minWidth: 200,
    minHeight: 100,
  },
  killfeed: {
    maxSizeKB: 300,
    allowedFormats: ["image/png", "image/webp", "image/gif"] as const,
    maxWidth: 400,
    maxHeight: 200,
    minWidth: 100,
    minHeight: 50,
  },
} as const;

/**
 * 파일이 유효한 이미지인지 검증합니다.
 */
const validateImage = async (
  file: File,
  options: ImageValidationOptions
): Promise<boolean> => {
  // 파일 형식 체크
  if (!options.allowedFormats.includes(file.type)) {
    toast.error(
      `지원되지 않는 파일 형식입니다. 지원되는 형식: ${options.allowedFormats
        .map((format) => format.replace("image/", ""))
        .join(", ")}`
    );
    return false;
  }

  // 파일 크기 체크
  if (file.size > options.maxSizeKB * 1024) {
    toast.error(`파일 크기는 ${options.maxSizeKB}KB 이하여야 합니다.`);
    return false;
  }

  // 이미지 차원 체크 (선택적)
  if (
    options.maxWidth ||
    options.maxHeight ||
    options.minWidth ||
    options.minHeight
  ) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (options.maxWidth && img.width > options.maxWidth) {
          toast.error(`이미지 너비는 ${options.maxWidth}px 이하여야 합니다.`);
          resolve(false);
          return;
        }
        if (options.maxHeight && img.height > options.maxHeight) {
          toast.error(`이미지 높이는 ${options.maxHeight}px 이하여야 합니다.`);
          resolve(false);
          return;
        }
        if (options.minWidth && img.width < options.minWidth) {
          toast.error(`이미지 너비는 ${options.minWidth}px 이상이어야 합니다.`);
          resolve(false);
          return;
        }
        if (options.minHeight && img.height < options.minHeight) {
          toast.error(
            `이미지 높이는 ${options.minHeight}px 이상이어야 합니다.`
          );
          resolve(false);
          return;
        }
        resolve(true);
      };
      img.onerror = () => {
        toast.error("이미지를 로드하는 중 오류가 발생했습니다.");
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  return true;
};

/**
 * 파일을 서버에 업로드합니다.
 */
const uploadImageToServer = async (
  file: File,
  uploadUrl: string
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `이미지 업로드 실패: ${response.status}`
      );
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error("이미지 업로드 중 오류:", error);
    throw new Error(error.message || "이미지 업로드에 실패했습니다.");
  }
};

/**
 * 파일을 Data URL로 변환하는 유틸리티 함수
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("파일 읽기 실패"));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일 읽기 실패"));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 채팅 타이틀 이미지를 서버에 업로드하는 함수
 */
export const uploadChatTitleImage = async (file: File): Promise<string> => {
  // 파일 크기 검증 (500KB 제한)
  if (file.size > 500 * 1024) {
    throw new Error("파일 크기는 500KB 이하여야 합니다.");
  }

  // 파일 형식 검증
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("지원되는 파일 형식은 JPG, PNG, WebP입니다.");
  }

  // FormData 생성
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "chat-title");

  try {
    // 서버 API에 업로드 요청
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "이미지 업로드에 실패했습니다.");
    }

    const data = await response.json();
    return data.url;
  } catch (error: any) {
    console.error("채팅 타이틀 이미지 업로드 오류:", error);
    throw new Error(error.message || "이미지 업로드 중 오류가 발생했습니다.");
  }
};

/**
 * 킬피드 이미지를 업로드합니다.
 */
export const uploadKillfeedImage = async (file: File): Promise<string> => {
  const isValid = await validateImage(file, VALIDATION_OPTIONS.killfeed);
  if (!isValid) {
    throw new Error("유효하지 않은 이미지입니다.");
  }

  return uploadImageToServer(file, "/api/images/killfeed");
};

/**
 * 파일 확장자 추출 함수
 * @param fileName 파일명
 * @returns 확장자 (점 제외, 소문자)
 */
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  if (parts.length <= 1) return "";
  return parts[parts.length - 1].toLowerCase();
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 포맷팅
 * @param bytes 파일 크기 (바이트)
 * @param decimals 소수점 자리수
 * @returns 포맷팅된 크기 (예: 1.5 KB)
 */
export const formatFileSize = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

  return `${formattedSize} ${sizes[i]}`;
};

/**
 * 이미지 파일 유효성 검사
 * @param file 검사할 파일
 * @param maxSize 최대 크기 (바이트)
 * @param allowedTypes 허용된 MIME 타입 배열
 * @returns {valid: boolean, message?: string} 유효성 검사 결과
 */
export const validateImageFile = (
  file: File,
  maxSize = 300 * 1024, // 기본 300KB
  allowedTypes = ["image/jpeg", "image/png", "image/webp"]
): { valid: boolean; message?: string } => {
  // 파일 크기 검사
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다.`,
    };
  }

  // 파일 타입 검사
  if (!allowedTypes.includes(file.type)) {
    const formats = allowedTypes
      .map((type) => type.split("/")[1].toUpperCase())
      .join(", ");
    return {
      valid: false,
      message: `지원되는 파일 형식은 ${formats}입니다.`,
    };
  }

  return { valid: true };
};
