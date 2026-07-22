'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  Search,
  Database,
  ShieldCheck,
  Building2,
  Menu,
  X,
  UserCheck,
  Trash2
} from 'lucide-react';
import { NotificationItem, CompanySettings } from '@/types';
import { seedInitialData, clearDatabaseToZero } from '@/lib/services/firestore';

interface HeaderProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  notifications: NotificationItem[];
  settings: CompanySettings;
  onOpenAIAssistant: () => void;
  onOpenWizard?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Header({
  currentModule,
  onSelectModule,
  notifications,
  settings,
  onOpenAIAssistant,
  onOpenWizard,
  isMobileOpen,
  setIsMobileOpen
}: HeaderProps) {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedData = async () => {
    if (confirm('Re-seed initial demo company data to Firestore? This will populate employees, projects, tasks, and metrics.')) {
      setSeeding(true);
      try {
        await seedInitialData();
        alert('Company OS Data successfully populated in Firestore!');
      } catch (err: any) {
        alert('Seeding error: ' + err.message);
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleClearData = async () => {
    if (confirm('Clear ALL Firestore collections to ZERO for production setup?')) {
      setClearing(true);
      try {
        await clearDatabaseToZero();
        alert('Database cleared to ZERO successfully!');
      } catch (err: any) {
        alert('Clear database error: ' + err.message);
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <header id="header-main" className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          id="btn-mobile-menu"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/20">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              {settings.companyName || 'Sovryx OS'}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                CEO CONTROL
              </span>
            </h1>
            <p className="text-xs text-slate-400 capitalize hidden sm:block">
              Module: <span className="text-slate-200 font-medium">{currentModule.replace('-', ' ')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live Search / Time Badge */}
      <div className="hidden md:flex items-center gap-3">
        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentTime || 'ONLINE'}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Clear DB Button */}
        <button
          id="btn-clear-db-header"
          onClick={handleClearData}
          disabled={clearing || seeding}
          title="Clear all database collections to ZERO for production slate"
          className="hidden lg:flex items-center gap-1.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className={`w-3.5 h-3.5 ${clearing ? 'animate-spin text-rose-400' : 'text-rose-400'}`} />
          {clearing ? 'Clearing...' : 'Clear DB'}
        </button>

        {/* Seed Data Button */}
        <button
          id="btn-seed-data"
          onClick={handleSeedData}
          disabled={seeding || clearing}
          title="Populate demo data into Firestore"
          className="hidden xl:flex items-center gap-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
          {seeding ? 'Seeding...' : 'Seed Data'}
        </button>

        {/* AI Co-Pilot Launcher */}
        <button
          id="btn-ai-copilot"
          onClick={onOpenAIAssistant}
          className="flex items-center gap-2 text-xs font-medium bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-600/20 transition-all border border-indigo-500/30"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
          <span className="hidden sm:inline">AI Co-Pilot</span>
        </button>

        {/* Notifications Button */}
        <button
          id="btn-notifications"
          onClick={() => onSelectModule('notifications')}
          className="relative p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-950">
              {unreadCount}
            </span>
          )}
        </button>

        {/* CEO Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
            CEO
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-slate-200 leading-none">{settings.ceoName}</p>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Sole Authority</p>
          </div>
        </div>
      </div>
    </header>
  );
}
