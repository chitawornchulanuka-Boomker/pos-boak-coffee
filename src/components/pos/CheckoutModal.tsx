import React, { useState, useEffect } from 'react';
import { Banknote, QrCode, X, ArrowLeft, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { BigNumpad } from '../common/BigNumpad';
import { formatBaht } from '../../utils/formatters';
import { generatePromptPayPayload } from '../../utils/promptpay';
import { playTapSound } from '../../utils/sound';
import type { CartItem, PaymentMethod } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  promptPayId: string;
  promptPayName: string;
  onCompleteOrder: (paymentMethod: PaymentMethod, receivedAmount: number, changeAmount: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  promptPayId,
  promptPayName,
  onCompleteOrder
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receivedInput, setReceivedInput] = useState<string>(String(totalAmount));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setReceivedInput(String(totalAmount));
      setPaymentMethod('cash');
    }
  }, [isOpen, totalAmount]);

  // Generate PromptPay QR Code when switched to promptpay
  useEffect(() => {
    if (isOpen && paymentMethod === 'promptpay' && promptPayId) {
      try {
        const payload = generatePromptPayPayload(promptPayId, totalAmount);
        QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1c1917',
            light: '#ffffff'
          }
        }).then(url => {
          setQrDataUrl(url);
        });
      } catch (err) {
        console.error('Error generating QR', err);
      }
    }
  }, [isOpen, paymentMethod, promptPayId, totalAmount]);

  if (!isOpen) return null;

  const receivedAmount = parseInt(receivedInput, 10) || 0;
  const changeAmount = Math.max(0, receivedAmount - totalAmount);
  const isInsufficient = receivedAmount < totalAmount;

  const handleSetQuickCash = (amt: number) => {
    playTapSound();
    setReceivedInput(String(amt));
  };

  const handleExactCash = () => {
    playTapSound();
    setReceivedInput(String(totalAmount));
  };

  const handleSubmitCash = () => {
    if (isInsufficient) return;
    onCompleteOrder('cash', receivedAmount, changeAmount);
  };

  const handleSubmitPromptPay = () => {
    onCompleteOrder('promptpay', totalAmount, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-pop-in">
      <div className="w-full max-w-4xl max-h-[95vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-stone-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 hover:bg-stone-800 rounded-xl text-stone-300 hover:text-white"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold">คิดเงิน / ชำระเงิน</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-xl text-stone-300 hover:text-white"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Total Amount Banner */}
        <div className="bg-amber-100 px-6 py-4 border-b-2 border-amber-300 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-stone-700 text-xl font-medium">ยอดที่ต้องชำระทั้งสิ้น:</span>
            <div className="text-4xl sm:text-5xl font-black text-amber-900">
              {formatBaht(totalAmount)}
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setPaymentMethod('cash');
              }}
              className={`px-5 py-3 rounded-2xl font-bold text-xl sm:text-2xl flex items-center gap-2 border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-105'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Banknote className="w-7 h-7" />
              <span>💵 เงินสด</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTapSound();
                setPaymentMethod('promptpay');
              }}
              className={`px-5 py-3 rounded-2xl font-bold text-xl sm:text-2xl flex items-center gap-2 border-2 transition-all ${
                paymentMethod === 'promptpay'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-105'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <QrCode className="w-7 h-7" />
              <span>📱 สแกน QR</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
          {paymentMethod === 'cash' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: Calculation & Quick Buttons */}
              <div className="space-y-4">
                {/* Received Box */}
                <div className="bg-white p-4 rounded-2xl border-2 border-stone-300 shadow-sm">
                  <div className="text-stone-600 text-lg font-semibold">รับเงินมา:</div>
                  <div className="text-4xl sm:text-5xl font-black text-stone-900 mt-1 font-mono">
                    {formatBaht(receivedAmount)}
                  </div>
                </div>

                {/* Change Box */}
                <div className={`p-4 rounded-2xl border-3 shadow-sm ${
                  isInsufficient 
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : 'bg-emerald-50 border-emerald-500 text-emerald-900'
                }`}>
                  <div className="text-lg font-bold">
                    {isInsufficient ? '⚠️ เงินยังไม่พอ (ขาดอีก)' : '🎉 เงินทอน:'}
                  </div>
                  <div className="text-4xl sm:text-5xl font-black mt-1">
                    {isInsufficient 
                      ? `${formatBaht(totalAmount - receivedAmount)}`
                      : `${formatBaht(changeAmount)}`}
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div>
                  <div className="text-stone-700 font-bold text-lg mb-2">ปุ่มลัดรับเงิน:</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleExactCash}
                      className="py-3.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xl rounded-xl shadow-sm border border-amber-600"
                    >
                      พอดี ({formatBaht(totalAmount)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(100)}
                      className="py-3.5 px-3 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-900 font-bold text-xl rounded-xl shadow-sm border-2 border-red-300"
                    >
                      แบงก์ 100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(500)}
                      className="py-3.5 px-3 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-900 font-bold text-xl rounded-xl shadow-sm border-2 border-purple-300"
                    >
                      แบงก์ 500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickCash(1000)}
                      className="py-3.5 px-3 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-900 font-bold text-xl rounded-xl shadow-sm border-2 border-stone-400"
                    >
                      แบงก์ 1,000
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Big Numpad */}
              <div className="bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-sm">
                <div className="text-stone-700 font-bold text-lg mb-2">
                  พิมพ์จำนวนเงินที่ได้รับ:
                </div>
                <BigNumpad
                  value={receivedInput}
                  onChange={setReceivedInput}
                  onEnter={handleSubmitCash}
                  enterLabel={isInsufficient ? 'ระบุเงินให้ครบ' : 'ยืนยันรับเงิน (บันทึก)'}
                />
              </div>
            </div>
          ) : (
            /* PromptPay QR View */
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border-4 border-blue-500 shadow-xl flex flex-col items-center max-w-sm text-center">
                <div className="text-xl font-bold text-blue-900 mb-1">
                  สแกนจ่ายผ่าน Thai QR PromptPay
                </div>
                <div className="text-stone-600 text-base mb-3 font-medium">
                  {promptPayName || 'ร้าน BOAK COFFEE'} ({promptPayId || 'ยังไม่ได้ตั้งค่าเบอร์'})
                </div>

                {qrDataUrl ? (
                  <div className="p-2 bg-white rounded-2xl border-2 border-stone-300 shadow-inner">
                    <img 
                      src={qrDataUrl} 
                      alt="PromptPay QR Code" 
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 bg-stone-200 flex items-center justify-center text-stone-500 rounded-2xl">
                    กรุณาตั้งค่าเบอร์พร้อมเพย์ที่เมนูตั้งค่า
                  </div>
                )}

                <div className="mt-4 text-3xl sm:text-4xl font-black text-blue-700">
                  {formatBaht(totalAmount)}
                </div>
                <div className="text-sm text-stone-500 mt-1">
                  ยอดตรงตามบิล ลูกค้าไม่ต้องพิมพ์ยอดเอง
                </div>
              </div>

              {/* Confirm PromptPay Button */}
              <button
                type="button"
                onClick={handleSubmitPromptPay}
                className="w-full max-w-md h-16 sm:h-20 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-2xl sm:text-3xl shadow-lg flex items-center justify-center gap-3 transition-transform"
              >
                <Check className="w-8 h-8" />
                <span>ลูกค้าโอนเงินแล้ว (บันทึก)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
