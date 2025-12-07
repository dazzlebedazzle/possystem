import { NextResponse } from 'next/server';
import { customerDB } from '@/lib/database';

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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const customers = await customerDB.findAll();
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { name, email, phone, address } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const customer = await customerDB.create({
      name,
      email: email || '',
      phone: phone || '',
      address: address || ''
    });
    
    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
