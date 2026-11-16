import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Use NextAuth JWT session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Protect owner/customer routes
  const isProtected = url.pathname.startsWith('/owner') || url.pathname.startsWith('/customer');
  if (!token && isProtected) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (token && isProtected) {
    const role = (token as any).role;
    if (url.pathname.startsWith('/owner') && role !== 'owner') {
      url.pathname = '/customer/dashboard';
      return NextResponse.redirect(url);
    }
    if (url.pathname.startsWith('/customer') && role !== 'customer') {
      url.pathname = '/owner/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/owner/:path*', '/customer/:path*'],
};
