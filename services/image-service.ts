import { chatTitleSubmission, db } from "@/lib/schema";

import { killfeedSubmission } from "@/lib/schema";
import { eq } from "drizzle-orm";

class ImageService {
  async deleteImage(imageId: string, type: "killfeed" | "chat") {
    try {
      if (type === "killfeed") {
        await db
          .delete(killfeedSubmission)
          .where(eq(killfeedSubmission.id, imageId));
      } else if (type === "chat") {
        await db
          .delete(chatTitleSubmission)
          .where(eq(chatTitleSubmission.id, imageId));
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}

export const imageService = new ImageService();
