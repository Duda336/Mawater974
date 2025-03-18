import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()

  // Add dynamic route handling
  const pathname = req.nextUrl.pathname

  // Handle dynamic routes that should not be statically generated
  if (pathname.startsWith('/contact') || 
      pathname.startsWith('/cars') || 
      pathname.startsWith('/admin') ||
      pathname.includes('/showrooms/') ||
      pathname.includes('/dealer-dashboard')) {
    const url = req.nextUrl.clone()
    url.searchParams.set('_dynamic', '1')
    return NextResponse.rewrite(url)
  }

  return res
}

export const config = {
  matcher: [
    '/contact',
    '/cars/:path*',
    '/admin/:path*',
    '/showrooms/:path*',
    '/dealer-dashboard/:path*'
  ]
}
