"use server";

import { imageService } from "@/services/image-service";
import { revalidatePath } from "next/cache";

export async function deleteImage(imageId: string, type: "killfeed" | "chat") {
  try {
    const result = await imageService.deleteImage(imageId, type);
    if (result) {
      revalidatePath("/admin/images");
    }
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}
