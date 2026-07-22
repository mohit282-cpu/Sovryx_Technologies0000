'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, X } from 'lucide-react';
import {
  BSDate,
  adToBs,
  bsToAd,
  getDaysInBSMonth,
  BS_MONTHS_EN,
  BS_MONTHS_NP,
  getCurrentFiscalYearBS
} from '@/lib/nepaliCalendar';

interface BSCalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

// Convert English numerals to Nepali numerals
export function toNepaliDigits(num: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, (digit) => nepaliDigits[parseInt(digit, 10)]);
}

export default function BSCalendarPopover({ isOpen, onClose }: BSCalendarPopoverProps) {
  const today = new Date();
  const todayBS: BSDate = adToBs(today);

  const [viewYear, setViewYear] = useState<number>(todayBS.year);
  const [viewMonth, setViewMonth] = useState<number>(todayBS.month); // 1-12
  const [useNepaliScript, setUseNepaliScript] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(todayBS.day);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleResetToday = () => {
    setViewYear(todayBS.year);
    setViewMonth(todayBS.month);
    setSelectedDay(todayBS.day);
  };

  // Calendar calculations
  const daysInMonth = getDaysInBSMonth(viewYear, viewMonth);
  const firstDayAD = bsToAd(viewYear, viewMonth, 1);
  const startDayOfWeek = firstDayAD.getDay(); // 0 = Sun, 6 = Sat

  // Selected date AD equivalent
  const selectedAD = bsToAd(viewYear, viewMonth, selectedDay);
  const selectedADFormatted = selectedAD.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const monthName = useNepaliScript ? BS_MONTHS_NP[viewMonth - 1] : BS_MONTHS_EN[viewMonth - 1];
  const displayYear = useNepaliScript ? toNepaliDigits(viewYear) : viewYear;
  const daysOfWeek = useNepaliScript
    ? ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-slate-100 animate-in fade-in zoom-in-95">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-100">
            {monthName} {displayYear} <span className="text-xs font-normal text-indigo-300">(BS)</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setUseNepaliScript(!useNepaliScript)}
            title="Toggle Nepali / English Script"
            className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            {useNepaliScript ? 'EN' : 'नेपाली'}
          </button>
          <button
            type="button"
            onClick={handleResetToday}
            title="Go to Today"
            className="p-1 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Navigator & Fiscal Year */}
      <div className="flex items-center justify-between my-2.5 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <div className="text-xs font-semibold text-indigo-300">
            {useNepaliScript ? `वि.सं. ${toNepaliDigits(viewYear)}` : `B.S. ${viewYear}`}
          </div>
          <div className="text-[10px] text-slate-400">
            FY: {getCurrentFiscalYearBS(firstDayAD)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-1">
        {daysOfWeek.map((day, idx) => (
          <div
            key={day}
            className={`py-1 rounded ${idx === 6 ? 'text-rose-400 font-semibold' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {/* Blank padding cells */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} className="h-8" />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const isToday =
            viewYear === todayBS.year &&
            viewMonth === todayBS.month &&
            dayNum === todayBS.day;
          const isSelected = dayNum === selectedDay;
          const dayOfWeek = (startDayOfWeek + idx) % 7;
          const isSaturday = dayOfWeek === 6;

          return (
            <button
              type="button"
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className={`h-8 rounded-lg flex flex-col items-center justify-center font-medium transition-all ${
                isToday
                  ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400 shadow-md shadow-indigo-600/40 scale-105'
                  : isSelected
                  ? 'bg-slate-700 text-indigo-300 border border-indigo-500/50'
                  : 'hover:bg-slate-800 text-slate-200'
              } ${isSaturday && !isToday ? 'text-rose-400 font-semibold' : ''}`}
            >
              <span>{useNepaliScript ? toNepaliDigits(dayNum) : dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Selected BS Date:</span>
          <span className="font-semibold text-indigo-300">
            {viewYear} {BS_MONTHS_EN[viewMonth - 1]} {selectedDay}{' '}
            {useNepaliScript ? `(${toNepaliDigits(viewYear)} ${BS_MONTHS_NP[viewMonth - 1]} ${toNepaliDigits(selectedDay)})` : ''}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Gregorian (AD):</span>
          <span className="text-slate-200 font-mono text-[11px]">{selectedADFormatted}</span>
        </div>
      </div>
    </div>
  );
}
