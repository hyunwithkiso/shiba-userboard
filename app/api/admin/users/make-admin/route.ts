import { auth } from "@/lib/auth";
import { db, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }

    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[MAKE_ADMIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
