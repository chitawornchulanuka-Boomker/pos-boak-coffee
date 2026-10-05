import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Share2, 
  Download, 
  Coffee, 
  Check, 
  Calendar,
  Sparkles,
  Banknote,
  QrCode
} from 'lucide-react';
import { db } from '../../db/db';
import { 
  formatBaht, 
  getTodayDateString, 
  getCurrentMonthString, 
  formatThaiDate, 
  formatThaiMonth 
} from '../../utils/formatters';
import { playTapSound, playSuccessChime } from '../../utils/sound';

type TimeFilter = 'today' | 'month' | 'all';

export const DashboardView: React.FC = () => {
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const todayStr = getTodayDateString();
  const currentMonth = getCurrentMonthString();

  // Load all orders and expenses
  const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  // Filter orders & expenses according to selected filter
  const filteredOrders = allOrders.filter((order) => {
    if (filter === 'today') return order.dateString === todayStr;
    if (filter === 'month') return order.dateString.startsWith(currentMonth);
    return true;
  });

  const filteredExpenses = allExpenses.filter((exp) => {
    if (filter === 'today') return exp.dateString === todayStr;
    if (filter === 'month') return exp.dateString.startsWith(currentMonth);
    return true;
  });

  // Calculate Aggregates
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  // Breakdown by payment method
  const cashOrders = filteredOrders.filter((o) => o.paymentMethod === 'cash');
  const promptPayOrders = filteredOrders.filter((o) => o.paymentMethod === 'promptpay');

  const cashSales = cashOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const promptPaySales = promptPayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Total cups/items sold
  const totalCupsSold = filteredOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Top selling items
  const itemCounts: { [name: string]: number } = {};
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      itemCounts[item.menuItem.name] = (itemCounts[item.menuItem.name] || 0) + item.quantity;
    });
  });

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // LINE Closing Report Generator
  const handleCopyLineReport = () => {
    playSuccessChime();
    const periodName = 
      filter === 'today' ? `ประจำวัน ${formatThaiDate(todayStr)}` :
      filter === 'month' ? `ประจำเดือน ${formatThaiMonth(currentMonth)}` : 'ยอดรวมทั้งหมด';

    const text = `☕ สรุปยอดร้าน ${settings?.shopName || 'BOAK COFFEE'}
📅 ${periodName}
-------------------------
🟢 ยอดขายรวม: ${formatBaht(totalSales)} (${filteredOrders.length} บิล / ${totalCupsSold} แก้ว)
   💵 เงินสด: ${formatBaht(cashSales)}
   📱 สแกน QR: ${formatBaht(promptPaySales)}
🔴 รายจ่ายรวม: ${formatBaht(totalExpenses)} (${filteredExpenses.length} รายการ)
-------------------------
💰 กำไรสุทธิคงเหลือ: ${formatBaht(netProfit)}
-------------------------
✨ ยอดขายดี 3 อันดับแรก:
${topItems.slice(0, 3).map((item, idx) => `  ${idx + 1}. ${item[0]} (${item[1]} แก้ว)`).join('\n') || '  - ไม่มีข้อมูล -'}

ขอบคุณครับ/ค่ะ 🙏`;

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    playTapSound();
    let csv = '\uFEFF'; // UTF-8 BOM for Excel in Thai
    csv += 'ประเภท,วันที่,เวลา,รายการ/หมวด,จำนวนเงิน(บาท),วิธีชำระ/หมายเหตุ\n';

    filteredOrders.forEach((o) => {
      const time = new Date(o.timestamp).toLocaleTimeString('th-TH');
      const itemsDesc = o.items.map((i) => `${i.menuItem.name}x${i.quantity}`).join(';');
      csv += `รายรับ (ขายได้),${o.dateString},${time},"${itemsDesc}",${o.totalAmount},${o.paymentMethod}\n`;
    });

    filteredExpenses.forEach((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString('th-TH');
      csv += `รายจ่าย,${e.dateString},${time},${e.category},${e.amount},"${e.note || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `boak-coffee-report-${filter}-${todayStr}.csv`;
    link.click();
  };

  return (
    <div className="h-[calc(100vh-130px)] p-3 sm:p-4 max-w-[1600px] mx-auto overflow-y-auto space-y-5">
      {/* Top Filter Bar & Quick Actions */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setFilter('today');
            }}
            className={`px-5 py-3 rounded-2xl font-bold text-lg sm:text-xl transition-all border-2 ${
              filter === 'today'
                ? 'bg-amber-800 text-white border-amber-900 shadow-md scale-102'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
            }`}
          >
            📅 วันนี้ ({formatThaiDate(todayStr)})
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setFilter('month');
            }}
            className={`px-5 py-3 rounded-2xl font-bold text-lg sm:text-xl transition-all border-2 ${
              filter === 'month'
                ? 'bg-amber-800 text-white border-amber-900 shadow-md scale-102'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
            }`}
          >
            🗓️ เดือนนี้ ({formatThaiMonth(currentMonth)})
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setFilter('all');
            }}
            className={`px-5 py-3 rounded-2xl font-bold text-lg sm:text-xl transition-all border-2 ${
              filter === 'all'
                ? 'bg-amber-800 text-white border-amber-900 shadow-md scale-102'
                : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
            }`}
          >
            📊 ทั้งหมด
          </button>
        </div>

        {/* Action Buttons: Copy LINE & Export Excel */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyLineReport}
            className={`px-5 py-3.5 rounded-2xl font-bold text-lg sm:text-xl flex items-center gap-2.5 shadow-md transition-all ${
              copySuccess
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-[#06C755] hover:bg-[#05b34c] text-white active:scale-95'
            }`}
          >
            {copySuccess ? <Check className="w-6 h-6 stroke-[3]" /> : <Share2 className="w-6 h-6" />}
            <span>{copySuccess ? 'คัดลอกลงคลิปบอร์ดแล้ว!' : 'คัดลอกสรุปส่ง LINE'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-5 py-3.5 bg-stone-800 hover:bg-stone-900 active:bg-black text-white rounded-2xl font-bold text-lg sm:text-xl flex items-center gap-2.5 shadow-md transition-all"
          >
            <Download className="w-6 h-6" />
            <span>โหลด Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* 3 GIANT METRIC CARDS for 50+ Senior Readability */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Money IN (Total Sales) */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 border-emerald-400 flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-100 flex items-center gap-2">
              🟢 เงินเข้า (ขายได้)
            </span>
            <span className="p-2.5 bg-white/20 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </span>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono">
              {formatBaht(totalSales)}
            </div>
            <div className="text-emerald-100 text-base sm:text-lg font-bold mt-2">
              {filteredOrders.length} ออเดอร์ • รวม {totalCupsSold} แก้ว/ชิ้น
            </div>
          </div>
        </div>

        {/* Card 2: Money OUT (Total Expenses) */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 border-rose-400 flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-100 flex items-center gap-2">
              🔴 เงินออก (จ่ายไป)
            </span>
            <span className="p-2.5 bg-white/20 rounded-2xl">
              <TrendingDown className="w-8 h-8 text-white" />
            </span>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono">
              {formatBaht(totalExpenses)}
            </div>
            <div className="text-rose-100 text-base sm:text-lg font-bold mt-2">
              {filteredExpenses.length} รายการค่าใช้จ่าย
            </div>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className={`text-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 flex flex-col justify-between min-h-[180px] ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-400'
            : 'bg-gradient-to-br from-red-600 to-red-800 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-100 flex items-center gap-2">
              💰 กำไรสุทธิคงเหลือ
            </span>
            <span className="p-2.5 bg-white/20 rounded-2xl">
              <DollarSign className="w-8 h-8 text-white" />
            </span>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono">
              {formatBaht(netProfit)}
            </div>
            <div className="text-amber-100 text-base sm:text-lg font-bold mt-2">
              {netProfit >= 0 ? '✨ ยอดเงินบวก เข้ากระเป๋า' : '⚠️ ยอดรายจ่ายมากกว่ารายรับ'}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid: Payment Method Breakdown & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Methods Box */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 shadow-sm space-y-4">
          <h3 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <span>แยกตามช่องทางรับเงิน</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash */}
            <div className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Banknote className="w-8 h-8" />
              </div>
              <div>
                <div className="text-stone-500 text-base font-bold">💵 เงินสด</div>
                <div className="text-3xl font-black text-stone-900 font-mono">
                  {formatBaht(cashSales)}
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  {cashOrders.length} ออเดอร์
                </div>
              </div>
            </div>

            {/* PromptPay */}
            <div className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-200 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <div className="text-stone-500 text-base font-bold">📱 สแกน QR</div>
                <div className="text-3xl font-black text-stone-900 font-mono">
                  {formatBaht(promptPaySales)}
                </div>
                <div className="text-xs text-stone-500 font-medium">
                  {promptPayOrders.length} ออเดอร์
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Best Sellers */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-stone-200 shadow-sm space-y-4">
          <h3 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-500" />
            <span>5 เมนูขายดีที่สุด</span>
          </h3>

          <div className="space-y-2.5">
            {topItems.length === 0 ? (
              <div className="text-stone-400 text-lg py-6 text-center font-bold">
                ยังไม่มีรายการขายในช่วงเวลานี้
              </div>
            ) : (
              topItems.map(([name, count], index) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black text-base flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xl font-bold text-stone-900">{name}</span>
                  </div>
                  <span className="text-2xl font-black text-amber-900 font-mono">
                    {count} <span className="text-sm font-semibold text-stone-500">แก้ว</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
