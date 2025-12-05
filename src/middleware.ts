import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is logged in and tries to access the login page, redirect to dashboard
    if (
      req.nextUrl.pathname === "/login" &&
      req.nextauth.token
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      // Return true if the request is authorized to continue
      authorized: ({ token }) => {
        // If the user is trying to access an admin route, they must be authenticated
        return !!token;
      },
    },
  }
);

// Define which routes should be protected by the middleware
export const config = {
  matcher: [
    // Protect all routes under /dashboard
    '/dashboard/:path*',
  ],
};
