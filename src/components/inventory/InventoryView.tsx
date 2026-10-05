import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Package, 
  PlusCircle, 
  ClipboardCheck, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Minus, 
  Save, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../db/db';
import { SuccessModal } from '../common/SuccessModal';
import { formatBaht, getCurrentMonthString, formatThaiMonth } from '../../utils/formatters';
import { playTapSound, playSuccessChime } from '../../utils/sound';
import type { ExpenseCategory, InventoryItem, MonthlyAudit } from '../../types';

export const InventoryView: React.FC = () => {
  const [subTab, setSubTab] = useState<'audit' | 'restock' | 'items'>('audit');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  
  // State for monthly audit editing
  const [endingCounts, setEndingCounts] = useState<{ [itemId: number]: number }>({});
  
  // State for restocking
  const [restockItemId, setRestockItemId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState<number>(1);
  const [syncToExpenses, setSyncToExpenses] = useState<boolean>(true);

  // State for adding new item
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('ชิ้น');
  const [newItemCost, setNewItemCost] = useState<number>(100);

  const [successInfo, setSuccessInfo] = useState<{ title: string; subtitle: string } | null>(null);

  // Queries
  const inventoryItems = useLiveQuery(() => db.inventoryItems.toArray()) || [];
  const existingAudits = useLiveQuery(
    () => db.inventoryAudits.where('monthString').equals(selectedMonth).toArray(),
    [selectedMonth]
  ) || [];

  // Update ending count in state
  const handleCountChange = (itemId: number, value: number) => {
    playTapSound();
    setEndingCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, value)
    }));
  };

  // Save monthly audit to DB
  const handleSaveMonthlyAudit = async () => {
    for (const item of inventoryItems) {
      const ending = endingCounts[item.id!] ?? item.currentStock;
      const beginning = item.currentStock; // Initial baseline
      const added = 0; // If any purchases logged
      const usage = Math.max(0, beginning + added - ending);
      const totalUsageCost = usage * item.costPerUnit;

      // Update or add audit record
      const existing = existingAudits.find((a) => a.itemId === item.id);
      if (existing) {
        await db.inventoryAudits.update(existing.id!, {
          endingStock: ending,
          usage,
          totalUsageCost,
          auditDate: new Date().toISOString().split('T')[0]
        });
      } else {
        await db.inventoryAudits.add({
          monthString: selectedMonth,
          auditDate: new Date().toISOString().split('T')[0],
          itemId: item.id!,
          itemName: item.name,
          unit: item.unit,
          beginningStock: beginning,
          addedStock: added,
          endingStock: ending,
          usage,
          costPerUnit: item.costPerUnit,
          totalUsageCost
        });
      }

      // Update current stock of item to the newly counted ending stock
      await db.inventoryItems.update(item.id!, {
        currentStock: ending,
        lastUpdated: Date.now()
      });
    }

    setSuccessInfo({
      title: 'บันทึกสต็อกประจำเดือนสำเร็จ!',
      subtitle: `รอบเดือน: ${formatThaiMonth(selectedMonth)}`
    });
  };

  // Restock action
  const handleConfirmRestock = async () => {
    if (!restockItemId || restockQty <= 0) return;
    const targetItem = inventoryItems.find((i) => i.id === restockItemId);
    if (!targetItem) return;

    const newStock = targetItem.currentStock + restockQty;
    await db.inventoryItems.update(targetItem.id!, {
      currentStock: newStock,
      lastUpdated: Date.now()
    });

    // Optionally sync to expense
    if (syncToExpenses) {
      const totalCost = restockQty * targetItem.costPerUnit;
      let expCategory: ExpenseCategory = 'miscellaneous';
      if (targetItem.category === 'beans') expCategory = 'coffee_beans';
      else if (targetItem.category === 'dairy' || targetItem.category === 'beverage_base') expCategory = 'milk_syrup';
      else if (targetItem.category === 'packaging') expCategory = 'packaging';

      await db.expenses.add({
        timestamp: Date.now(),
        dateString: new Date().toISOString().split('T')[0],
        category: expCategory,
        amount: totalCost,
        note: `รับเข้าสต็อก: ${targetItem.name} (+${restockQty} ${targetItem.unit})`
      });
    }

    playSuccessChime();
    setSuccessInfo({
      title: 'เติมสต็อกสำเร็จ!',
      subtitle: `${targetItem.name} +${restockQty} ${targetItem.unit}`
    });

    setRestockItemId(null);
    setRestockQty(1);
  };

  // Add new item action
  const handleAddNewItem = async () => {
    if (!newItemName.trim()) return;
    await db.inventoryItems.add({
      name: newItemName.trim(),
      category: 'other',
      unit: newItemUnit.trim() || 'ชิ้น',
      costPerUnit: newItemCost || 0,
      currentStock: 0,
      minStock: 1,
      lastUpdated: Date.now()
    });

    setNewItemName('');
    setSuccessInfo({
      title: 'เพิ่มวัตถุดิบใหม่สำเร็จ!',
      subtitle: newItemName
    });
  };

  // Calculate total monthly usages cost
  const totalMonthlyCost = existingAudits.reduce((sum, a) => sum + (a.totalUsageCost || 0), 0);

  return (
    <div className="h-[calc(100vh-130px)] p-3 sm:p-4 max-w-[1600px] mx-auto overflow-y-auto">
      {/* Top Banner: Subtabs & Month Selector */}
      <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg mb-4 flex flex-wrap items-center justify-between gap-4">
        {/* Sub-tab navigation */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSubTab('audit');
            }}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-bold text-lg sm:text-xl flex items-center gap-2 border-2 transition-all ${
              subTab === 'audit'
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <ClipboardCheck className="w-6 h-6" />
            <span>ตรวจนับ & สรุปใช้สิ้นเดือน</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSubTab('restock');
            }}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-bold text-lg sm:text-xl flex items-center gap-2 border-2 transition-all ${
              subTab === 'restock'
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <PlusCircle className="w-6 h-6" />
            <span>รับของเข้าสต็อก</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSubTab('items');
            }}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-bold text-lg sm:text-xl flex items-center gap-2 border-2 transition-all ${
              subTab === 'items'
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <Package className="w-6 h-6" />
            <span>รายการวัตถุดิบทั้งหมด</span>
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-stone-800 px-4 py-2 rounded-2xl border border-stone-700">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="text-base text-stone-300 font-medium">รอบเดือน:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-stone-950 text-amber-200 font-bold text-lg px-3 py-1.5 rounded-xl border border-stone-600 focus:outline-none"
          />
        </div>
      </div>

      {/* SUBTAB 1: Monthly Count & Usages Audit */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-amber-900 text-xl font-bold">
                สรุปยอดใช้วัตถุดิบ (Usages) ประจำเดือน {formatThaiMonth(selectedMonth)}
              </div>
              <div className="text-sm text-stone-600 mt-0.5">
                สูตรคำนวณ: ยอดยกมาต้นเดือน + ซื้อเพิ่ม - ของเหลือนับจริง = ยอดใช้ไปจริง
              </div>
            </div>

            {totalMonthlyCost > 0 && (
              <div className="text-right">
                <div className="text-sm font-bold text-stone-600">ต้นทุนวัตถุดิบที่ใช้ไปในเดือนนี้</div>
                <div className="text-3xl sm:text-4xl font-black text-amber-900">
                  {formatBaht(totalMonthlyCost)}
                </div>
              </div>
            )}
          </div>

          {/* Audit Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="border-b-2 border-stone-200 text-stone-600 text-lg">
                  <th className="py-3 px-3">วัตถุดิบ</th>
                  <th className="py-3 px-3 text-center">หน่วยนับ</th>
                  <th className="py-3 px-3 text-center">สต็อกระบบ</th>
                  <th className="py-3 px-4 text-center bg-amber-100/60 rounded-t-xl text-amber-950 font-black">
                    ตรวจนับจริงปลายเดือน
                  </th>
                  <th className="py-3 px-3 text-center text-emerald-800 font-bold">ยอดใช้จริง (Usages)</th>
                  <th className="py-3 px-3 text-right">ต้นทุนที่ใช้ไป</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-lg">
                {inventoryItems.map((item) => {
                  const currentEnding = endingCounts[item.id!] ?? item.currentStock;
                  const calculatedUsage = Math.max(0, item.currentStock - currentEnding);
                  const usageCost = calculatedUsage * item.costPerUnit;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      {/* Name & Cost Info */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-xl text-stone-900">{item.name}</div>
                        <div className="text-xs text-stone-500 font-medium">
                          ต้นทุน {formatBaht(item.costPerUnit)} / {item.unit}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-4 px-3 text-center font-medium text-stone-700">
                        {item.unit}
                      </td>

                      {/* System Stock */}
                      <td className="py-4 px-3 text-center font-mono font-bold text-xl text-stone-600">
                        {item.currentStock}
                      </td>

                      {/* Ending Count Input (Senior-friendly controls) */}
                      <td className="py-3 px-4 bg-amber-50/50">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCountChange(item.id!, currentEnding - 1)}
                            className="w-10 h-10 rounded-xl bg-stone-200 hover:bg-stone-300 active:bg-stone-400 font-black text-xl flex items-center justify-center text-stone-800"
                          >
                            <Minus className="w-5 h-5 stroke-[3]" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={currentEnding}
                            onChange={(e) => handleCountChange(item.id!, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center font-black text-2xl py-1.5 bg-white border-2 border-amber-400 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                          />

                          <button
                            type="button"
                            onClick={() => handleCountChange(item.id!, currentEnding + 1)}
                            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 font-black text-xl flex items-center justify-center text-white"
                          >
                            <Plus className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>
                      </td>

                      {/* Usage Result */}
                      <td className="py-4 px-3 text-center font-mono font-black text-2xl text-emerald-700">
                        {calculatedUsage} <span className="text-xs text-stone-500 font-normal">{item.unit}</span>
                      </td>

                      {/* Cost */}
                      <td className="py-4 px-3 text-right font-mono font-bold text-xl text-stone-900">
                        {formatBaht(usageCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Save Audit Button */}
            <div className="mt-6 pt-4 border-t-2 border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={handleSaveMonthlyAudit}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-black text-2xl flex items-center gap-3 shadow-lg transition-transform"
              >
                <Save className="w-7 h-7" />
                <span>บันทึกสรุปยอดประจำเดือน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Restock / Add Stock */}
      {subTab === 'restock' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm space-y-6">
          <div className="border-b-2 border-stone-100 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
              บันทึกการรับของเข้าสต็อก (ซื้อของมาเติม)
            </h2>
            <p className="text-stone-500 text-base mt-1">
              ระบุรายการวัตถุดิบและจำนวนที่ซื้อมา เพื่ออัปเดตสต็อกคงเหลือ
            </p>
          </div>

          {/* Select Item */}
          <div>
            <label className="block text-xl font-bold text-stone-800 mb-2">
              1. เลือกวัตถุดิบที่ต้องการเติม:
            </label>
            <select
              value={restockItemId || ''}
              onChange={(e) => setRestockItemId(Number(e.target.value))}
              className="w-full p-4 text-xl font-bold bg-stone-50 rounded-2xl border-2 border-stone-300 focus:outline-none focus:border-amber-600"
            >
              <option value="">-- แตะเพื่อเลือกวัตถุดิบ --</option>
              {inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (คงเหลือปัจจุบัน: {item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity Controls */}
          {restockItemId && (
            <div className="space-y-4">
              <label className="block text-xl font-bold text-stone-800">
                2. จำนวนที่ซื้อมาเพิ่ม:
              </label>
              <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border-2 border-stone-200">
                <button
                  type="button"
                  onClick={() => setRestockQty(Math.max(1, restockQty - 1))}
                  className="w-14 h-14 rounded-2xl bg-stone-200 hover:bg-stone-300 font-black text-3xl flex items-center justify-center text-stone-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 text-center font-black text-4xl py-2 bg-white border-2 border-stone-300 rounded-2xl font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRestockQty(restockQty + 1)}
                  className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black text-3xl flex items-center justify-center text-white"
                >
                  +
                </button>
              </div>

              {/* Sync to Expense Checkbox */}
              <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToExpenses}
                  onChange={(e) => setSyncToExpenses(e.target.checked)}
                  className="w-6 h-6 text-amber-600 rounded"
                />
                <div>
                  <div className="font-bold text-lg text-amber-950">
                    บันทึกลงใน "รายจ่ายของร้าน" อัตโนมัติด้วย
                  </div>
                  <div className="text-sm text-stone-600">
                    ยอดเงินจะถูกคำนวณตามราคาต้นทุนต่อหน่วย ไม่ต้องไปกรอกที่หน้ารายจ่ายซ้ำ
                  </div>
                </div>
              </label>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="w-full h-18 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-2xl rounded-2xl shadow-lg transition-transform"
              >
                ยืนยันการรับเข้าสต็อก
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Manage Ingredients */}
      {subTab === 'items' && (
        <div className="space-y-6">
          {/* Add New Item Box */}
          <div className="bg-white rounded-3xl p-5 border-2 border-stone-200 shadow-sm max-w-3xl mx-auto">
            <h3 className="text-xl font-black text-stone-900 mb-3">➕ เพิ่มวัตถุดิบใหม่</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-sm font-bold text-stone-600">ชื่อวัตถุดิบ</label>
                <input
                  type="text"
                  placeholder="เช่น ไซรัปวานิลลา"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full mt-1 p-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-lg font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-stone-600">หน่วยนับ</label>
                <input
                  type="text"
                  placeholder="เช่น ขวด, ถุง, กก."
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full mt-1 p-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-lg font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-stone-600">ต้นทุนต่อหน่วย (บาท)</label>
                <input
                  type="number"
                  placeholder="200"
                  value={newItemCost || ''}
                  onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 p-3 bg-stone-50 border-2 border-stone-300 rounded-xl text-lg font-medium font-mono"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddNewItem}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xl rounded-xl shadow-sm"
            >
              บันทึกวัตถุดิบใหม่
            </button>
          </div>

          {/* List of items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border-2 border-stone-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xl font-bold text-stone-900">{item.name}</h4>
                  <div className="text-sm text-stone-500 mt-0.5">
                    หน่วย: {item.unit} | ต้นทุน: {formatBaht(item.costPerUnit)}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-stone-600 text-sm font-semibold">สต็อกปัจจุบัน:</span>
                  <span className="text-2xl font-black text-amber-900 font-mono">
                    {item.currentStock} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successInfo && (
        <SuccessModal
          isOpen={!!successInfo}
          onClose={() => setSuccessInfo(null)}
          title={successInfo.title}
          subtitle={successInfo.subtitle}
        />
      )}
    </div>
  );
};
