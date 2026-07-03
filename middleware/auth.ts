import { NextResponse, type NextRequest } from 'next/server';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

export async function authMiddleware(request: NextRequest) {
  const response = await updateSupabaseSession(request);
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/app');

  if (isProtectedRoute && !request.cookies.get('sb-access-token')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthRoute && request.cookies.get('sb-access-token')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
