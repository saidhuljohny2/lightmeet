import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({
    isAdmin: Boolean(session),
    username: session?.username ?? null,
  });
}
