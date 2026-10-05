import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Coffee, 
  Milk, 
  CupSoda, 
  Snowflake, 
  Lightbulb, 
  Package, 
  Trash2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { db } from '../../db/db';
import { BigNumpad } from '../common/BigNumpad';
import { SuccessModal } from '../common/SuccessModal';
import { formatBaht, getTodayDateString, formatThaiDate, formatThaiTime } from '../../utils/formatters';
import { playTapSound, playDeleteSound } from '../../utils/sound';
import type { ExpenseCategory, Expense } from '../../types';

interface CategoryConfig {
  id: ExpenseCategory;
  name: string;
  subText: string;
  icon: React.FC<{ className?: string }>;
  colorClass: string;
  activeColorClass: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'coffee_beans',
    name: 'เมล็ดกาแฟ',
    subText: 'คั่วกลาง/เข้ม, สั่งจากโรงคั่ว',
    icon: Coffee,
    colorClass: 'bg-amber-50 border-amber-300 text-amber-900',
    activeColorClass: 'bg-amber-700 text-white border-amber-800'
  },
  {
    id: 'milk_syrup',
    name: 'นม / ไซรัป / ส่วนผสม',
    subText: 'นมสด, นมข้น, ชา, โกโก้, ไซรัป',
    icon: Milk,
    colorClass: 'bg-blue-50 border-blue-300 text-blue-900',
    activeColorClass: 'bg-blue-700 text-white border-blue-800'
  },
  {
    id: 'packaging',
    name: 'แก้ว / ฝา / บรรจุภัณฑ์',
    subText: 'แก้ว 16oz, หลอด, ถุงหิ้ว, ฝา',
    icon: CupSoda,
    colorClass: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    activeColorClass: 'bg-emerald-700 text-white border-emerald-800'
  },
  {
    id: 'ice_fresh',
    name: 'น้ำแข็ง / ของสด',
    subText: 'น้ำแข็งหลอด, มะนาว, ผลไม้',
    icon: Snowflake,
    colorClass: 'bg-cyan-50 border-cyan-300 text-cyan-900',
    activeColorClass: 'bg-cyan-700 text-white border-cyan-800'
  },
  {
    id: 'utilities',
    name: 'ค่าน้ำ / ค่าไฟ / ค่าแก๊ส',
    subText: 'บิลสาธารณูปโภคประจำร้าน',
    icon: Lightbulb,
    colorClass: 'bg-orange-50 border-orange-300 text-orange-900',
    activeColorClass: 'bg-orange-600 text-white border-orange-700'
  },
  {
    id: 'miscellaneous',
    name: 'ของใช้จิปาถะ / อื่นๆ',
    subText: 'ทิชชู่, น้ำยาล้างจาน, ซ่อมบำรุง',
    icon: Package,
    colorClass: 'bg-purple-50 border-purple-300 text-purple-900',
    activeColorClass: 'bg-purple-700 text-white border-purple-800'
  }
];

const QUICK_TAGS = ['ซื้อแม็คโคร', 'ซื้อโลตัส', 'ตลาดสด', 'สั่งออนไลน์', 'ร้านค้าหน้าบ้าน', 'จ่ายบิล'];

export const ExpenseView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('coffee_beans');
  const [amountInput, setAmountInput] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [successData, setSuccessData] = useState<{ categoryName: string; amount: number } | null>(null);

  const todayStr = getTodayDateString();

  // Load today's expenses from IndexedDB
  const todayExpenses = useLiveQuery(
    () => db.expenses.where('dateString').equals(todayStr).reverse().sortBy('timestamp')
  ) || [];

  const todayTotalExpenses = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

  const handleSelectCategory = (cat: ExpenseCategory) => {
    playTapSound();
    setSelectedCategory(cat);
  };

  const handleSaveExpense = async () => {
    const amount = parseInt(amountInput, 10);
    if (!amount || amount <= 0) return;

    const catObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const categoryName = catObj ? catObj.name : 'รายจ่าย';

    await db.expenses.add({
      timestamp: Date.now(),
      dateString: todayStr,
      category: selectedCategory,
      amount,
      note: note.trim() || undefined
    });

    setSuccessData({ categoryName, amount });
    setAmountInput('0');
    setNote('');
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('คุณต้องการลบรายการจ่ายนี้ใช่หรือไม่?')) {
      playDeleteSound();
      await db.expenses.delete(id);
    }
  };

  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="h-[calc(100vh-130px)] p-3 sm:p-4 max-w-[1600px] mx-auto overflow-y-auto">
      {/* Top Banner: Today's Expense Total */}
      <div className="mb-4 bg-gradient-to-r from-rose-700 to-rose-900 text-white rounded-3xl p-5 shadow-lg flex flex-wrap items-center justify-between border-2 border-rose-500">
        <div>
          <div className="text-rose-200 text-lg font-medium flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>รายจ่ายประจำวันนี้ ({formatThaiDate(todayStr)})</span>
          </div>
          <div className="text-3xl sm:text-5xl font-black mt-1">
            {formatBaht(todayTotalExpenses)}
          </div>
        </div>
        <div className="bg-rose-950/60 border border-rose-400/40 px-4 py-2 rounded-2xl text-rose-100 text-base font-bold">
          บันทึกแล้ว {todayExpenses.length} รายการ
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Category Selector & Keypad */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step 1: Select Category */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-stone-200 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-lg">1</span>
              <span>เลือกหมวดหมู่รายจ่าย:</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left flex flex-col justify-between transition-all min-h-[96px] ${
                      isSelected
                        ? `${cat.activeColorClass} shadow-md scale-102 ring-2 ring-rose-400`
                        : `${cat.colorClass} hover:bg-stone-50`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-bold">
                          เลือกอยู่
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-lg sm:text-xl leading-tight">
                        {cat.name}
                      </div>
                      <div className="text-xs opacity-80 truncate mt-0.5">
                        {cat.subText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Amount & Note */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-stone-200 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-lg">2</span>
              <span>ระบุจำนวนเงินที่จ่าย:</span>
            </h2>

            {/* Display amount box */}
            <div className="bg-stone-100 p-4 rounded-2xl border-2 border-stone-300 mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-stone-500">หมวด: {currentCategoryObj?.name}</span>
                <div className="text-4xl sm:text-5xl font-black text-stone-900 font-mono">
                  {formatBaht(parseInt(amountInput, 10) || 0)}
                </div>
              </div>
            </div>

            {/* Quick Note Tags */}
            <div className="mb-4">
              <div className="text-sm font-bold text-stone-600 mb-2">คำอธิบายเพิ่มเติม (เลือกหรือพิมพ์):</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setNote(tag);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 text-sm font-bold border border-stone-300"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="เช่น ซื้อเมล็ดกาแฟ 2 ถุง..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 rounded-xl border-2 border-stone-300 text-lg font-medium focus:outline-none focus:border-rose-600"
              />
            </div>

            {/* Big Numpad */}
            <BigNumpad
              value={amountInput}
              onChange={setAmountInput}
              onEnter={handleSaveExpense}
              enterLabel={`บันทึกรายจ่าย • ${formatBaht(parseInt(amountInput, 10) || 0)}`}
              showQuickAdds={true}
              quickAddValues={[50, 100, 300, 500]}
            />
          </div>
        </div>

        {/* Right Column (5 cols): Today's Expense History */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border-2 border-stone-200 shadow-sm flex flex-col h-full min-h-[500px]">
          <h2 className="text-2xl font-black text-stone-900 mb-3 flex items-center justify-between">
            <span>ประวัติรายจ่ายวันนี้</span>
            <span className="text-base font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800">
              {todayExpenses.length} รายการ
            </span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {todayExpenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <AlertCircle className="w-16 h-16 stroke-[1.5] text-stone-300 mb-2" />
                <p className="text-xl font-bold text-stone-600">ยังไม่มีรายจ่ายในวันนี้</p>
                <p className="text-base text-stone-400">เมื่อบันทึกแล้ว รายการจะแสดงที่นี่</p>
              </div>
            ) : (
              todayExpenses.map((exp: Expense) => {
                const catInfo = CATEGORIES.find((c) => c.id === exp.category);
                const Icon = catInfo?.icon || Package;
                return (
                  <div
                    key={exp.id}
                    className="p-3.5 bg-stone-50 rounded-2xl border-2 border-stone-200 flex items-center justify-between gap-3 shadow-sm hover:border-rose-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-stone-900 truncate">
                          {catInfo?.name || 'รายจ่าย'}
                        </div>
                        <div className="text-xs text-stone-500 font-medium">
                          {formatThaiTime(exp.timestamp)} {exp.note && `• ${exp.note}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-rose-700 font-mono">
                        -{formatBaht(exp.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id!)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          title="บันทึกรายจ่ายสำเร็จ!"
          subtitle={`หมวด: ${successData.categoryName}`}
          details={[
            { label: 'จำนวนเงินที่จ่าย', value: formatBaht(successData.amount), isHighlight: true },
            { label: 'วันที่บันทึก', value: formatThaiDate(todayStr) }
          ]}
        />
      )}
    </div>
  );
};
