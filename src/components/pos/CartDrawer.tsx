import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatBaht } from '../../utils/formatters';
import { playTapSound, playDeleteSound } from '../../utils/sound';
import type { CartItem } from '../../types';

interface CartDrawerProps {
  items: CartItem[];
  onUpdateQuantity: (menuId: number, delta: number) => void;
  onRemoveItem: (menuId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout
}) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const handleUpdate = (id: number, delta: number) => {
    playTapSound();
    onUpdateQuantity(id, delta);
  };

  const handleRemove = (id: number) => {
    playDeleteSound();
    onRemoveItem(id);
  };

  const handleClear = () => {
    playDeleteSound();
    onClearCart();
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl shadow-lg border-2 border-stone-200 overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 bg-amber-50 border-b-2 border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-stone-900">
          <ShoppingBag className="w-7 h-7 text-amber-700" />
          <h2 className="text-2xl font-bold">รายการที่สั่ง</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-lg font-bold">
            {totalQuantity} รายการ
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-stone-500 hover:text-rose-600 px-2 py-1 text-sm font-semibold rounded-lg hover:bg-rose-50"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <ShoppingBag className="w-16 h-16 stroke-[1.5] text-stone-300 mb-3" />
            <p className="text-xl font-bold text-stone-600">ยังไม่มีรายการที่เลือก</p>
            <p className="text-base text-stone-400 mt-1">แตะเลือกเมนูด้านซ้ายเพื่อเพิ่มลงในรายการ</p>
          </div>
        ) : (
          items.map((item) => {
            const itemTotal = item.menuItem.price * item.quantity;
            return (
              <div
                key={item.menuItem.id}
                className="bg-stone-50 p-3.5 rounded-2xl border-2 border-stone-200 flex items-center justify-between gap-3 shadow-sm hover:border-amber-300 transition-colors"
              >
                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-stone-900 truncate">
                    {item.menuItem.name}
                  </h3>
                  <div className="text-stone-500 text-base font-semibold">
                    {formatBaht(item.menuItem.price)} / แก้ว
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-300 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleUpdate(item.menuItem.id!, -1)}
                    className="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 flex items-center justify-center text-stone-700 font-bold"
                  >
                    <Minus className="w-5 h-5 stroke-[3]" />
                  </button>
                  <span className="w-9 text-center font-black text-2xl text-stone-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdate(item.menuItem.id!, 1)}
                    className="w-10 h-10 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 flex items-center justify-center text-white font-bold"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>

                {/* Item Line Total */}
                <div className="text-right min-w-[70px]">
                  <div className="text-xl font-black text-amber-900">
                    {formatBaht(itemTotal)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.menuItem.id!)}
                    className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors inline-block mt-0.5"
                    title="ลบรายการ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Footer */}
      <div className="p-4 bg-stone-100 border-t-2 border-stone-200 space-y-3">
        {/* Total Price Display */}
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-stone-700">ยอดรวมทั้งสิ้น:</span>
          <span className="text-4xl font-black text-emerald-700 font-mono">
            {formatBaht(totalAmount)}
          </span>
        </div>

        {/* Big Checkout Button */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCheckout}
          className={`w-full h-18 sm:h-20 rounded-2xl font-black text-2xl sm:text-3xl flex items-center justify-center gap-3 shadow-lg transition-all ${
            items.length > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer hover:scale-[1.01]'
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
        >
          <span>คิดเงิน • {formatBaht(totalAmount)}</span>
          <ArrowRight className="w-8 h-8 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
