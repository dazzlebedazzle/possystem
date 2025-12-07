'use client';

import { useState, useEffect } from 'react';
import Layout, { useSidebar } from '@/components/Layout';
import { toast } from '@/lib/toast';
import Receipt from '@/components/Receipt';

export default function SuperAdminPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    mobile: '',
    address: '',
    paymentType: ''
  });

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
      const allProducts = products.length > 0 ? products : (await fetch('/api/products').then(r => r.json())).products || [];
      
      if (data.categories) {
        const allCategory = { name: 'All', count: allProducts.length };
        setCategories([allCategory, ...data.categories]);
      } else {
        const uniqueCategories = ['All', ...new Set(allProducts.map(p => p.category || 'general'))];
        setCategories(uniqueCategories.map(cat => ({ 
          name: cat, 
          count: cat === 'All' ? allProducts.length : allProducts.filter(p => (p.category || 'general') === cat).length 
        })));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const allProducts = products.length > 0 ? products : [];
      const uniqueCategories = ['All', ...new Set(allProducts.map(p => p.category || 'general'))];
      setCategories(uniqueCategories.map(cat => ({ 
        name: cat, 
        count: cat === 'All' ? allProducts.length : allProducts.filter(p => (p.category || 'general') === cat).length 
      })));
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      fetchCategories();
    }
  }, [products.length]);

  const filteredProducts = products.filter(product => {
    if (!product) return false;
    const productName = (product.product_name || product.name || '').toLowerCase();
    const productEAN = (product.EAN_code || '').toString().toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = productName.includes(searchLower) || productEAN.includes(searchLower);
    const matchesCategory = selectedCategory === 'All' || (product.category || 'general').toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product) => {
    const availableStock = (product.qty || 0) - (product.qty_sold || 0);
    if (availableStock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const productId = product._id || product.id;
    const unit = product.unit || 'kg';
    const defaultQty = unit === 'kg' ? 100 : 1;

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      // Convert cart quantity to same unit as stock for comparison
      const cartQtyInStockUnit = unit === 'kg' ? existingItem.quantity / 1000 : existingItem.quantity;
      const newQtyInStockUnit = unit === 'kg' ? (existingItem.quantity + defaultQty) / 1000 : existingItem.quantity + defaultQty;
      
      if (newQtyInStockUnit > availableStock) {
        toast.error(`Insufficient stock. Only ${availableStock} ${unit} available`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + defaultQty }
          : item
      ));
      toast.success('Quantity updated in cart');
    } else {
      // Check if initial quantity exceeds stock
      const initialQtyInStockUnit = unit === 'kg' ? defaultQty / 1000 : defaultQty;
      if (initialQtyInStockUnit > availableStock) {
        toast.error(`Insufficient stock. Only ${availableStock} ${unit} available`);
        return;
      }
      
      setCart([...cart, {
        productId: productId,
        name: product.product_name || product.name,
        price: product.price || 0,
        quantity: defaultQty,
        unit: unit,
        profit: product.profit || 0,
        product_code: product.EAN_code || '',
        discount: product.discount || 0
      }]);
      toast.success('Product added to cart');
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => (p._id || p.id) === productId);
    const cartItem = cart.find(item => item.productId === productId);
    
    if (product && cartItem) {
      const availableStock = (product.qty || 0) - (product.qty_sold || 0);
      const unit = cartItem.unit || 'kg';
      
      // Convert quantity to same unit as stock for comparison
      const quantityInStockUnit = unit === 'kg' ? quantity / 1000 : quantity;
      
      if (quantityInStockUnit > availableStock) {
        toast.error(`Only ${availableStock} ${unit} available in stock`);
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
    return cart.reduce((sum, item) => {
      const qtyInUnit = item.unit === 'kg' ? item.quantity / 1000 : item.quantity;
      return sum + (item.price * qtyInUnit);
    }, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }

    if (!customerData.name || !customerData.mobile || !customerData.address || !customerData.paymentType) {
      toast.error('Please fill all customer details');
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            profit: item.profit || 0
          })),
          customerName: customerData.name,
          customerMobile: customerData.mobile,
          customerAddress: customerData.address,
          paymentMethod: customerData.paymentType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Sale completed successfully!');
        
        // Prepare receipt data
        const receipt = {
          receiptNumber: data.sale._id || 'RS-' + Date.now(),
          date: new Date(),
          customerName: customerData.name,
          customerMobile: customerData.mobile,
          customerAddress: customerData.address,
          paymentMethod: customerData.paymentType,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            total: (item.unit === 'kg' ? item.quantity / 1000 : item.quantity) * item.price
          })),
          subtotal: getTotal(),
          total: getTotal()
        };
        
        setReceiptData(receipt);
        setShowCheckoutPopup(false);
        setShowReceipt(true);
        setCart([]);
        setCustomerData({ name: '', mobile: '', address: '', paymentType: '' });
        fetchProducts();
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
    'apricots': '📦',
    'berries': '🫐',
    'cashews': '📦',
    'dates': '🍇',
    'figs': '🍑',
    'fruits': '📦',
    'mixtures': '📦',
    'cashew': '🥜',
    'pistachio': '🥜',
    'raisins': '🍇',
    'seeds': '🌰',
    'mixes': '🥗',
    'general': '📦'
  };

  const getCategoryIcon = (categoryName) => {
    return categoryIcons[categoryName.toLowerCase()] || '📦';
  };

  const getProductImage = (product) => {
    if (product.images) {
      return `/category_images/${product.images}`;
    }
    return null;
  };

  return (
    <Layout userRole="superadmin">
      <POSContent 
        products={products}
        cart={cart}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        showCheckoutPopup={showCheckoutPopup}
        setShowCheckoutPopup={setShowCheckoutPopup}
        customerData={customerData}
        setCustomerData={setCustomerData}
        filteredProducts={filteredProducts}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        getTotal={getTotal}
        handleCheckout={handleCheckout}
        getProductImage={getProductImage}
        getCategoryIcon={getCategoryIcon}
        showReceipt={showReceipt}
        setShowReceipt={setShowReceipt}
        receiptData={receiptData}
      />
    </Layout>
  );
}

function POSContent({ 
  products, 
  cart, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories, 
  showCheckoutPopup, 
  setShowCheckoutPopup, 
  customerData, 
  setCustomerData, 
  filteredProducts, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  getTotal, 
  handleCheckout,
  getProductImage,
  getCategoryIcon,
  showReceipt,
  setShowReceipt,
  receiptData
}) {
  const { sidebarWidth } = useSidebar();

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden -m-6" style={{ width: `calc(100vw - ${sidebarWidth}px)`, marginLeft: '-1.5rem', transition: 'width 0.3s ease' }}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Search Bar */}
          <div className="bg-white shadow-sm p-4 flex-shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Search product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Search
              </button>
            </form>
          </div>

          {/* Category Cards - Horizontal Scrollable */}
          <div className="bg-white border-b shadow-sm px-4 py-3 flex-shrink-0">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 pb-2" style={{ width: 'max-content' }}>
                {categories.map((category) => {
                  const categoryName = category.name || category;
                  const isSelected = selectedCategory === categoryName;
                  return (
                    <button
                      key={categoryName}
                      onClick={() => setSelectedCategory(categoryName)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all min-w-[66px] flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-amber-50 text-gray-700 hover:bg-amber-100 shadow-sm border border-amber-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        isSelected ? 'bg-white/20' : 'bg-white'
                      }`}>
                        {getCategoryIcon(categoryName)}
                      </div>
                      <span className="capitalize font-medium text-xs">{categoryName}</span>
                      {category.count !== undefined && category.count > 0 && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                          {category.count} items
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm animate-pulse" style={{ maxWidth: '200px' }}>
                    {/* Image Skeleton */}
                    <div className="w-full h-16 bg-gray-300 rounded-md mb-2"></div>
                    {/* Title Skeleton */}
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    {/* Price Skeleton */}
                    <div className="h-5 bg-gray-300 rounded w-2/3 mb-2"></div>
                    {/* Button Skeleton */}
                    <div className="h-8 bg-gray-300 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No products found</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredProducts.map((product) => {
                  const productId = product._id || product.id;
                  const availableStock = (product.qty || 0) - (product.qty_sold || 0);
                  const productImage = getProductImage(product);
                  
                  return (
                    <div
                      key={productId}
                      className={`bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm transition ${
                        availableStock > 0
                          ? 'hover:shadow-md cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{ maxWidth: '200px' }}
                    >
                      {/* Product Image - Clickable */}
                      <div 
                        onClick={() => availableStock > 0 && addToCart(product)}
                        className="mb-2 cursor-pointer"
                      >
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={product.product_name || product.name}
                            className="w-full h-16 object-cover rounded-md"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-16 bg-gray-200 rounded-md flex items-center justify-center ${productImage ? 'hidden' : 'flex'}`}
                        >
                          <span className="text-2xl">📦</span>
                        </div>
                      </div>
                      
                      <h3 className="font-medium text-xs text-gray-900 mb-1 line-clamp-2 min-h-[2rem]">
                        {product.product_name || product.name}
                      </h3>
                      <p className="text-sm font-bold text-purple-600 mb-2">
                        ₹{product.price || 0} {product.unit === 'packets' ? 'per packet' : 'per kg'}
                      </p>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={availableStock <= 0}
                        className="w-full bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs font-medium transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="bg-white shadow-lg border-l flex flex-col flex-shrink-0" style={{ width: 'clamp(280px, 20%, 380px)', minWidth: '280px' }}>
          <div className="p-3 border-b flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🛒</span> Cart
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-2">
            {cart.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const product = products.find(p => (p._id || p.id) === item.productId);
                  const availableStock = product ? (product.qty || 0) - (product.qty_sold || 0) : 0;
                  const qtyInUnit = item.unit === 'kg' ? item.quantity / 1000 : item.quantity;
                  const itemTotal = item.price * qtyInUnit;
                  
                  return (
                    <div key={item.productId} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-gray-900 mb-0.5">{item.name}</h4>
                          <p className="text-xs text-gray-500">Available: {availableStock} {item.unit}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - (item.unit === 'kg' ? 100 : 1))}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold"
                          >
                            -
                          </button>
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={item.unit === 'kg' ? item.quantity : item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (value >= 0) {
                                  updateQuantity(item.productId, value);
                                }
                              }}
                              className="w-16 text-sm text-center font-medium border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              min="0"
                            />
                            <span className="text-xs ml-1 text-gray-600">
                              {item.unit === 'kg' ? 'g' : 'pcs'}
                            </span>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + (item.unit === 'kg' ? 100 : 1))}
                            disabled={item.quantity >= availableStock}
                            className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900">₹{itemTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t p-3 bg-gray-50 flex-shrink-0">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-purple-600">₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCheckoutPopup(true)}
              disabled={cart.length === 0}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

        {/* Checkout Popup Overlay */}
        {showCheckoutPopup && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCheckoutPopup(false)}
            ></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div 
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Details</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter customer name"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile No <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Enter mobile number"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        value={customerData.mobile}
                        onChange={(e) => setCustomerData({ ...customerData, mobile: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Enter customer address"
                        value={customerData.address}
                        onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={customerData.paymentType}
                        onChange={(e) => setCustomerData({ ...customerData, paymentType: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                          customerData.paymentType === '' ? 'text-gray-400 border-gray-300' : 'text-gray-900 border-gray-300'
                        }`}
                      >
                        <option value="" disabled>Select Payment Type</option>
                        <option value="Cash">💵 Cash</option>
                        <option value="UPI">📱 UPI</option>
                        <option value="Card">💳 Card</option>
                      </select>
                      {customerData.paymentType === '' && (
                        <p className="mt-1 text-xs text-gray-500">Please select a payment method</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 font-medium transition"
                    >
                      Save & Print
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCheckoutPopup(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-300 font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <Receipt 
            saleData={receiptData}
            onClose={() => setShowReceipt(false)}
          />
        )}
    </div>
  );
}
