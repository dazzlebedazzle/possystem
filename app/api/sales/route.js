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
    
    const { items, customerId, customerName, customerMobile, customerAddress, paymentMethod } = await request.json();
    
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
      
      // Convert item quantity to stock unit for comparison
      const unit = item.unit || product.unit || 'kg';
      const itemQuantityInStockUnit = unit === 'kg' ? item.quantity / 1000 : item.quantity;
      
      if (availableStock < itemQuantityInStockUnit) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.product_name || product.name}. Only ${availableStock} ${unit} available` },
          { status: 400 }
        );
      }
      
      // Calculate price based on unit
      const qtyInUnit = unit === 'kg' ? item.quantity / 1000 : item.quantity;
      total += (product.price || 0) * qtyInUnit;
      
      saleItems.push({
        productId: product._id || product.id,
        quantity: item.quantity,
        unit: unit,
        price: product.price || 0,
        name: product.product_name || product.name
      });
    }
    
    // Create sale
    const sale = await saleDB.create({
      userId: session.userId,
      customerId: customerId || null,
      customerName: customerName || null,
      customerMobile: customerMobile || null,
      customerAddress: customerAddress || null,
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
        // Convert quantity to stock unit before updating
        const unit = item.unit || product.unit || 'kg';
        const quantityInStockUnit = unit === 'kg' ? item.quantity / 1000 : item.quantity;
        
        await productDB.update(item.productId, {
          qty_sold: currentQtySold + quantityInStockUnit
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
