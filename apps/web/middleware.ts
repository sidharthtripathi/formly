import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/f/"];

// Routes that should redirect to home if already logged in
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get JWT token - this works at Edge Runtime without database
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Check if the path is public
  const isPublic =
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    AUTH_PATHS.some((path) => pathname === path);

  if (isPublic) {
    // If already logged in and trying to access login/signup, redirect to /
    if (AUTH_PATHS.includes(pathname) && token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes — require token
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)"],
};