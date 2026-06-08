import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSignalToken, verifyAdminSession } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "Admin login required." }, { status: 401 });
  }

  return NextResponse.json({ token: createAdminSignalToken() });
}
