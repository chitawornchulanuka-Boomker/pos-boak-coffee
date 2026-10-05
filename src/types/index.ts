export type Category = 'coffee' | 'tea' | 'other' | 'bakery';

export interface MenuItem {
  id?: number;
  name: string;
  category: Category;
  price: number;
  available: boolean;
  image?: string;
  popular?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note?: string;
}

export type PaymentMethod = 'cash' | 'promptpay';

export interface Order {
  id?: number;
  orderNumber: string;
  timestamp: number; // Unix timestamp
  dateString: string; // YYYY-MM-DD
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  receivedAmount: number;
  changeAmount: number;
}

export type ExpenseCategory = 
  | 'coffee_beans'    // เมล็ดกาแฟ
  | 'milk_syrup'       // นม / ไซรัป / ผงชา-โกโก้
  | 'packaging'        // แก้ว / ฝา / หลอด / ถุง
  | 'ice_fresh'        // น้ำแข็ง / ของสด
  | 'utilities'        // ค่าน้ำ / ค่าไฟ / ค่าแก๊ส
  | 'miscellaneous';   // ของใช้จิปาถะ / อื่นๆ

export interface Expense {
  id?: number;
  timestamp: number;
  dateString: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  note?: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  category: 'beans' | 'dairy' | 'packaging' | 'beverage_base' | 'other';
  unit: string; // เช่น กก., ลิตร, แถว(50ใบ), กล่อง
  costPerUnit: number; // ต้นทุนต่อหน่วยล่าสุด
  currentStock: number; // สต็อกคงเหลือปัจจุบัน
  minStock: number; // จุดสั่งซื้อซ้ำ
  lastUpdated: number;
}

export interface MonthlyAudit {
  id?: number;
  monthString: string; // เช่น '2026-10'
  auditDate: string; // วันที่ตรวจนับ YYYY-MM-DD
  itemId: number;
  itemName: string;
  unit: string;
  beginningStock: number; // ยอดยกมาต้นเดือน
  addedStock: number;     // ซื้อเพิ่มระหว่างเดือน
  endingStock: number;    // ตรวจนับจริงปลายเดือน
  usage: number;          // ยอดใช้จริง = beginning + added - ending
  costPerUnit: number;    // ต้นทุนต่อหน่วย
  totalUsageCost: number; // usage * costPerUnit
}

export interface ShopSettings {
  id?: number;
  shopName: string;
  promptPayId: string; // Phone or Citizen ID
  promptPayName: string;
}
