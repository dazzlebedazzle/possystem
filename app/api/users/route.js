import { NextResponse } from 'next/server';
import { userDB } from '@/lib/database';
import { hashPassword, getTokenByRole } from '@/lib/auth';
import { getDefaultPermissions } from '@/lib/permissions';

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('session');
    let session = null;
    
    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie.value);
      } catch (e) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    if (!session || !['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const users = await userDB.findAll();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const sessionCookie = request.cookies.get('session');
    let session = null;
    
    if (sessionCookie) {
      try {
        session = JSON.parse(sessionCookie.value);
      } catch (e) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmin can create users' },
        { status: 403 }
      );
    }
    
    const { email, password, name, role, permissions } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    const existingUser = await userDB.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Get token based on role
    const token = getTokenByRole(role || 'agent');
    
    // Use provided permissions or default permissions for the role
    const userPermissions = permissions && permissions.length > 0 
      ? permissions 
      : getDefaultPermissions(role || 'agent');
    
    const newUser = await userDB.create({
      email,
      password: hashedPassword,
      name,
      role: role || 'agent',
      token: token,
      permissions: userPermissions
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id || newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        token: newUser.token,
        permissions: newUser.permissions
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
