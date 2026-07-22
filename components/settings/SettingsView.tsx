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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 block mb-1">Company Legal Name *</label>
              <input
                type="text"
                value={formSettings.companyName}
                onChange={e => setFormSettings({ ...formSettings, companyName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">CEO / Executive Director Name *</label>
              <input
                type="text"
                value={formSettings.ceoName}
                onChange={e => setFormSettings({ ...formSettings, ceoName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">CEO Direct Email *</label>
              <input
                type="email"
                value={formSettings.ceoEmail}
                onChange={e => setFormSettings({ ...formSettings, ceoEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              Nepal Government & Compliance Registrations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-300 block mb-1">Company Registration No.</label>
                <input
                  type="text"
                  placeholder="e.g. 284910/080/081"
                  value={formSettings.companyRegistrationNo || ''}
                  onChange={e => setFormSettings({ ...formSettings, companyRegistrationNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">PAN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 609812345"
                  value={formSettings.panNo || ''}
                  onChange={e => setFormSettings({ ...formSettings, panNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">VAT Number</label>
                <input
                  type="text"
                  placeholder="e.g. 609812345"
                  value={formSettings.vatNo || ''}
                  onChange={e => setFormSettings({ ...formSettings, vatNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">OCR Registration</label>
                <input
                  type="text"
                  placeholder="Office of Company Registrar No."
                  value={formSettings.ocrRegistrationNo || ''}
                  onChange={e => setFormSettings({ ...formSettings, ocrRegistrationNo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">IRD Registration</label>
                <input
                  type="text"
                  placeholder="Inland Revenue Office"
                  value={formSettings.irdRegistration || ''}
                  onChange={e => setFormSettings({ ...formSettings, irdRegistration: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Business Category</label>
                <input
                  type="text"
                  placeholder="e.g. IT & Software Services"
                  value={formSettings.businessCategory || ''}
                  onChange={e => setFormSettings({ ...formSettings, businessCategory: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              Registered Office Address (Nepal Jurisdiction)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-300 block mb-1">Province</label>
                <select
                  value={formSettings.address?.province || 'Bagmati Province'}
                  onChange={e => setFormSettings({
                    ...formSettings,
                    address: { ...(formSettings.address || {}), province: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="Koshi Province">Koshi Province</option>
                  <option value="Madhesh Province">Madhesh Province</option>
                  <option value="Bagmati Province">Bagmati Province</option>
                  <option value="Gandaki Province">Gandaki Province</option>
                  <option value="Lumbini Province">Lumbini Province</option>
                  <option value="Karnali Province">Karnali Province</option>
                  <option value="Sudurpashchim Province">Sudurpashchim Province</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">District</label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu"
                  value={formSettings.address?.district || ''}
                  onChange={e => setFormSettings({
                    ...formSettings,
                    address: { ...(formSettings.address || {}), district: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Municipality / Metro</label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu Metropolitan"
                  value={formSettings.address?.municipality || ''}
                  onChange={e => setFormSettings({
                    ...formSettings,
                    address: { ...(formSettings.address || {}), municipality: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Ward Number & Tole</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ward"
                    value={formSettings.address?.wardNo || ''}
                    onChange={e => setFormSettings({
                      ...formSettings,
                      address: { ...(formSettings.address || {}), wardNo: e.target.value }
                    })}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-center font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Tole name"
                    value={formSettings.address?.tole || ''}
                    onChange={e => setFormSettings({
                      ...formSettings,
                      address: { ...(formSettings.address || {}), tole: e.target.value }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
              Regional & Formatting Defaults
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-300 block mb-1">Default Country</label>
                <input
                  type="text"
                  value={formSettings.country || 'Nepal'}
                  onChange={e => setFormSettings({ ...formSettings, country: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Currency Code & Symbol</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formSettings.currency || 'NPR'}
                    onChange={e => setFormSettings({ ...formSettings, currency: e.target.value })}
                    className="w-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-center font-mono"
                  />
                  <input
                    type="text"
                    value={formSettings.currencySymbol || 'Rs.'}
                    onChange={e => setFormSettings({ ...formSettings, currencySymbol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Timezone</label>
                <input
                  type="text"
                  value={formSettings.timezone || 'Asia/Kathmandu'}
                  onChange={e => setFormSettings({ ...formSettings, timezone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Date Format</label>
                <select
                  value={formSettings.dateFormat || 'DD/MM/YYYY'}
                  onChange={e => setFormSettings({ ...formSettings, dateFormat: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Nepal Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
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
