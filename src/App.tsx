import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabase } from './db/db';
import { Header, type ActiveTab } from './components/layout/Header';
import { PosView } from './components/pos/PosView';
import { ExpenseView } from './components/expenses/ExpenseView';
import { InventoryView } from './components/inventory/InventoryView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  const settings = useLiveQuery(() => db.settings.toCollection().first());

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true);
    });
  }, []);

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-3xl font-black text-amber-200">BOAK COFFEE</h2>
        <p className="text-stone-400 text-lg mt-2">กำลังเตรียมระบบบัญชีและยอดขาย...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Tablet Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        shopName={settings?.shopName || 'BOAK COFFEE'}
      />

      {/* Main Screen Content */}
      <main className="flex-1 p-2 sm:p-3 overflow-hidden">
        {activeTab === 'pos' && <PosView />}
        {activeTab === 'expenses' && <ExpenseView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
