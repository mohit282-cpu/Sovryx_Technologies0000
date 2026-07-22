'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Building2,
  Send,
  Calendar,
  AlertCircle,
  Download,
  Percent,
  Wallet,
  ShieldCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { Employee, PayrollRecord, CompanySettings } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createItem, updateItem, deleteItem } from '@/lib/services/firestore';

interface PayrollViewProps {
  payrollRecords?: PayrollRecord[];
  employees: Employee[];
  settings?: CompanySettings;
  onRefresh: () => void;
}

export default function PayrollView({
  payrollRecords = [],
  employees = [],
  settings,
  onRefresh
}: PayrollViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('Shrawan 2083');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Payroll Form State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [festivalBonus, setFestivalBonus] = useState<number>(0); // Dashain / Tihar bonus
  const [overtimePay, setOvertimePay] = useState<number>(0);
  const [providentFund, setProvidentFund] = useState<number>(0); // 10% default optional
  const [citDeduction, setCitDeduction] = useState<number>(0);
  const [ssfDeduction, setSsfDeduction] = useState<number>(0);
  const [advanceSalary, setAdvanceSalary] = useState<number>(0);
  const [taxDeduction, setTaxDeduction] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'eSewa' | 'Khalti' | 'IME Pay' | 'Cash'>('Bank Transfer');

  const currencySymbol = settings?.currencySymbol || 'Rs.';

  const handleSelectEmployeeForPayroll = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.id === empId || e.employeeId === empId);
    if (emp) {
      const basic = emp.salary || 0;
      setBasicSalary(basic);
      setAllowances(Math.round(basic * 0.2)); // 20% default allowances
      setProvidentFund(Math.round(basic * 0.1)); // 10% PF
      setTaxDeduction(Math.round(basic * 0.01)); // 1% SST / basic TDS
      setFestivalBonus(0);
      setBonus(0);
      setOvertimePay(0);
      setAdvanceSalary(0);
    }
  };

  const calculateGross = () => basicSalary + allowances + bonus + festivalBonus + overtimePay;
  const calculateDeductions = () => providentFund + citDeduction + ssfDeduction + advanceSalary + taxDeduction;
  const calculateNet = () => calculateGross() - calculateDeductions();

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id === selectedEmpId || e.employeeId === selectedEmpId);
    if (!emp) return;

    setIsSubmitting(true);
    try {
      const gross = calculateGross();
      const totalDed = calculateDeductions();
      const net = gross - totalDed;

      const newRecord: Omit<PayrollRecord, 'id'> = {
        employeeId: emp.id,
        employeeName: emp.name,
        employeePosition: emp.position,
        panNo: emp.panNo || settings?.panNo || '',
        month: selectedMonth,
        basicSalary,
        allowances,
        bonus,
        festivalBonus,
        overtimePay,
        grossSalary: gross,
        deductions: {
          providentFund,
          citizenInvestmentTrust: citDeduction,
          socialSecurityFund: ssfDeduction,
          advanceSalary,
          taxDeduction
        },
        totalDeductions: totalDed,
        netSalary: net,
        status: 'Draft',
        paymentMethod
      };

      await createItem('payrollRecords', newRecord);
      setIsNewModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Error creating payroll:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateBatchPayroll = async () => {
    if (employees.length === 0) return;
    if (!confirm(`Generate draft payroll records for all ${employees.length} active employees for ${selectedMonth}?`)) return;

    setIsSubmitting(true);
    try {
      for (const emp of employees) {
        const basic = emp.salary || 35000;
        const allow = Math.round(basic * 0.15);
        const pf = Math.round(basic * 0.10);
        const tax = Math.round(basic * 0.01);
        const gross = basic + allow;
        const totalDed = pf + tax;
        const net = gross - totalDed;

        await createItem('payrollRecords', {
          employeeId: emp.id,
          employeeName: emp.name,
          employeePosition: emp.position,
          panNo: emp.panNo || '',
          month: selectedMonth,
          basicSalary: basic,
          allowances: allow,
          bonus: 0,
          festivalBonus: 0,
          overtimePay: 0,
          grossSalary: gross,
          deductions: {
            providentFund: pf,
            taxDeduction: tax
          },
          totalDeductions: totalDed,
          netSalary: net,
          status: 'Draft',
          paymentMethod: emp.digitalWallets?.esewaNo ? 'eSewa' : 'Bank Transfer'
        });
      }
      onRefresh();
    } catch (err) {
      console.error('Error batch generating payroll:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      await updateItem('payrollRecords', recordId, {
        status: 'Paid',
        paidDate: new Date().toISOString()
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating payroll status:', err);
    }
  };

  const filteredRecords = payrollRecords.filter(r =>
    (r.month === selectedMonth || !selectedMonth) &&
    (r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalGrossPayroll = filteredRecords.reduce((acc, r) => acc + (r.grossSalary || 0), 0);
  const totalNetPayroll = filteredRecords.reduce((acc, r) => acc + (r.netSalary || 0), 0);
  const totalTaxDeducted = filteredRecords.reduce((acc, r) => acc + (r.deductions?.taxDeduction || 0), 0);
  const totalPFCollected = filteredRecords.reduce((acc, r) => acc + (r.deductions?.providentFund || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" /> Nepal Corporate Payroll & Compliance
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Payroll & Festival Bonus Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage Basic Salary, Allowances, Festival Bonus (Dashain), PF, CIT, TDS Tax, and Digital Wallets (eSewa / Khalti)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateBatchPayroll}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            Batch Process Month
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Salary Voucher
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Gross Salary</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {formatCurrency(totalGrossPayroll, currencySymbol)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{filteredRecords.length} Employees in batch</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Net Payable Salary</span>
            <CreditCard className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 font-mono">
            {formatCurrency(totalNetPayroll, currencySymbol)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Disbursement ready</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total TDS Tax Withheld</span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300 font-mono">
            {formatCurrency(totalTaxDeducted, currencySymbol)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">IRD Government Compliance</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Provident Fund (PF)</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-300 font-mono">
            {formatCurrency(totalPFCollected, currencySymbol)}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">10% Employee contribution</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Month:</span>
            <input
              type="text"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              placeholder="e.g. Shrawan 2083"
              className="bg-transparent text-white focus:outline-none w-32 font-medium"
            />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search employee or wallet..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Month</th>
                <th className="p-3.5">Basic Salary</th>
                <th className="p-3.5">Festival Bonus</th>
                <th className="p-3.5">Deductions (PF/Tax)</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No payroll records found for {selectedMonth}. Click &quot;New Salary Voucher&quot; or &quot;Batch Process Month&quot; to generate.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{rec.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{rec.employeePosition || 'Staff'}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300">{rec.month}</td>
                    <td className="p-3.5 font-mono text-slate-300">{formatCurrency(rec.basicSalary, currencySymbol)}</td>
                    <td className="p-3.5 font-mono text-amber-400">
                      {rec.festivalBonus > 0 ? formatCurrency(rec.festivalBonus, currencySymbol) : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-rose-400">
                      -{formatCurrency(rec.totalDeductions, currencySymbol)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(rec.netSalary, currencySymbol)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {rec.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsSlipModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-[10px] font-semibold transition-all border border-indigo-500/30"
                      >
                        Payslip
                      </button>
                      {rec.status !== 'Paid' && (
                        <button
                          onClick={() => handleMarkAsPaid(rec.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[10px] font-semibold transition-all border border-emerald-500/30"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Modal */}
      {isSlipModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {settings?.companyName || 'Sovryx Nepal Pvt. Ltd.'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {settings?.address?.municipality || 'Kathmandu'}, {settings?.address?.district || 'Nepal'} • PAN: {settings?.panNo || '609812345'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  OFFICIAL PAYSLIP
                </span>
                <p className="text-[10px] text-slate-400 mt-1">{selectedRecord.month}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">EMPLOYEE NAME</span>
                  <span className="font-bold text-white text-sm">{selectedRecord.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">POSITION</span>
                  <span className="font-semibold text-slate-200">{selectedRecord.employeePosition || 'Staff'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PAN NUMBER</span>
                  <span className="font-mono text-slate-300">{selectedRecord.panNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PAYMENT METHOD</span>
                  <span className="font-semibold text-indigo-400">{selectedRecord.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PAYMENT STATUS</span>
                  <span className="font-bold text-emerald-400">{selectedRecord.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DISBURSED DATE</span>
                  <span className="text-slate-300">{selectedRecord.paidDate ? formatDate(selectedRecord.paidDate) : 'Pending'}</span>
                </div>
              </div>

              {/* Salary Breakdown Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    Earnings
                  </h4>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Basic Salary</span>
                    <span className="font-mono text-white">{formatCurrency(selectedRecord.basicSalary, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Allowances</span>
                    <span className="font-mono text-white">{formatCurrency(selectedRecord.allowances, currencySymbol)}</span>
                  </div>
                  {selectedRecord.festivalBonus > 0 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-amber-400">Dashain/Festival Bonus</span>
                      <span className="font-mono text-amber-400 font-bold">{formatCurrency(selectedRecord.festivalBonus, currencySymbol)}</span>
                    </div>
                  )}
                  {selectedRecord.bonus > 0 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-400">Performance Bonus</span>
                      <span className="font-mono text-white">{formatCurrency(selectedRecord.bonus, currencySymbol)}</span>
                    </div>
                  )}
                  {selectedRecord.overtimePay > 0 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-400">Overtime Pay</span>
                      <span className="font-mono text-white">{formatCurrency(selectedRecord.overtimePay, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-800 text-emerald-400">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono">{formatCurrency(selectedRecord.grossSalary, currencySymbol)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                    Deductions
                  </h4>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Provident Fund (PF)</span>
                    <span className="font-mono text-white">{formatCurrency(selectedRecord.deductions?.providentFund || 0, currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-400">Income Tax (TDS)</span>
                    <span className="font-mono text-white">{formatCurrency(selectedRecord.deductions?.taxDeduction || 0, currencySymbol)}</span>
                  </div>
                  {(selectedRecord.deductions?.citizenInvestmentTrust || 0) > 0 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-400">CIT Contribution</span>
                      <span className="font-mono text-white">{formatCurrency(selectedRecord.deductions?.citizenInvestmentTrust, currencySymbol)}</span>
                    </div>
                  )}
                  {(selectedRecord.deductions?.advanceSalary || 0) > 0 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-slate-400">Advance Salary Return</span>
                      <span className="font-mono text-white">{formatCurrency(selectedRecord.deductions?.advanceSalary, currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-800 text-rose-400">
                    <span>Total Deductions</span>
                    <span className="font-mono">{formatCurrency(selectedRecord.totalDeductions, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-indigo-900/30 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Net Take-Home Salary</span>
                  <span className="text-[10px] text-slate-400">Directly transferred via {selectedRecord.paymentMethod}</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {formatCurrency(selectedRecord.netSalary, currencySymbol)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 flex items-center gap-2 shadow-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Salary Voucher Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">New Nepal Payroll Voucher</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Select Employee *</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={e => handleSelectEmployeeForPayroll(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position}) - {formatCurrency(emp.salary, currencySymbol)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Basic Salary ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    value={basicSalary}
                    onChange={e => setBasicSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Allowances ({currencySymbol})</label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-amber-400 block mb-1">Dashain/Festival Bonus ({currencySymbol})</label>
                  <input
                    type="number"
                    value={festivalBonus}
                    onChange={e => setFestivalBonus(Number(e.target.value))}
                    placeholder="1 Month Basic for Dashain"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Overtime Pay ({currencySymbol})</label>
                  <input
                    type="number"
                    value={overtimePay}
                    onChange={e => setOvertimePay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Statutory Deductions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Provident Fund (PF 10%)</label>
                    <input
                      type="number"
                      value={providentFund}
                      onChange={e => setProvidentFund(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Income Tax (TDS)</label>
                    <input
                      type="number"
                      value={taxDeduction}
                      onChange={e => setTaxDeduction(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Disbursement Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="eSewa">eSewa Wallet</option>
                    <option value="Khalti">Khalti Wallet</option>
                    <option value="IME Pay">IME Pay</option>
                    <option value="Cash">Cash Handout</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Net Calculated Take-Home</label>
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono font-bold text-sm">
                    {formatCurrency(calculateNet(), currencySymbol)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEmpId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Salary Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
