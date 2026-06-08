import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, validateAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  if (!validateAdminCredentials(body.username ?? "", body.password ?? "")) {
    return NextResponse.json({ message: "Invalid admin credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ isAdmin: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
