import { NextResponse } from 'next/server';
import { inventoryDB, productDB } from '@/lib/database';

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
    
    const inventory = await inventoryDB.findAll();
    return NextResponse.json({ inventory });
  } catch (error) {
    console.error('Get inventory error:', error);
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
    
    if (!session || !['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const { productId, quantity, type, notes } = await request.json();
    
    if (!productId || !quantity || !type) {
      return NextResponse.json(
        { error: 'Product ID, quantity, and type are required' },
        { status: 400 }
      );
    }
    
    const product = await productDB.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 400 }
      );
    }
    
    // Update product stock based on type
    if (type === 'add') {
      await productDB.update(productId, {
        stock: product.stock + parseInt(quantity)
      });
    } else if (type === 'remove') {
      if (product.stock < quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
      await productDB.update(productId, {
        stock: product.stock - parseInt(quantity)
      });
    }
    
    const inventoryItem = await inventoryDB.create({
      productId,
      quantity: parseInt(quantity),
      type,
      notes: notes || '',
      userId: session.userId
    });
    
    return NextResponse.json({ success: true, inventory: inventoryItem });
  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
