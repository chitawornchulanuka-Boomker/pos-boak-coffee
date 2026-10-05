import Dexie, { type Table } from 'dexie';
import type { 
  MenuItem, 
  Order, 
  Expense, 
  InventoryItem, 
  MonthlyAudit, 
  ShopSettings 
} from '../types';

export class BoakCoffeeDB extends Dexie {
  menuItems!: Table<MenuItem, number>;
  orders!: Table<Order, number>;
  expenses!: Table<Expense, number>;
  inventoryItems!: Table<InventoryItem, number>;
  inventoryAudits!: Table<MonthlyAudit, number>;
  settings!: Table<ShopSettings, number>;

  constructor() {
    super('BoakCoffeeDB');
    this.version(1).stores({
      menuItems: '++id, name, category, price, available, popular',
      orders: '++id, orderNumber, timestamp, dateString, paymentMethod',
      expenses: '++id, timestamp, dateString, category, amount',
      inventoryItems: '++id, name, category, unit, currentStock',
      inventoryAudits: '++id, monthString, itemId, auditDate',
      settings: '++id, shopName'
    });
  }
}

export const db = new BoakCoffeeDB();

// Initialize default seed data if DB is empty
export async function initializeDatabase() {
  const menuCount = await db.menuItems.count();
  if (menuCount === 0) {
    await db.menuItems.bulkAdd([
      // กาแฟสด
      { name: 'เอสเพรสโซ่ (Espresso)', category: 'coffee', price: 45, available: true, popular: true },
      { name: 'อเมริกาโน่ เย็น (Iced Americano)', category: 'coffee', price: 50, available: true, popular: true },
      { name: 'อเมริกาโน่ ร้อน (Hot Americano)', category: 'coffee', price: 45, available: true },
      { name: 'ลาเต้ เย็น (Iced Latte)', category: 'coffee', price: 55, available: true, popular: true },
      { name: 'ลาเต้ ร้อน (Hot Latte)', category: 'coffee', price: 50, available: true },
      { name: 'คาปูชิโน่ เย็น (Iced Cappuccino)', category: 'coffee', price: 55, available: true, popular: true },
      { name: 'มอคค่า เย็น (Iced Mocha)', category: 'coffee', price: 60, available: true },
      { name: 'คาราเมลมัคคิอาโต้ (Caramel Macchiato)', category: 'coffee', price: 65, available: true },
      
      // ชา & เครื่องดื่ม
      { name: 'ชาเขียวมัทฉะลาเต้ (Matcha Latte)', category: 'tea', price: 55, available: true, popular: true },
      { name: 'ชาไทยเย็น (Iced Thai Tea)', category: 'tea', price: 45, available: true, popular: true },
      { name: 'ชามะนาวสด (Iced Lemon Tea)', category: 'tea', price: 45, available: true },
      { name: 'โกโก้เย็นเข้มข้น (Rich Cocoa)', category: 'other', price: 50, available: true, popular: true },
      { name: 'นมสดคาราเมล (Caramel Fresh Milk)', category: 'other', price: 45, available: true },
      { name: 'น้ำผึ้งมะนาวโซดา (Honey Lemon Soda)', category: 'other', price: 50, available: true },

      // ขนม & เบเกอรี่
      { name: 'ครัวซองต์เนยสด (Butter Croissant)', category: 'bakery', price: 45, available: true, popular: true },
      { name: 'บราวนี่ดาร์กช็อกโกแลต (Fudge Brownie)', category: 'bakery', price: 40, available: true },
      { name: 'วาฟเฟิลเนยสดอบร้อน (Fresh Waffle)', category: 'bakery', price: 35, available: true }
    ]);
  }

  const inventoryCount = await db.inventoryItems.count();
  if (inventoryCount === 0) {
    const now = Date.now();
    await db.inventoryItems.bulkAdd([
      { name: 'เมล็ดกาแฟ House Blend (คั่วกลาง-เข้ม)', category: 'beans', unit: 'กิโลกรัม (kg)', costPerUnit: 450, currentStock: 5, minStock: 2, lastUpdated: now },
      { name: 'นมสดพาสเจอร์ไรส์ Meiji 2L', category: 'dairy', unit: 'แกลลอน (2L)', costPerUnit: 95, currentStock: 8, minStock: 3, lastUpdated: now },
      { name: 'นมข้นหวาน นกเหยี่ยว', category: 'dairy', unit: 'กระป๋อง', costPerUnit: 28, currentStock: 12, minStock: 4, lastUpdated: now },
      { name: 'นมข้นจืด คาร์เนชัน', category: 'dairy', unit: 'กระป๋อง', costPerUnit: 26, currentStock: 10, minStock: 4, lastUpdated: now },
      { name: 'ผงมัทฉะแท้เกรดพรีเมียม', category: 'beverage_base', unit: 'ถุง (500g)', costPerUnit: 380, currentStock: 2, minStock: 1, lastUpdated: now },
      { name: 'ผงโกโก้เข้มข้น 100%', category: 'beverage_base', unit: 'ถุง (500g)', costPerUnit: 160, currentStock: 3, minStock: 1, lastUpdated: now },
      { name: 'ผงชาไทยตรามือ', category: 'beverage_base', unit: 'ถุง (400g)', costPerUnit: 85, currentStock: 4, minStock: 1, lastUpdated: now },
      { name: 'ไซรัปคาราเมลกลิ่นหอมหวาน', category: 'beverage_base', unit: 'ขวด (750ml)', costPerUnit: 220, currentStock: 3, minStock: 1, lastUpdated: now },
      { name: 'แก้วเย็น 16 oz (PET ใส)', category: 'packaging', unit: 'แถว (50 ใบ)', costPerUnit: 75, currentStock: 10, minStock: 3, lastUpdated: now },
      { name: 'ฝายกดื่ม 98 mm', category: 'packaging', unit: 'แถว (50 ชิ้น)', costPerUnit: 45, currentStock: 10, minStock: 3, lastUpdated: now },
      { name: 'หลอดดูดกาแฟรักษ์โลก', category: 'packaging', unit: 'ห่อ (100 เส้น)', costPerUnit: 30, currentStock: 6, minStock: 2, lastUpdated: now },
      { name: 'ถุงหิ้วแก้วกาแฟ 1 แก้ว', category: 'packaging', unit: 'ห่อ (100 ใบ)', costPerUnit: 25, currentStock: 8, minStock: 2, lastUpdated: now }
    ]);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      shopName: 'BOAK COFFEE',
      promptPayId: '0812345678', // ตัวอย่างเบอร์พร้อมเพย์ สามารถเปลี่ยนได้ในหน้าตั้งค่า
      promptPayName: 'ร้านกาแฟ BOAK COFFEE'
    });
  }
}
