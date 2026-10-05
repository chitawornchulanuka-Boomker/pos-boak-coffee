import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Store, 
  Coffee, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Smartphone, 
  Check, 
  Plus, 
  RefreshCw,
  QrCode
} from 'lucide-react';
import { db, initializeDatabase } from '../../db/db';
import { SuccessModal } from '../common/SuccessModal';
import { formatBaht } from '../../utils/formatters';
import { playTapSound, playSuccessChime, playDeleteSound } from '../../utils/sound';
import type { Category, MenuItem } from '../../types';

export const SettingsView: React.FC = () => {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

  // Form states
  const [shopName, setShopName] = useState<string>('');
  const [promptPayId, setPromptPayId] = useState<string>('');
  const [promptPayName, setPromptPayName] = useState<string>('');

  // New menu item states
  const [newMenuName, setNewMenuName] = useState<string>('');
  const [newMenuCategory, setNewMenuCategory] = useState<Category>('coffee');
  const [newMenuPrice, setNewMenuPrice] = useState<number>(50);

  const [successInfo, setSuccessInfo] = useState<{ title: string; subtitle?: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setShopName(settings.shopName || 'BOAK COFFEE');
      setPromptPayId(settings.promptPayId || '');
      setPromptPayName(settings.promptPayName || '');
    }
  }, [settings]);

  // Save Shop Info
  const handleSaveShopInfo = async () => {
    playSuccessChime();
    if (settings?.id) {
      await db.settings.update(settings.id, {
        shopName,
        promptPayId,
        promptPayName
      });
    } else {
      await db.settings.add({
        shopName,
        promptPayId,
        promptPayName
      });
    }

    setSuccessInfo({
      title: 'บันทึกข้อมูลร้านสำเร็จ!',
      subtitle: `พร้อมเพย์: ${promptPayId}`
    });
  };

  // Add Menu Item
  const handleAddMenuItem = async () => {
    if (!newMenuName.trim()) return;
    playSuccessChime();

    await db.menuItems.add({
      name: newMenuName.trim(),
      category: newMenuCategory,
      price: newMenuPrice,
      available: true
    });

    setNewMenuName('');
    setNewMenuPrice(50);
    setSuccessInfo({
      title: 'เพิ่มเมนูใหม่สำเร็จ!',
      subtitle: newMenuName
    });
  };

  // Toggle item availability
  const handleToggleAvailable = async (item: MenuItem) => {
    playTapSound();
    await db.menuItems.update(item.id!, {
      available: !item.available
    });
  };

  // Update item price
  const handleUpdatePrice = async (item: MenuItem, newPrice: number) => {
    playTapSound();
    await db.menuItems.update(item.id!, {
      price: Math.max(0, newPrice)
    });
  };

  // Delete item
  const handleDeleteMenuItem = async (id: number) => {
    if (window.confirm('คุณต้องการลบเมนูนี้ออกจากร้านใช่หรือไม่?')) {
      playDeleteSound();
      await db.menuItems.delete(id);
    }
  };

  // Backup Database to JSON file
  const handleExportBackup = async () => {
    playTapSound();
    const backupData = {
      menuItems: await db.menuItems.toArray(),
      orders: await db.orders.toArray(),
      expenses: await db.expenses.toArray(),
      inventoryItems: await db.inventoryItems.toArray(),
      inventoryAudits: await db.inventoryAudits.toArray(),
      settings: await db.settings.toArray(),
      backupDate: new Date().toISOString()
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `boak-coffee-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessInfo({
      title: 'สำรองข้อมูลสำเร็จ!',
      subtitle: 'ไฟล์ถูกดาวน์โหลดเก็บไว้ในเครื่องของคุณแล้ว'
    });
  };

  // Restore Database from JSON file
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], 'UTF-8');
      fileReader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (parsed.menuItems && parsed.orders) {
            await db.transaction('rw', [
              db.menuItems, 
              db.orders, 
              db.expenses, 
              db.inventoryItems, 
              db.inventoryAudits, 
              db.settings
            ], async () => {
              await db.menuItems.clear();
              await db.orders.clear();
              await db.expenses.clear();
              await db.inventoryItems.clear();
              await db.inventoryAudits.clear();
              await db.settings.clear();

              await db.menuItems.bulkAdd(parsed.menuItems);
              await db.orders.bulkAdd(parsed.orders);
              await db.expenses.bulkAdd(parsed.expenses || []);
              await db.inventoryItems.bulkAdd(parsed.inventoryItems || []);
              await db.inventoryAudits.bulkAdd(parsed.inventoryAudits || []);
              await db.settings.bulkAdd(parsed.settings || []);
            });

            playSuccessChime();
            setSuccessInfo({
              title: 'กู้คืนข้อมูลสำเร็จ!',
              subtitle: 'ข้อมูลทั้งหมดถูกนำเข้าเรียบร้อย'
            });
          }
        } catch (err) {
          alert('รูปแบบไฟล์ไม่ถูกต้อง ไม่สามารถกู้คืนได้');
        }
      };
    }
  };

  // Reset to sample default data
  const handleResetDemoData = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลและโหลดเมนูตัวอย่างกลับมาใช่หรือไม่?')) {
      playTapSound();
      await db.menuItems.clear();
      await db.inventoryItems.clear();
      await initializeDatabase();
      setSuccessInfo({
        title: 'โหลดข้อมูลตัวอย่างเรียบร้อย!'
      });
    }
  };

  return (
    <div className="h-[calc(100vh-130px)] p-3 sm:p-4 max-w-[1600px] mx-auto overflow-y-auto space-y-6">
      {/* 1. Shop Info & PromptPay */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200 shadow-sm space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-3">
          <Store className="w-8 h-8 text-amber-700" />
          <span>ข้อมูลร้าน & พร้อมเพย์สำหรับรับเงิน</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-bold text-stone-700 mb-1">
              ชื่อร้านกาแฟ:
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl text-xl font-bold focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>เบอร์พร้อมเพย์ (เบอร์โทร 10 หลัก หรือ ปชช. 13 หลัก):</span>
            </label>
            <input
              type="text"
              value={promptPayId}
              placeholder="เช่น 0812345678"
              onChange={(e) => setPromptPayId(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl text-xl font-bold font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-stone-700 mb-1">
              ชื่อบัญชีผู้รับเงิน (แสดงใต้ QR):
            </label>
            <input
              type="text"
              value={promptPayName}
              placeholder="เช่น ร้านกาแฟ โบ๊ค คอฟฟี่"
              onChange={(e) => setPromptPayName(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border-2 border-stone-300 rounded-2xl text-xl font-bold focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveShopInfo}
          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xl rounded-2xl flex items-center gap-2 shadow-md"
        >
          <Save className="w-6 h-6" />
          <span>บันทึกข้อมูลร้าน</span>
        </button>
      </div>

      {/* 2. Menu Management */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200 shadow-sm space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-3">
          <Coffee className="w-8 h-8 text-amber-700" />
          <span>จัดการรายการเมนู & ราคา</span>
        </h2>

        {/* Add New Menu Item Box */}
        <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-amber-200">
          <h3 className="text-xl font-bold text-amber-950 mb-3 flex items-center gap-2">
            <Plus className="w-6 h-6" />
            <span>เพิ่มเมนูใหม่เข้าร้าน</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-stone-600 mb-1">ชื่อเมนู</label>
              <input
                type="text"
                placeholder="เช่น อเมริกาโน่น้ำส้มสด"
                value={newMenuName}
                onChange={(e) => setNewMenuName(e.target.value)}
                className="w-full p-3 bg-white border-2 border-stone-300 rounded-xl text-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">หมวดหมู่</label>
              <select
                value={newMenuCategory}
                onChange={(e) => setNewMenuCategory(e.target.value as Category)}
                className="w-full p-3 bg-white border-2 border-stone-300 rounded-xl text-lg font-bold"
              >
                <option value="coffee">☕ กาแฟสด</option>
                <option value="tea">🍵 ชา / เครื่องดื่ม</option>
                <option value="other">🥤 โกโก้ / น้ำอื่นๆ</option>
                <option value="bakery">🥐 ขนม / เบเกอรี่</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-600 mb-1">ราคาขาย (บาท)</label>
              <input
                type="number"
                min="0"
                value={newMenuPrice}
                onChange={(e) => setNewMenuPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 bg-white border-2 border-stone-300 rounded-xl text-lg font-bold font-mono"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleAddMenuItem}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold text-lg rounded-xl shadow-sm flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>บันทึกเมนูใหม่</span>
            </button>
          </div>
        </div>

        {/* Existing Menu Items List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-stone-800">
              รายการเมนูปัจจุบัน ({menuItems.length} เมนู)
            </h3>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="text-stone-500 hover:text-amber-800 text-sm font-bold flex items-center gap-1.5 p-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>โหลดค่าเริ่มต้นของเมนู</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-colors ${
                  item.available !== false
                    ? 'bg-stone-50 border-stone-200'
                    : 'bg-stone-200/60 border-stone-300 opacity-60'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold text-lg text-stone-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-stone-500">
                    หมวด: {item.category}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Price input */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleUpdatePrice(item, parseInt(e.target.value, 10) || 0)}
                      className="w-16 p-1 text-center font-bold font-mono text-xl bg-white border border-stone-300 rounded-lg"
                    />
                    <span className="text-stone-600 font-bold text-sm">฿</span>
                  </div>

                  {/* Toggle availability */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvailable(item)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                      item.available !== false
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {item.available !== false ? 'เปิดขาย' : 'ของหมด'}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteMenuItem(item.id!)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Backup & Restore Data */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200 shadow-sm space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 flex items-center gap-3">
          <Download className="w-8 h-8 text-blue-600" />
          <span>สำรองและกู้คืนข้อมูล (ข้อมูลไม่สูญหาย)</span>
        </h2>
        <p className="text-stone-600 text-base">
          ข้อมูลยอดขายและรายจ่ายทั้งหมดถูกบันทึกไว้ในเครื่องแท็บเล็ตของคุณอย่างปลอดภัย คุณสามารถดาวน์โหลดไฟล์สำรองข้อมูลเก็บไว้ใน Google Drive หรือส่งเข้าไลน์ได้ตลอดเวลา
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          {/* Download Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xl rounded-2xl flex items-center gap-3 shadow-md"
          >
            <Download className="w-6 h-6" />
            <span>💾 ดาวน์โหลดไฟล์สำรองข้อมูล (Backup)</span>
          </button>

          {/* Upload Restore */}
          <label className="px-6 py-4 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 font-bold text-xl rounded-2xl flex items-center gap-3 border-2 border-stone-300 cursor-pointer shadow-sm">
            <Upload className="w-6 h-6 text-stone-600" />
            <span>📂 กู้คืนข้อมูลจากไฟล์ (Restore)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 4. Senior Tablet PWA Guide */}
      <div className="bg-amber-100/70 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 space-y-2">
        <h3 className="text-xl font-bold text-amber-950 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-amber-800" />
          <span>วิธีติดตั้งระบบลงบนหน้าจอแท็บเล็ต (เปิดเป็นแอปเต็มจอ ไม่มีแถบเว็บ):</span>
        </h3>
        <ul className="list-disc list-inside text-stone-700 space-y-1 text-base sm:text-lg">
          <li><strong>สำหรับ iPad (Safari):</strong> แตะที่ปุ่มแชร์ (สัญลักษณ์สี่เหลี่ยมมีลูกศรชี้ขึ้น) แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></li>
          <li><strong>สำหรับ แท็บเล็ต Android (Chrome):</strong> แตะที่จุด 3 จุดมุมขวาบน แล้วเลือก <strong>"ติดตั้งแอป" (Install App)</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก"</strong></li>
        </ul>
      </div>

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
