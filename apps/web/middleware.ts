import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/f/", "/login", "/signup"];

// Routes that should redirect to home if already logged in
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for better-auth session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");

  // Public paths check
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublic) {
    // If already logged in and trying to access login/signup, redirect to /
    if (AUTH_PATHS.includes(pathname) && sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes — require session cookie
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api).*)"],
};