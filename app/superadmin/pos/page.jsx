'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { toast } from '@/lib/toast';

export default function AdminPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories([{ name: 'all', count: products.length }, ...data.categories]);
      } else {
        const uniqueCategories = ['all', ...new Set(products.map(p => p.category || 'general'))];
        setCategories(uniqueCategories.map(cat => ({ name: cat, count: 0 })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const uniqueCategories = ['all', ...new Set(products.map(p => p.category || 'general'))];
      setCategories(uniqueCategories.map(cat => ({ name: cat, count: 0 })));
    }
  };

  const filteredProducts = products.filter(product => {
    if (!product) return false;
    const productName = (product.product_name || product.name || '').toLowerCase();
    const productEAN = (product.EAN_code || '').toString().toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = productName.includes(searchLower) || productEAN.includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || (product.category || 'general').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    // Calculate available stock: qty - qty_sold
    const availableStock = (product.qty || 0) - (product.qty_sold || 0);
    if (availableStock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const productId = product._id || product.id;
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity >= availableStock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success('Quantity updated in cart');
    } else {
      setCart([...cart, {
        productId: productId,
        name: product.product_name || product.name,
        price: product.price || 0,
        quantity: 1,
        unit: product.unit || 'kg'
      }]);
      toast.success('Product added to cart');
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // Find the product to check available stock
    const product = products.find(p => (p._id || p.id) === productId);
    if (product) {
      const availableStock = (product.qty || 0) - (product.qty_sold || 0);
      if (quantity > availableStock) {
        toast.error(`Only ${availableStock} available in stock`);
        return;
      }
    }
    
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          customerId: null,
          paymentMethod: 'cash'
        }),
      });

      if (response.ok) {
        toast.success('Sale completed successfully!');
        setCart([]);
        fetchProducts(); // Refresh products to update stock
      } else {
        const data = await response.json();
        toast.error(data.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Checkout failed');
    }
  };

  const categoryIcons = {
    'all': '🏪',
    'almonds': '🥜',
    'cashew': '🥜',
    'pistachio': '🥜',
    'raisins': '🍇',
    'berries': '🫐',
    'figs': '🍑',
    'dates': '🍇',
    'seeds': '🌰',
    'mixes': '🥗',
    'general': '📦'
  };

  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName.toLowerCase()] || '📦';
  };

  return (
    <Layout userRole="admin">
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Search and Categories Section */}
        <div className="bg-white shadow-sm p-4 flex flex-col flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => setSearchTerm('')}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Search
            </button>
          </div>

          {/* Category Cards - Scrollable */}
          <div 
            className="overflow-x-auto scrollbar-hide" 
            style={{ maxHeight: '140px' }}
            onWheel={(e) => {
              // Prevent vertical scroll from affecting parent
              if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
                e.stopPropagation();
              }
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
              {categories.map((category) => {
                const categoryName = category.name || category;
                const isSelected = selectedCategory === categoryName;
                return (
                  <button
                    key={categoryName}
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all min-w-[100px] flex-shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${
                      isSelected ? 'bg-white/20' : 'bg-amber-100'
                    }`}>
                      {getCategoryIcon(categoryName)}
                    </div>
                    <span className="capitalize font-medium text-sm">{categoryName}</span>
                    {category.count !== undefined && category.count > 0 && (
                      <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {category.count} items
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Products Grid */}
          <div className="flex-1 overflow-hidden p-4">
            {loading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 h-full overflow-y-auto">
                {filteredProducts.map((product) => {
                  const productId = product._id || product.id;
                  return (
                    <div
                      key={productId}
                      className={`bg-white border rounded-lg p-3 shadow-sm transition ${
                        product.stock > 0
                          ? 'hover:shadow-md cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {/* Product Image Placeholder */}
                      <div className="bg-gray-100 rounded-lg h-32 mb-2 flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                      
                      <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.product_name || product.name}
                      </h3>
                      <p className="text-lg font-bold text-indigo-600 mb-3">
                        ₹{product.price || 0} per {product.unit || 'kg'}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={((product.qty || 0) - (product.qty_sold || 0)) <= 0}
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shopping Cart */}
          <div className="w-80 bg-white shadow-lg border-l flex flex-col flex-shrink-0">
            <div className="p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🛒</span> Cart
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Cart is empty</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cart.map((item) => {
                      const product = products.find(p => (p._id || p.id) === item.productId);
                      const availableStock = product ? (product.qty || 0) - (product.qty_sold || 0) : 0;
                      return (
                        <tr key={item.productId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div>{item.name}</div>
                            <div className="text-xs text-gray-500">Available: {availableStock}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-xs"
                              >
                                -
                              </button>
                              <span className="text-sm w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= availableStock}
                                className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">{item.unit || 'kg'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900">₹{item.price}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t p-4 bg-gray-50 flex-shrink-0">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

