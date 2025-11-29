import { auth } from "@/lib/auth";
import { users } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { userService } from "@/services/user-service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = await userService.getUserInfo(session.user.id);

    if (!isAdmin.success || !isAdmin.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }

    await db.update(users).set({ isAdmin: false }).where(eq(users.id, userId));

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[REMOVE_ADMIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
