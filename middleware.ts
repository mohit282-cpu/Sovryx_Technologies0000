import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read cookies
  const adminSession = request.cookies.get('sovryx_admin_session')?.value;
  const employeeSession = request.cookies.get('sovryx_employee_session')?.value;

  // 1. Root page handler - redirect based on existing sessions
  if (pathname === '/') {
    if (adminSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (employeeSession) {
      return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Admin Login page handler
  if (pathname === '/login') {
    if (adminSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 3. Employee Login page handler
  if (pathname === '/employee/login') {
    if (employeeSession) {
      return NextResponse.redirect(new URL('/employee/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Employee Portal Protection
  if (pathname.startsWith('/employee')) {
    // If not logged in and not on login page, redirect to employee login
    if (!employeeSession) {
      return NextResponse.redirect(new URL('/employee/login', request.url));
    }

    try {
      const parsed = JSON.parse(employeeSession);
      const role = parsed.role;
      // CEO/Admin/HR/Manager shouldn't access employee portal; redirect to admin portal
      if (role !== 'Employee') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/employee/login', request.url));
    }
  }

  // 5. Admin Portal Protection
  if (pathname.startsWith('/dashboard')) {
    // If not logged in, redirect to admin login
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const parsed = JSON.parse(adminSession);
      const role = parsed.role;
      const allowedRoles = ['CEO', 'Admin', 'HR', 'Manager'];
      // Employee role shouldn't access admin portal; redirect to employee portal
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/employee/dashboard', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/employee/:path*'
  ],
};
