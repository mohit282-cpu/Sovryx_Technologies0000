import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Employee Portal Protection
  if (pathname.startsWith('/employee')) {
    const employeeSession = request.cookies.get('sovryx_employee_session')?.value;

    if (pathname === '/employee/login') {
      if (employeeSession) {
        return NextResponse.redirect(new URL('/employee/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Allow root /employee to proceed to login or dashboard via redirection in useEffect
    if (pathname === '/employee') {
      return NextResponse.next();
    }

    // Protect all other subroutes
    if (!employeeSession) {
      return NextResponse.redirect(new URL('/employee/login', request.url));
    }
  }

  // 2. Admin Portal Protection
  if (pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
    const adminSession = request.cookies.get('sovryx_admin_session')?.value;

    if (!adminSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const parsed = JSON.parse(adminSession);
      const role = parsed.role;
      const allowedRoles = ['CEO', 'Admin', 'HR', 'Manager'];
      if (!allowedRoles.includes(role)) {
        // Employees are sent to their portal
        return NextResponse.redirect(new URL('/employee/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employee/:path*'
  ],
};
