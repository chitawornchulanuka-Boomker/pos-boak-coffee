import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { playTapSound } from '../../utils/sound';

interface BigNumpadProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  enterLabel?: string;
  showQuickAdds?: boolean;
  quickAddValues?: number[];
}

export const BigNumpad: React.FC<BigNumpadProps> = ({
  value,
  onChange,
  onEnter,
  enterLabel = 'ยืนยัน',
  showQuickAdds = false,
  quickAddValues = [20, 50, 100, 500]
}) => {
  const handleDigit = (digit: string) => {
    playTapSound();
    if (value === '0') {
      onChange(digit);
    } else {
      // Limit to 8 digits
      if (value.length < 8) {
        onChange(value + digit);
      }
    }
  };

  const handleClear = () => {
    playTapSound();
    onChange('0');
  };

  const handleBackspace = () => {
    playTapSound();
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleQuickAdd = (amount: number) => {
    playTapSound();
    const current = parseInt(value, 10) || 0;
    onChange(String(current + amount));
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Quick Add Pills */}
      {showQuickAdds && (
        <div className="grid grid-cols-4 gap-2">
          {quickAddValues.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAdd(amt)}
              className="py-3 px-2 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 rounded-xl font-bold text-xl border-2 border-amber-300 shadow-sm transition-all text-center"
            >
              +{amt}
            </button>
          ))}
        </div>
      )}

      {/* Main 3x4 Numpad */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(String(num))}
            className="h-16 sm:h-20 bg-white hover:bg-stone-50 active:bg-stone-200 text-stone-800 rounded-2xl font-bold text-3xl sm:text-4xl border-2 border-stone-200 shadow-sm flex items-center justify-center transition-transform"
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="h-16 sm:h-20 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded-2xl font-bold text-xl sm:text-2xl border-2 border-rose-200 shadow-sm flex flex-col items-center justify-center gap-1 transition-transform"
        >
          <RotateCcw className="w-6 h-6" />
          <span>ล้าง</span>
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-16 sm:h-20 bg-white hover:bg-stone-50 active:bg-stone-200 text-stone-800 rounded-2xl font-bold text-3xl sm:text-4xl border-2 border-stone-200 shadow-sm flex items-center justify-center transition-transform"
        >
          0
        </button>

        {/* Backspace */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-16 sm:h-20 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 rounded-2xl font-bold text-xl sm:text-2xl border-2 border-stone-200 shadow-sm flex flex-col items-center justify-center gap-1 transition-transform"
        >
          <Delete className="w-7 h-7" />
          <span>ลบ</span>
        </button>
      </div>

      {/* Enter Action Button if provided */}
      {onEnter && (
        <button
          type="button"
          onClick={onEnter}
          className="w-full h-16 sm:h-20 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-2xl sm:text-3xl shadow-md flex items-center justify-center transition-all mt-1"
        >
          {enterLabel}
        </button>
      )}
    </div>
  );
};
