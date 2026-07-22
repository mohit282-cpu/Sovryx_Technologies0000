'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Database,
  CheckCircle2,
  Sparkles,
  Save,
  Building2,
  User,
  Clock,
  DollarSign,
  Moon,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { CompanySettings } from '@/types';
import { updateSettings, seedInitialData, clearDatabaseToZero } from '@/lib/services/firestore';

interface SettingsViewProps {
  settings: CompanySettings;
  onRefresh: () => void;
}

export default function SettingsView({ settings, onRefresh }: SettingsViewProps) {
  const [formSettings, setFormSettings] = useState<CompanySettings>(settings);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formSettings);
      alert('Company OS Settings Saved!');
      onRefresh();
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedData = async () => {
    if (confirm('Re-seed company data in Firestore? This will populate sample employees, projects, and tasks.')) {
      setSeeding(true);
      try {
        await seedInitialData();
        alert('Data successfully seeded into Firestore!');
        onRefresh();
      } catch (err: any) {
        alert('Seeding error: ' + err.message);
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleClearDataToZero = async () => {
    if (confirm('CRITICAL ACTION: Are you sure you want to clear ALL database collections to ZERO for production setup? This action cannot be undone.')) {
      setClearing(true);
      try {
        await clearDatabaseToZero();
        alert('Database has been completely cleared to ZERO for production!');
        onRefresh();
      } catch (err: any) {
        alert('Clear database error: ' + err.message);
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Company OS System Preferences
        </h2>
        <p className="text-xs text-slate-400">Sole Authority Configuration & Firestore Database Operations</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* CEO & Company Identity */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> CEO & Company Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={formSettings.companyName}
                onChange={e => setFormSettings({ ...formSettings, companyName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">CEO Sovereign Name</label>
              <input
                type="text"
                value={formSettings.ceoName}
                onChange={e => setFormSettings({ ...formSettings, ceoName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">CEO Direct Email</label>
              <input
                type="email"
                value={formSettings.ceoEmail}
                onChange={e => setFormSettings({ ...formSettings, ceoEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Currency Code</label>
              <input
                type="text"
                value={formSettings.currency}
                onChange={e => setFormSettings({ ...formSettings, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* AI System Preferences */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> AI Executive Intelligence Options
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-white block">Auto Risk Detection Engine</span>
                <span className="text-[11px] text-slate-400">Continuously scan tasks and milestones via Gemini 2.5 server proxy.</span>
              </div>
              <input
                type="checkbox"
                checked={formSettings.aiAutoRiskDetection}
                onChange={e => setFormSettings({ ...formSettings, aiAutoRiskDetection: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <div>
                <span className="font-bold text-white block">Daily Operating Report Synthesis</span>
                <span className="text-[11px] text-slate-400">Auto-generate executive briefings at shift completion.</span>
              </div>
              <input
                type="checkbox"
                checked={formSettings.aiDailyReportEnabled}
                onChange={e => setFormSettings({ ...formSettings, aiDailyReportEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>
          </div>
          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Calendar & Bikram Sambat (BS) Preferences
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-300 block mb-1">Primary Calendar System</label>
                <select
                  value={formSettings.defaultCalendar || 'BS'}
                  onChange={e => setFormSettings({ ...formSettings, defaultCalendar: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="BS">Bikram Sambat (BS - Nepal Default)</option>
                  <option value="AD">Gregorian (AD - International)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Show Dual Dates (BS + AD)</label>
                <select
                  value={formSettings.showDualDates !== false ? 'true' : 'false'}
                  onChange={e => setFormSettings({ ...formSettings, showDualDates: e.target.value === 'true' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="true">Enabled (Show both Bikram Sambat & Gregorian)</option>
                  <option value="false">Disabled (Show primary calendar only)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Week Starts On</label>
                <select
                  value={formSettings.weekStartsOn || 'Sunday'}
                  onChange={e => setFormSettings({ ...formSettings, weekStartsOn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Sunday">Sunday (Nepal Standard Weekend Saturday)</option>
                  <option value="Monday">Monday (Western Standard)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Fiscal Year Format</label>
                <input
                  type="text"
                  placeholder="e.g. 2083/84 (BS)"
                  value={formSettings.fiscalYearFormat || '2083/84 (BS)'}
                  onChange={e => setFormSettings({ ...formSettings, fiscalYearFormat: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Preferences...' : 'Save Company OS Preferences'}
          </button>
        </div>
      </form>

      {/* Database Maintenance */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 pt-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" /> Database Maintenance & Production Operations
        </h3>
        <p className="text-slate-400 text-xs">
          Manage Cloud Firestore database collections. Clear all records to ZERO for production rollout or populate sample operational data.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            id="btn-clear-db-zero"
            onClick={handleClearDataToZero}
            disabled={clearing}
            className="flex items-center gap-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2.5 rounded-xl transition-all border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            {clearing ? 'Clearing Database to Zero...' : 'Clear Database to ZERO (Production Slate)'}
          </button>
        </div>
      </div>
    </div>
  );
}
