import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Share2,
  Printer,
  TrendingUp,
  BookOpen,
  Truck,
  Users,
  Banknote,
  Receipt,
  FileText,
} from 'lucide-react';
import { AppStateData, Language } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import { calculateStaffSalary } from '../utils/salaryCalculator';

type ReportType = 'daily' | 'staff' | 'udhari' | 'supplier' | 'salary' | 'expense';

interface ReportsTabProps {
  state: AppStateData;
  language: Language;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ state, language }) => {
  const t = translations[language];
  const todayStr = getTodayDateString();

  const [activeReport, setActiveReport] = useState<ReportType>('daily');

  // Calculations for reports
  const todayGalla = state.gallaHistory.find((g) => g.date === todayStr) || {
    openingCash: 5200,
    cashIn: 18450,
    upiIn: 24300,
    cardIn: 3200,
    expenseOut: 1150,
  };

  const totalSales = todayGalla.cashIn + todayGalla.upiIn + (todayGalla.cardIn || 0);
  const totalPendingUdhari = state.udhariList
    .filter((u) => !u.isPaid)
    .reduce((sum, u) => sum + u.amount, 0);

  const totalCollectedUdhari = state.udhariList
    .filter((u) => u.isPaid)
    .reduce((sum, u) => sum + u.amount, 0);

  const totalSupplierDue = state.supplierList
    .filter((s) => s.status !== 'paid')
    .reduce((sum, s) => sum + s.dueAmount, 0);

  const totalSupplierPaid = state.supplierList.reduce((sum, s) => sum + s.paidAmount, 0);

  const totalExpenses = state.expenseList.reduce((sum, e) => sum + e.amount, 0);

  // Staff Salary Total
  const salaryResults = state.staffList.map((staff) => {
    const adj = state.salaryAdjustments[`${staff.id}_2026-09`];
    return calculateStaffSalary(staff, state.attendance, adj);
  });

  const totalNetSalaries = salaryResults.reduce((sum, s) => sum + s.netSalary, 0);

  // Generate WhatsApp summary text for reports
  const handleShareReportWhatsApp = () => {
    let text = '';
    if (language === 'hi') {
      text = `*दुकान व्यापार रिपोर्ट - ${state.settings.shopName}*\n` +
        `तारीख: ${formatDate(todayStr, 'hi')}\n` +
        `--------------------------------\n` +
        `आज की कुल बिक्री: ${formatINR(totalSales)}\n` +
        `- नकद (Cash): ${formatINR(todayGalla.cashIn)}\n` +
        `- ऑनलाइन (UPI): ${formatINR(todayGalla.upiIn)}\n` +
        `आज के खर्चे: ${formatINR(todayGalla.expenseOut)}\n` +
        `बाकी उधारी: ${formatINR(totalPendingUdhari)}\n` +
        `सप्लायर देनदारी: ${formatINR(totalSupplierDue)}\n` +
        `उपस्थित स्टाफ: ${state.attendance.filter((a) => a.date === todayStr && a.status === 'present').length}/${state.staffList.length}\n` +
        `--------------------------------\n` +
        `DukanKhata द्वारा तैयार`;
    } else {
      text = `*BUSINESS SUMMARY REPORT - ${state.settings.shopName}*\n` +
        `Date: ${formatDate(todayStr, 'en')}\n` +
        `--------------------------------\n` +
        `Today Sales: ${formatINR(totalSales)}\n` +
        `- Cash In: ${formatINR(todayGalla.cashIn)}\n` +
        `- UPI In: ${formatINR(todayGalla.upiIn)}\n` +
        `Today Expenses: ${formatINR(todayGalla.expenseOut)}\n` +
        `Pending Udhari: ${formatINR(totalPendingUdhari)}\n` +
        `Supplier Dues: ${formatINR(totalSupplierDue)}\n` +
        `Staff Present: ${state.attendance.filter((a) => a.date === todayStr && a.status === 'present').length}/${state.staffList.length}\n` +
        `--------------------------------\n` +
        `Generated via DukanKhata`;
    }

    const cleanPhone = state.settings.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header with Export & Share */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {t.reports.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatDate(todayStr, language)} • {state.settings.shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-transform active:scale-95"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'hi' ? 'प्रिंट / PDF' : 'Print PDF'}</span>
          </button>

          <button
            onClick={handleShareReportWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>{language === 'hi' ? 'व्हाट्सएप रिपोर्ट' : 'WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Report Categories Pills (6 report types mandated) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'daily', label: t.reports.daily, icon: TrendingUp },
          { id: 'staff', label: t.reports.staff, icon: Users },
          { id: 'udhari', label: t.reports.udhari, icon: BookOpen },
          { id: 'supplier', label: t.reports.supplier, icon: Truck },
          { id: 'salary', label: t.reports.salary, icon: Banknote },
          { id: 'expense', label: t.reports.expense, icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 shadow-sm'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="space-y-4">
        {/* 1. DAILY REPORT */}
        {activeReport === 'daily' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                  {language === 'hi' ? 'आज की कुल आमदनी' : 'Total Revenue Today'}
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {formatINR(totalSales)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Cash: {formatINR(todayGalla.cashIn)} • UPI: {formatINR(todayGalla.upiIn)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                  {language === 'hi' ? 'दैनिक शुद्ध बचत' : 'Net Cashflow Today'}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {formatINR(totalSales - todayGalla.expenseOut)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {language === 'hi' ? 'बिक्री में से खर्चे घटाकर' : 'Sales minus expenses'}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'आज की मुख्य हलचल:' : "Today's Highlights:"}
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {language === 'hi' ? 'उधारी वसूली (Received Udhari):' : 'Udhari Collected:'}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatINR(totalCollectedUdhari)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {language === 'hi' ? 'सप्लायर को दिया भुगतान:' : 'Supplier Payments Paid:'}
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatINR(totalSupplierPaid)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {language === 'hi' ? 'स्टाफ उपस्थिति:' : 'Staff Attendance:'}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {state.attendance.filter((a) => a.date === todayStr && a.status === 'present').length} / {state.staffList.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. STAFF ATTENDANCE REPORT */}
        {activeReport === 'staff' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'स्टाफ उपस्थिति रजिस्टर:' : 'Staff Attendance Register:'}
            </h4>
            <div className="space-y-2">
              {state.staffList.map((st) => {
                const att = state.attendance.find((a) => a.staffId === st.id && a.date === todayStr);
                return (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{st.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{st.role} • {st.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {att?.status || 'PRESENT'}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        In: {att?.checkInTime || '09:00'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. UDHARI REPORT */}
        {activeReport === 'udhari' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'उधारी रिकवरी स्थिति' : 'Udhari Khata Status'}
              </h4>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                कुल बाकी: {formatINR(totalPendingUdhari)}
              </span>
            </div>
            <div className="space-y-2">
              {state.udhariList.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{u.customerName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.itemName} ({u.quantity})</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-black text-sm ${u.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatINR(u.amount)}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      {u.isPaid ? 'चुकाया हुआ' : `देय: ${formatDate(u.dueDate, language)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. SUPPLIER REPORT */}
        {activeReport === 'supplier' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'सप्लायर खाता बही' : 'Supplier Ledger'}
              </h4>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                कुल देनदारी: {formatINR(totalSupplierDue)}
              </span>
            </div>
            <div className="space-y-2">
              {state.supplierList.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{s.supplierName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.itemPurchased}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-sm text-amber-600 dark:text-amber-400">{formatINR(s.dueAmount)}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      कुल बिल: {formatINR(s.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SALARY REPORT */}
        {activeReport === 'salary' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'माह वेतन रजिस्टर' : 'Monthly Salary Register'}
              </h4>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                कुल देय: {formatINR(totalNetSalaries)}
              </span>
            </div>
            <div className="space-y-2">
              {salaryResults.map((s) => (
                <div
                  key={s.staffId}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{s.staffName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      मूल: {formatINR(s.basicSalary)} • हाजिरी: {s.presentDays} दिन
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {formatINR(s.netSalary)}
                    </span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      कटौती: -{formatINR(s.totalDeductions)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. EXPENSE REPORT */}
        {activeReport === 'expense' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'खर्च रिपोर्ट व श्रेणी' : 'Expenses Breakdown'}
              </h4>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                कुल खर्च: {formatINR(totalExpenses)}
              </span>
            </div>
            <div className="space-y-2">
              {state.expenseList.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{e.category} • {formatDate(e.date, language)}</p>
                  </div>
                  <span className="font-black text-sm text-rose-600 dark:text-rose-400">
                    {formatINR(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
