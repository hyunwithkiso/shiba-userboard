import { db, gallery } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export interface CreateGalleryItemInput {
  url: string;
  title?: string | null;
  createdBy: string; // users.id
  width?: number | null;
  height?: number | null;
}

class GalleryService {
  async create(item: CreateGalleryItemInput) {
    const [row] = await db
      .insert(gallery)
      .values({
        url: item.url,
        title: item.title ?? null,
        createdBy: item.createdBy,
        width: item.width ?? null,
        height: item.height ?? null,
      })
      .returning();

    return row;
  }

  async list(options?: { limit?: number; offset?: number }) {
    const limit = options?.limit ?? 24;
    const offset = options?.offset ?? 0;
    return db
      .select()
      .from(gallery)
      .orderBy(desc(gallery.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getById(id: string) {
    const rows = await db.select().from(gallery).where(eq(gallery.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async incrementDownload(id: string) {
    const item = await this.getById(id);
    if (!item) return false;

    const newCount = (item.downloadCount ?? 0) + 1;
    const [updated] = await db
      .update(gallery)
      .set({ downloadCount: newCount, updatedAt: new Date() })
      .where(eq(gallery.id, id))
      .returning();
    return !!updated;
  }
}

export const galleryService = new GalleryService();

