import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const session = JSON.parse(sessionCookie.value);
    
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
        token: session.token,
        permissions: session.permissions
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}

