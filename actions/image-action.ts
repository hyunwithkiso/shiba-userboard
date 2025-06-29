"use server";

import { imageService } from "@/services/image-service";
import { revalidatePath } from "next/cache";

export async function deleteImage(imageId: number) {
  try {
    const result = await imageService.deleteImage(imageId);
    if (result) {
      revalidatePath("/admin/images");
      revalidatePath("/my-uploads");
    }
    return result;
  } catch (error) {
    console.error("Error in deleteImage action:", error);
    return false;
  }
}
