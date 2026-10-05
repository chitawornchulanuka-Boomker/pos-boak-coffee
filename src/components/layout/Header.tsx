import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Receipt, 
  Package, 
  BarChart3, 
  Settings, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { playTapSound } from '../../utils/sound';
import { formatThaiDate, getTodayDateString } from '../../utils/formatters';

export type ActiveTab = 'pos' | 'expenses' | 'inventory' | 'dashboard' | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  shopName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  shopName = 'BOAK COFFEE'
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const navItems = [
    { id: 'pos' as ActiveTab, label: 'ขายหน้าร้าน', icon: Coffee, desc: 'POS สั่งกาแฟ' },
    { id: 'expenses' as ActiveTab, label: 'บันทึกรายจ่าย', icon: Receipt, desc: 'ต้นทุน/ซื้อของ' },
    { id: 'inventory' as ActiveTab, label: 'สต็อก & สรุปใช้', icon: Package, desc: 'ตรวจนับรายเดือน' },
    { id: 'dashboard' as ActiveTab, label: 'สรุปยอด & กำไร', icon: BarChart3, desc: 'บัญชีรายรับ-จ่าย' },
    { id: 'settings' as ActiveTab, label: 'ตั้งค่าร้าน', icon: Settings, desc: 'เมนู/สำรองข้อมูล' },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    playTapSound();
    onTabChange(tab);
  };

  return (
    <header className="bg-stone-900 text-white shadow-lg sticky top-0 z-40">
      {/* Top Bar: Brand, Date & Connection */}
      <div className="px-4 py-2.5 bg-stone-950 flex flex-wrap items-center justify-between border-b border-stone-800 text-base">
        {/* Shop Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-amber-100 flex items-center gap-2">
              {shopName}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-200 border border-amber-700/50">
                ระบบจัดการร้าน
              </span>
            </h1>
          </div>
        </div>

        {/* Date, Time & Online Badge */}
        <div className="flex items-center gap-4 text-stone-300">
          <div className="text-lg font-medium hidden sm:block">
            📅 {formatThaiDate(getTodayDateString())} | <span className="font-mono font-bold text-amber-400">{currentTime}</span>
          </div>

          {/* Offline/Online badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
            isOnline 
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' 
              : 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>ออนไลน์</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>ออฟไลน์ (บันทึกในเครื่อง)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar for Tablet */}
      <nav className="flex items-stretch overflow-x-auto bg-stone-900 p-1.5 gap-1.5 sm:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex-1 min-w-[130px] sm:min-w-[150px] min-h-[58px] sm:min-h-[64px] px-3 py-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 transition-all ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md ring-2 ring-amber-300 scale-[1.01]'
                  : 'bg-stone-800/80 hover:bg-stone-800 text-stone-200 hover:text-white font-medium'
              }`}
            >
              <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-stone-950 stroke-[2.5]' : 'text-amber-400'}`} />
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-bold leading-tight">
                  {item.label}
                </div>
                <div className={`text-xs hidden md:block ${isActive ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
