import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Coffee, CupSoda, Cake, Sparkles, Search } from 'lucide-react';
import { db } from '../../db/db';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { SuccessModal } from '../common/SuccessModal';
import { formatBaht, getTodayDateString } from '../../utils/formatters';
import { playTapSound } from '../../utils/sound';
import type { MenuItem, CartItem, Category, PaymentMethod } from '../../types';

export const PosView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    orderNumber: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    changeAmount: number;
  } | null>(null);

  // Fetch menu items from IndexedDB
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const categories: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'ทั้งหมด', icon: Sparkles },
    { id: 'coffee', label: '☕ กาแฟสด', icon: Coffee },
    { id: 'tea', label: '🍵 ชา / เครื่องดื่ม', icon: CupSoda },
    { id: 'bakery', label: '🥐 ขนม / ของหวาน', icon: Cake },
  ];

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && item.available !== false;
  });

  const handleAddToCart = (item: MenuItem) => {
    playTapSound();
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (menuId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItem.id === menuId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null)
    );
  };

  const handleRemoveItem = (menuId: number) => {
    setCartItems((prev) => prev.filter((ci) => ci.menuItem.id !== menuId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCompleteOrder = async (
    paymentMethod: PaymentMethod,
    receivedAmount: number,
    changeAmount: number
  ) => {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );

    // Generate readable order number: e.g. B-0123
    const todayOrdersCount = await db.orders
      .where('dateString')
      .equals(getTodayDateString())
      .count();
    const orderNumber = `#${String(todayOrdersCount + 1).padStart(3, '0')}`;

    // Save order in IndexedDB
    await db.orders.add({
      orderNumber,
      timestamp: Date.now(),
      dateString: getTodayDateString(),
      items: [...cartItems],
      totalAmount,
      paymentMethod,
      receivedAmount,
      changeAmount,
    });

    setLastOrderDetails({
      orderNumber,
      totalAmount,
      paymentMethod,
      changeAmount,
    });

    // Close checkout and clear cart
    setIsCheckoutOpen(false);
    setCartItems([]);
  };

  const totalCartAmount = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  return (
    <div className="h-[calc(100vh-130px)] p-3 sm:p-4 flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto">
      {/* Left / Main Section: Category filter & Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-stone-100 rounded-3xl p-3 sm:p-4 border-2 border-stone-200 shadow-sm overflow-hidden">
        {/* Category Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-4 sm:px-6 py-3 rounded-2xl font-bold text-lg sm:text-xl whitespace-nowrap transition-all border-2 ${
                    isSelected
                      ? 'bg-amber-800 text-white border-amber-900 shadow-md scale-105'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Quick Search for fast lookup */}
          <div className="relative min-w-[200px] sm:max-w-xs">
            <Search className="w-6 h-6 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="ค้นหาเมนู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-stone-300 text-lg font-medium focus:outline-none focus:border-amber-600 shadow-inner"
            />
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-400 text-xl font-bold">
              ไม่พบรายการเมนูที่ค้นหา
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="bg-white hover:bg-amber-50/70 active:bg-amber-100 p-4 rounded-3xl border-2 border-stone-200 hover:border-amber-400 shadow-sm transition-all flex flex-col justify-between text-left group min-h-[140px] sm:min-h-[160px] relative overflow-hidden"
                >
                  {/* Popular Tag */}
                  {item.popular && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                      ⭐ ขายดี
                    </div>
                  )}

                  {/* Item Title */}
                  <div className="pr-12">
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-amber-950 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price Tag with Big Button Style */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
                      {formatBaht(item.price)}
                    </span>
                    <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-500 text-amber-900 group-hover:text-white flex items-center justify-center font-black text-2xl transition-colors shadow-sm">
                      +
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Cart Panel (Fixed width on tablet landscape) */}
      <div className="w-full lg:w-[420px] xl:w-[460px] h-[400px] lg:h-full shrink-0">
        <CartDrawer
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        totalAmount={totalCartAmount}
        promptPayId={settings?.promptPayId || ''}
        promptPayName={settings?.promptPayName || 'BOAK COFFEE'}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Success Modal */}
      {lastOrderDetails && (
        <SuccessModal
          isOpen={!!lastOrderDetails}
          onClose={() => setLastOrderDetails(null)}
          title="บันทึกการขายสำเร็จ!"
          subtitle={`ออเดอร์ ${lastOrderDetails.orderNumber}`}
          details={[
            { label: 'ยอดรวมทั้งสิ้น', value: formatBaht(lastOrderDetails.totalAmount), isHighlight: true },
            { 
              label: 'วิธีชำระ', 
              value: lastOrderDetails.paymentMethod === 'cash' ? '💵 เงินสด' : '📱 สแกน QR' 
            },
            ...(lastOrderDetails.paymentMethod === 'cash' && lastOrderDetails.changeAmount > 0
              ? [{ label: 'เงินทอนให้ลูกค้า', value: formatBaht(lastOrderDetails.changeAmount), isHighlight: true }]
              : [])
          ]}
        />
      )}
    </div>
  );
};
