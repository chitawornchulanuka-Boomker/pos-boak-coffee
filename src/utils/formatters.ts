// Formatting utilities for Thai Currency and Dates

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function formatBaht(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ฿';
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0
  }).format(amount) + ' ฿';
}

export function formatBahtNumberOnly(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0
  }).format(amount);
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const thaiYear = year + 543;
  return `${day} ${THAI_MONTHS_SHORT[month]} ${thaiYear}`;
}

export function formatThaiMonth(monthStr: string): string {
  if (!monthStr) return '';
  const [yearStr, monthStrPart] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrPart, 10) - 1;
  const thaiYear = year + 543;
  return `${THAI_MONTHS_FULL[month]} ${thaiYear}`;
}

export function formatThaiTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
