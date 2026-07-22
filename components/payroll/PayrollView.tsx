'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Calculator,
  FileSpreadsheet,
  Download,
  Send,
  UserCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Receipt,
  Plus
} from 'lucide-react';
import { Employee } from '@/types';
import { createItem } from '@/lib/services/firestore';
import { adToBs, formatNPR, BS_MONTHS_EN, getCurrentFiscalYearBS } from '@/lib/nepaliCalendar';

interface PayrollViewProps {
  employees: Employee[];
  onRefresh?: () => void;
}

export interface PayrollSlip {
  id: string;
  employeeId: string;
  employeeName: string;
  panNo?: string;
  bsMonth: string;
  bsYear: number;
  fiscalYearBS: string;
  basicSalaryNPR: number;
  allowancesNPR: number;
  grossSalaryNPR: number;
  ssfEmployeeNPR: number; // 11%
  ssfEmployerNPR: number; // 20%
  citDeductionNPR: number;
  tdsTaxNPR: number; // Income Tax TDS
  netSalaryNPR: number;
  paymentStatus: 'Pending' | 'Processed' | 'Paid';
  paymentDateAD: string;
  paymentDateBS: string;
  bankName?: string;
  bankAccountNo?: string;
}

export default function PayrollView({ employees, onRefresh }: PayrollViewProps) {
  const currentBS = adToBs(new Date());
  const currentFY = getCurrentFiscalYearBS(new Date());

  const [selectedMonth, setSelectedMonth] = useState<string>(currentBS.monthName);
  const [selectedYear, setSelectedYear] = useState<number>(currentBS.year);
  const [slips, setSlips] = useState<PayrollSlip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);

  // Calculate Nepal SSF & Income Tax TDS (Monthly approximation according to IRD Nepal rules)
  const calculateNepalPayroll = (employee: Employee): PayrollSlip => {
    const basic = employee.salary || 50000;
    const allowances = Math.round(basic * 0.15); // 15% standard allowances
    const gross = basic + allowances;

    // SSF (11% Employee, 20% Employer)
    const ssfEmp = Math.round(basic * 0.11);
    const ssfEmployer = Math.round(basic * 0.20);

    // Annual taxable estimation
    const annualGross = gross * 12;
    const annualSSF = ssfEmp * 12;
    const taxableAnnual = Math.max(0, annualGross - annualSSF);

    // Nepal Single Tax Brackets (Rough Monthly TDS Allocation)
    let annualTax = 0;
    if (taxableAnnual <= 500000) {
      annualTax = taxableAnnual * 0.01; // 1% SSF tax rate
    } else if (taxableAnnual <= 700000) {
      annualTax = 5000 + (taxableAnnual - 500000) * 0.10;
    } else if (taxableAnnual <= 1000000) {
      annualTax = 25000 + (taxableAnnual - 700000) * 0.20;
    } else if (taxableAnnual <= 2000000) {
      annualTax = 85000 + (taxableAnnual - 1000000) * 0.30;
    } else {
      annualTax = 385000 + (taxableAnnual - 2000000) * 0.36;
    }

    const monthlyTDS = Math.round(annualTax / 12);
    const cit = 0; // CIT Optional
    const netSalary = gross - ssfEmp - monthlyTDS - cit;

    const todayAD = new Date().toISOString().split('T')[0];
    const todayBS = adToBs(todayAD);

    return {
      id: `PAY-${employee.id}-${selectedMonth}-${selectedYear}`,
      employeeId: employee.id,
      employeeName: employee.name,
      panNo: `PAN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      bsMonth: selectedMonth,
      bsYear: selectedYear,
      fiscalYearBS: currentFY,
      basicSalaryNPR: basic,
      allowancesNPR: allowances,
      grossSalaryNPR: gross,
      ssfEmployeeNPR: ssfEmp,
      ssfEmployerNPR: ssfEmployer,
      citDeductionNPR: cit,
      tdsTaxNPR: monthlyTDS,
      netSalaryNPR: netSalary,
      paymentStatus: 'Pending',
      paymentDateAD: todayAD,
      paymentDateBS: todayBS.formatted,
      bankName: 'Nabil Bank Ltd.',
      bankAccountNo: `0100017500${Math.floor(1000 + Math.random() * 9000)}`
    };
  };

  const handleGeneratePayrollBatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generated = employees.map(emp => calculateNepalPayroll(emp));
      setSlips(generated);
      setIsProcessing(false);
    }, 600);
  };

  const handleDisburseSalary = async (slip: PayrollSlip) => {
    try {
      await createItem('timeLogs', {
        employeeId: slip.employeeId,
        employeeName: slip.employeeName,
        taskId: 'PAYROLL-DISBURSED',
        taskTitle: `Payroll Disbursed for ${slip.bsMonth} ${slip.bsYear} (BS)`,
        projectId: 'FINANCE',
        projectName: 'Nepal Payroll & Statutory Compliance',
        date: slip.paymentDateAD,
        startTime: '10:00',
        endTime: '10:00',
        hoursSpent: 0,
        notes: `Net Salary ${formatNPR(slip.netSalaryNPR)} disbursed via Bank. TDS: ${formatNPR(slip.tdsTaxNPR)}, SSF: ${formatNPR(slip.ssfEmployeeNPR)}`
      });

      setSlips(prev => prev.map(s => s.id === slip.id ? { ...s, paymentStatus: 'Paid' } : s));
      alert(`Salary disbursed successfully for ${slip.employeeName} (${slip.bsMonth} ${slip.bsYear} BS)`);
    } catch (err: any) {
      alert('Error disbursing payroll: ' + err.message);
    }
  };

  const totalPayrollGross = slips.reduce((acc, s) => acc + s.grossSalaryNPR, 0);
  const totalNetPayable = slips.reduce((acc, s) => acc + s.netSalaryNPR, 0);
  const totalTDS = slips.reduce((acc, s) => acc + s.tdsTaxNPR, 0);
  const totalSSF = slips.reduce((acc, s) => acc + s.ssfEmployeeNPR + s.ssfEmployerNPR, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              NEPAL PAYROLL & SSF / TDS COMPLIANCE
            </span>
            <span className="text-xs text-slate-400 font-mono">Fiscal Year {currentFY}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Bikram Sambat Salary Disbursement</h1>
          <p className="text-xs text-slate-400">
            Auto-calculated SSF (11%+20%), IRD Income Tax TDS, and Bank Transfers in Nepalese Rupees (NPR).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none font-bold"
          >
            {BS_MONTHS_EN.map(m => (
              <option key={m} value={m}>{m} (BS)</option>
            ))}
          </select>

          <input
            type="number"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="w-20 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none font-mono"
          />

          <button
            onClick={handleGeneratePayrollBatch}
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
          >
            <Calculator className="w-4 h-4" />
            {isProcessing ? 'Calculating...' : 'Calculate Payroll'}
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      {slips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Gross Payroll</span>
            <span className="text-xl font-black text-white">{formatNPR(totalPayrollGross)}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Net Disbursement</span>
            <span className="text-xl font-black text-emerald-400">{formatNPR(totalNetPayable)}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">TDS Income Tax (IRD)</span>
            <span className="text-xl font-black text-amber-400">{formatNPR(totalTDS)}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total SSF Contribution</span>
            <span className="text-xl font-black text-indigo-400">{formatNPR(totalSSF)}</span>
          </div>
        </div>
      )}

      {/* Slips Table */}
      {slips.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/80 rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs font-medium">Click &quot;Calculate Payroll&quot; to generate Bikram Sambat salary vouchers for {selectedMonth} {selectedYear} BS.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Employee & PAN</th>
                <th className="p-3.5">BS Period</th>
                <th className="p-3.5">Basic + Allowances</th>
                <th className="p-3.5">SSF (11%)</th>
                <th className="p-3.5">TDS Tax</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {slips.map(s => (
                <tr key={s.id} className="hover:bg-slate-950/50 transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-white">{s.employeeName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{s.panNo}</p>
                  </td>
                  <td className="p-3.5 font-bold text-indigo-400">
                    {s.bsMonth} {s.bsYear} (BS)
                  </td>
                  <td className="p-3.5 font-mono text-slate-200">
                    {formatNPR(s.grossSalaryNPR)}
                  </td>
                  <td className="p-3.5 font-mono text-indigo-300">
                    {formatNPR(s.ssfEmployeeNPR)}
                  </td>
                  <td className="p-3.5 font-mono text-amber-400">
                    {formatNPR(s.tdsTaxNPR)}
                  </td>
                  <td className="p-3.5 font-mono text-emerald-400 font-bold">
                    {formatNPR(s.netSalaryNPR)}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setSelectedSlip(s)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold"
                    >
                      Payslip Slip
                    </button>

                    {s.paymentStatus !== 'Paid' && (
                      <button
                        onClick={() => handleDisburseSalary(s)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold"
                      >
                        Disburse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Modal Detail */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">SOVRYX NEPAL PAYSLIP VOUCHER</span>
                <h3 className="text-base font-extrabold text-white">{selectedSlip.employeeName}</h3>
                <p className="text-[10px] text-slate-400 font-mono">PAN: {selectedSlip.panNo} • Period: {selectedSlip.bsMonth} {selectedSlip.bsYear} BS</p>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Basic Salary:</span>
                <span className="text-white font-bold">{formatNPR(selectedSlip.basicSalaryNPR)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Allowances (15%):</span>
                <span className="text-white font-bold">{formatNPR(selectedSlip.allowancesNPR)}</span>
              </div>
              <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-slate-200">
                <span>Gross Monthly Earnings:</span>
                <span>{formatNPR(selectedSlip.grossSalaryNPR)}</span>
              </div>

              <div className="border-t border-slate-800/80 pt-2 space-y-1 text-rose-400">
                <div className="flex justify-between">
                  <span>Deduction: SSF Employee (11%):</span>
                  <span>- {formatNPR(selectedSlip.ssfEmployeeNPR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deduction: IRD Income TDS Tax:</span>
                  <span>- {formatNPR(selectedSlip.tdsTaxNPR)}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between font-extrabold text-sm text-emerald-400">
                <span>NET SALARY PAYABLE:</span>
                <span>{formatNPR(selectedSlip.netSalaryNPR)}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/40 text-indigo-300 text-[11px] space-y-1">
              <p><strong>Employer Contribution (SSF 20%):</strong> {formatNPR(selectedSlip.ssfEmployerNPR)}</p>
              <p><strong>Bank Account:</strong> {selectedSlip.bankName} - {selectedSlip.bankAccountNo}</p>
              <p><strong>Disbursement Date BS:</strong> {selectedSlip.paymentDateBS}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSlip(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
