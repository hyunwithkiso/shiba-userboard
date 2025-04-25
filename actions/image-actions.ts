"use server";

import { z } from "zod";
import { checkAdmin } from "@/lib/auth-utils";
import { createClient } from "@supabase/supabase-js"; // Import Supabase client
import crypto from "crypto"; // For generating unique file names

// Supabase client setup (using Service Role Key for potentially bypassing RLS on upload)
// Ensure these environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Supabase URL or Service Key is not defined in environment variables."
  );
  // Optionally throw an error or handle this case appropriately
}

// Create a single Supabase client instance (server-side)
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const imageSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File is required.")
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      `파일 크기는 5MB를 초과할 수 없습니다.`
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type
        ),
      ".jpg, .jpeg, .png, .webp, .gif 파일만 업로드 가능합니다."
    ),
});

const BUCKET_NAME = "fileSubmission";

export async function uploadImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  // 1. 관리자 권한 확인
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { success: false, error: "관리자 권한이 없습니다." };
  }

  // 2. Supabase 클라이언트 확인
  if (!supabase) {
    return {
      success: false,
      error: "Supabase client could not be initialized.",
    };
  }

  // 3. 파일 유효성 검사
  const validatedFields = imageSchema.safeParse({
    file: formData.get("file"),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    console.error("Image Validation Errors:", errors);
    return {
      success: false,
      error: errors.file?.[0] || "잘못된 파일 형식 또는 크기입니다.",
    };
  }

  const { file } = validatedFields.data;

  console.log(
    `[Action:uploadImage] Validated file: ${file.name}, Size: ${file.size}, Type: ${file.type}`
  );

  // 4. Supabase Storage에 업로드
  try {
    // Generate a unique file path (e.g., using timestamp and random string)
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${Date.now()}-${crypto
      .randomBytes(8)
      .toString("hex")}.${fileExtension}`;
    const filePath = `events/${uniqueFileName}`; // Organize uploads into a folder

    console.log(
      `[Action:uploadImage] Uploading to Supabase bucket '${BUCKET_NAME}' with path: ${filePath}`
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        // cacheControl: '3600', // Optional: Set cache control headers
        // upsert: false // Optional: Prevent overwriting existing files with the same name
      });

    if (uploadError) {
      console.error("[Action:uploadImage] Supabase upload error:", uploadError);
      throw new Error(uploadError.message || "Supabase 업로드 중 오류 발생");
    }

    if (!uploadData || !uploadData.path) {
      console.error(
        "[Action:uploadImage] Supabase upload failed, no path returned."
      );
      throw new Error("Supabase 업로드 실패: 파일 경로를 받지 못했습니다.");
    }

    console.log(
      `[Action:uploadImage] File uploaded successfully. Path: ${uploadData.path}`
    );

    // 5. Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(
        "[Action:uploadImage] Could not get public URL for path:",
        uploadData.path
      );
      // Return success but maybe without URL, or handle as error depending on requirements
      return {
        success: false,
        error: "업로드 성공했으나 파일 URL을 가져올 수 없습니다.",
      };
    }

    const imageUrl = publicUrlData.publicUrl;
    console.log(`[Action:uploadImage] Public URL obtained: ${imageUrl}`);

    return { success: true, url: imageUrl };
  } catch (error) {
    console.error(
      "[Action:uploadImage] Error during Supabase upload process:",
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "이미지 업로드 처리 중 오류가 발생했습니다.",
    };
  }
}
