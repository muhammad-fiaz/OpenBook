import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Authentication is always required
  const authRequired = true;
  
  if (!authRequired) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isPublicInvoice = request.nextUrl.pathname.startsWith("/invoice/");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isNextStatic = request.nextUrl.pathname.startsWith("/_next");
  const isPublicFolder = request.nextUrl.pathname.startsWith("/public");
  const isFavicon = request.nextUrl.pathname === "/favicon.ico";

  // Allow static assets, public invoices, auth API, and public folder
  if (isNextStatic || isPublicFolder || isFavicon || isApiAuth || isPublicInvoice) {
    return NextResponse.next();
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  // If not authenticated and trying to access protected pages (everything else), redirect to sign-in
  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
