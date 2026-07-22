'use client';

import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { adToBs, bsToAd, BS_MONTHS_EN, BS_MONTHS_NP, getDaysInBSMonth } from '@/lib/nepaliCalendar';

interface NepaliDatePickerProps {
  value?: string; // ISO string or YYYY-MM-DD
  onChange: (dateAD: string, dateBS: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  defaultMode?: 'BS' | 'AD';
}

export default function NepaliDatePicker({
  value,
  onChange,
  label,
  required = false,
  className = '',
  defaultMode = 'BS'
}: NepaliDatePickerProps) {
  const initialDate = value ? new Date(value) : new Date();
  const initialBS = adToBs(initialDate);

  const [mode, setMode] = useState<'BS' | 'AD'>(defaultMode);
  const [bsYear, setBsYear] = useState<number>(initialBS.year);
  const [bsMonth, setBsMonth] = useState<number>(initialBS.month);
  const [bsDay, setBsDay] = useState<number>(initialBS.day);

  const [adDateStr, setAdDateStr] = useState<string>(
    value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );

  const handleBSChange = (y: number, m: number, d: number) => {
    setBsYear(y);
    setBsMonth(m);
    
    // Ensure day doesn't exceed total days in new month
    const maxDays = getDaysInBSMonth(y, m);
    const validDay = Math.min(d, maxDays);
    setBsDay(validDay);

    const convertedAD = bsToAd(y, m, validDay);
    const isoAD = convertedAD.toISOString().slice(0, 10);
    const mStr = String(m).padStart(2, '0');
    const dStr = String(validDay).padStart(2, '0');
    const strBS = `${y}-${mStr}-${dStr}`;

    setAdDateStr(isoAD);
    onChange(isoAD, strBS);
  };

  const handleADChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newADStr = e.target.value;
    setAdDateStr(newADStr);
    if (newADStr) {
      const d = new Date(newADStr);
      if (!isNaN(d.getTime())) {
        const convertedBS = adToBs(d);
        setBsYear(convertedBS.year);
        setBsMonth(convertedBS.month);
        setBsDay(convertedBS.day);
        onChange(newADStr, convertedBS.strBS);
      }
    }
  };

  const daysInMonth = getDaysInBSMonth(bsYear, bsMonth);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setMode(mode === 'BS' ? 'AD' : 'BS')}
            className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Switch to {mode === 'BS' ? 'Gregorian (AD)' : 'Bikram Sambat (BS)'}
          </button>
        </div>
      )}

      {mode === 'BS' ? (
        <div className="grid grid-cols-3 gap-2">
          {/* BS Year */}
          <select
            value={bsYear}
            onChange={e => handleBSChange(Number(e.target.value), bsMonth, bsDay)}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {Array.from({ length: 30 }, (_, i) => 2070 + i).map(y => (
              <option key={y} value={y}>{y} BS</option>
            ))}
          </select>

          {/* BS Month */}
          <select
            value={bsMonth}
            onChange={e => handleBSChange(bsYear, Number(e.target.value), bsDay)}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            {BS_MONTHS_EN.map((mName, idx) => (
              <option key={mName} value={idx + 1}>
                {idx + 1}. {mName} ({BS_MONTHS_NP[idx]})
              </option>
            ))}
          </select>

          {/* BS Day */}
          <select
            value={bsDay}
            onChange={e => handleBSChange(bsYear, bsMonth, Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Gate {d}</option>
            ))}
          </select>
        </div>
      ) : (
        <input
          type="date"
          required={required}
          value={adDateStr}
          onChange={handleADChange}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
        />
      )}

      {/* Conversion footnote display */}
      <div className="text-[10px] text-slate-400 font-mono px-1 flex justify-between items-center">
        <span>BS: {bsYear}-{String(bsMonth).padStart(2, '0')}-{String(bsDay).padStart(2, '0')}</span>
        <span>AD: {adDateStr}</span>
      </div>
    </div>
  );
}
