import { NextResponse } from 'next/server';
import { saleDB, productDB } from '@/lib/database';

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
    
    let sales = await saleDB.findAll();
    
    // Agents can only see their own sales
    if (session.role === 'agent') {
      sales = sales.filter(s => {
        const saleUserId = s.userId?._id?.toString() || s.userId?.toString() || s.userId;
        const sessionUserId = session.userId?.toString();
        return saleUserId === sessionUserId;
      });
    }
    
    return NextResponse.json({ sales });
  } catch (error) {
    console.error('Get sales error:', error);
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
    
    const { items, customerId, paymentMethod } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }
    
    // Calculate total and validate stock
    let total = 0;
    const saleItems = [];
    
    for (const item of items) {
      const product = await productDB.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }
      // Calculate available stock: qty - qty_sold
      const availableStock = (product.qty || 0) - (product.qty_sold || 0);
      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.product_name || product.name}` },
          { status: 400 }
        );
      }
      total += (product.price || 0) * item.quantity;
      saleItems.push({
        productId: product._id || product.id,
        quantity: item.quantity,
        price: product.price || 0,
        name: product.product_name || product.name
      });
    }
    
    // Create sale
    const sale = await saleDB.create({
      userId: session.userId,
      customerId: customerId || null,
      items: saleItems,
      total,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed'
    });
    
    // Update product qty_sold
    for (const item of saleItems) {
      const product = await productDB.findById(item.productId);
      if (product) {
        const currentQtySold = product.qty_sold || 0;
        await productDB.update(item.productId, {
          qty_sold: currentQtySold + item.quantity
        });
      }
    }
    
    return NextResponse.json({ success: true, sale });
  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
