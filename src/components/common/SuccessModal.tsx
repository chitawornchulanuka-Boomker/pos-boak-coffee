import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccessChime } from '../../utils/sound';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  details?: { label: string; value: string; isHighlight?: boolean }[];
  autoCloseMs?: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  details = [],
  autoCloseMs = 3500
}) => {
  useEffect(() => {
    if (isOpen) {
      playSuccessChime();
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignore confetti if not supported
      }

      if (autoCloseMs > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseMs);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 text-center flex flex-col items-center gap-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Giant Green Checkmark */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 stroke-[2.5]" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xl sm:text-2xl text-stone-600 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Transaction Summary Box */}
        {details.length > 0 && (
          <div className="w-full bg-stone-50 rounded-2xl p-4 sm:p-5 border-2 border-stone-200 divide-y divide-stone-200">
            {details.map((item, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center py-2.5 ${item.isHighlight ? 'text-emerald-700 font-bold text-2xl' : 'text-stone-700 text-xl'}`}
              >
                <span>{item.label}</span>
                <span className={item.isHighlight ? 'text-3xl font-black text-emerald-600' : 'font-semibold'}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Giant Confirm Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-16 sm:h-20 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-2xl sm:text-3xl rounded-2xl shadow-lg transition-transform"
        >
          ตกลง (เรียบร้อย)
        </button>
      </div>
    </div>
  );
};
