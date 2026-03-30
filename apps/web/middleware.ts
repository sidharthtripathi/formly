import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/f/"];

// Routes that should redirect to home if already logged in
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublic =
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    AUTH_PATHS.some((path) => pathname === path);

  if (isPublic) {
    // If already logged in and trying to access login/signup, redirect to /
    const session = await auth();
    if (AUTH_PATHS.includes(pathname) && session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes — require session
  const session = await auth();
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)"],
};