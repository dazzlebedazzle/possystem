import { NextResponse } from 'next/server';
import { productDB } from '@/lib/database';
import { hasPermission, MODULES, OPERATIONS } from '@/lib/permissions';

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
    
    // Check READ permission for products
    if (!hasPermission(session.permissions, MODULES.PRODUCTS, OPERATIONS.READ)) {
      return NextResponse.json(
        { error: 'Permission denied: products:read' },
        { status: 403 }
      );
    }
    
    const products = await productDB.findAll();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
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
    
    // Check CREATE permission for products
    if (!hasPermission(session.permissions, MODULES.PRODUCTS, OPERATIONS.CREATE)) {
      return NextResponse.json(
        { error: 'Permission denied: products:create' },
        { status: 403 }
      );
    }
    
    const { 
      EAN_code, 
      product_name, 
      images, 
      unit, 
      supplier, 
      qty, 
      qty_sold, 
      expiry_date, 
      date_arrival,
      price,
      category
    } = await request.json();
    
    if (!EAN_code || !product_name || qty === undefined) {
      return NextResponse.json(
        { error: 'EAN_code, product_name, and qty are required' },
        { status: 400 }
      );
    }
    
    const product = await productDB.create({
      EAN_code: parseInt(EAN_code),
      product_name,
      images: images || '',
      unit: unit || 'kg',
      supplier: supplier || '',
      qty: parseInt(qty || 0),
      qty_sold: parseInt(qty_sold || 0),
      expiry_date: expiry_date || '',
      date_arrival: date_arrival || '',
      price: parseFloat(price || 0),
      category: category || 'general'
    });
    
    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
