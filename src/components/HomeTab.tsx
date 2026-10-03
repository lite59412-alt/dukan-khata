import React from 'react';
import {
  TrendingUp,
  BookOpen,
  Truck,
  Users,
  Banknote,
  Receipt,
  PlusCircle,
  UserCheck,
  FileSpreadsheet,
  Coins,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { AppStateData, Language } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, generateWhatsAppUdhariMessage, getTodayDateString } from '../utils/formatters';

interface HomeTabProps {
  state: AppStateData;
  language: Language;
  onNavigateTab: (tab: 'staff' | 'udhari' | 'supplier' | 'reports') => void;
  onOpenAddUdhari: () => void;
  onOpenMarkAttendance: () => void;
  onOpenAddExpense: () => void;
  onOpenSalaryGen: () => void;
  onOpenGalla: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  state,
  language,
  onNavigateTab,
  onOpenAddUdhari,
  onOpenMarkAttendance,
  onOpenAddExpense,
  onOpenSalaryGen,
  onOpenGalla,
}) => {
  const t = translations[language];
  const todayStr = getTodayDateString();

  // Metrics Calculation
  const todayGalla = state.gallaHistory.find((g) => g.date === todayStr) || {
    openingCash: 0,
    cashIn: 0,
    upiIn: 0,
    cardIn: 0,
    expenseOut: 0,
  };

  const todaySales = todayGalla.cashIn + todayGalla.upiIn + (todayGalla.cardIn || 0);

  const pendingUdhariTotal = state.udhariList
    .filter((u) => !u.isPaid)
    .reduce((sum, item) => sum + item.amount, 0);

  const supplierDueTotal = state.supplierList
    .filter((s) => s.status !== 'paid')
    .reduce((sum, item) => sum + item.dueAmount, 0);

  const staffTodayRecords = state.attendance.filter((a) => a.date === todayStr);
  const staffPresentCount = staffTodayRecords.filter(
    (a) => a.status === 'present' || a.status === 'half_day' || a.status === 'late' || a.status === 'overtime'
  ).length;

  // Approximate pending salary for current month: total basic minus advances
  const totalMonthlyBasic = state.staffList.reduce((sum, s) => sum + s.basicSalary, 0);
  const totalAdvances = Object.values(state.salaryAdjustments).reduce((sum, a) => sum + (a.advanceTaken || 0), 0);
  const salaryPendingTotal = Math.max(0, totalMonthlyBasic - totalAdvances);

  const todayExpensesTotal = state.expenseList
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // Overdue Udhari items for urgent attention
  const overdueUdhari = state.udhariList
    .filter((u) => !u.isPaid && u.dueDate < todayStr)
    .slice(0, 3);

  return (
    <div className="space-y-4 pb-24">
      {/* Date & Greeting Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {language === 'hi' ? 'दुकान स्थिति' : 'Today Overview'}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            {language === 'hi' ? 'शुभ लाभ!' : 'Welcome Back,'}{' '}
            {state.settings.ownerName
              ? state.settings.ownerName.split(' ')[0]
              : (language === 'hi' ? 'दुकानदार' : 'Shopkeeper')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDate(todayStr, language)} • {state.settings.shopName}
          </p>
        </div>

        <button
          id="btn-home-galla-banner"
          onClick={onOpenGalla}
          className="flex flex-col items-end px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'hi' ? 'गल्ला स्थिति' : 'Cash Galla'}</span>
          </div>
          <span className="text-sm font-bold text-emerald-400 mt-0.5 group-hover:scale-105 transition-transform">
            {formatINR(todayGalla.openingCash + todayGalla.cashIn - todayGalla.expenseOut)}
          </span>
        </button>
      </div>

      {/* QUICK ACTIONS BAR (Large, Touch-Friendly Buttons) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {language === 'hi' ? 'त्वरित कार्य (Quick Actions)' : 'Quick Actions'}
          </h3>
          <span className="text-[11px] text-slate-400">1-Tap Fast Actions</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Quick Action 1: Add Udhari */}
          <button
            id="qa-add-udhari"
            onClick={onOpenAddUdhari}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-left transition-all active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                {t.quickActions.addUdhari}
              </span>
              <span className="text-[11px] text-emerald-300/80 mt-0.5 block">
                {language === 'hi' ? 'सामान सहित पर्ची' : 'Item-wise Khata'}
              </span>
            </div>
          </button>

          {/* Quick Action 2: Mark Attendance */}
          <button
            id="qa-mark-attendance"
            onClick={onOpenMarkAttendance}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-left transition-all active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                {t.quickActions.markAttendance}
              </span>
              <span className="text-[11px] text-blue-300/80 mt-0.5 block">
                {language === 'hi' ? 'QR व मैनुअल हाजिरी' : 'QR & Manual'}
              </span>
            </div>
          </button>

          {/* Quick Action 3: Add Expense */}
          <button
            id="qa-add-expense"
            onClick={onOpenAddExpense}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-left transition-all active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-500/30 transition-colors">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                {t.quickActions.addExpense}
              </span>
              <span className="text-[11px] text-rose-300/80 mt-0.5 block">
                {language === 'hi' ? 'चाय, भाड़ा, बिल' : 'Tea, Freight, Bills'}
              </span>
            </div>
          </button>

          {/* Quick Action 4: Generate Salary */}
          <button
            id="qa-generate-salary"
            onClick={onOpenSalaryGen}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-left transition-all active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-tight">
                {t.quickActions.generateSalary}
              </span>
              <span className="text-[11px] text-amber-300/80 mt-0.5 block">
                {language === 'hi' ? 'सैलरी स्लिप + व्हाट्सएप' : 'Auto Slip & WhatsApp'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 6 CORE SUMMARY CARDS (Mandatory requirement) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {language === 'hi' ? 'खाता स्थिति व सारांश' : 'Summary Dashboard'}
          </h3>
          <span className="text-[11px] text-slate-400">
            {language === 'hi' ? 'दैनिक अपडेट' : 'Real-time Stats'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Today Sales */}
          <div
            id="card-today-sales"
            onClick={onOpenGalla}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.todaySales}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-white mt-1.5 tracking-tight">
              {formatINR(todaySales)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Cash: {formatINR(todayGalla.cashIn)} • UPI: {formatINR(todayGalla.upiIn)}
            </p>
          </div>

          {/* Card 2: Pending Udhari */}
          <div
            id="card-pending-udhari"
            onClick={() => onNavigateTab('udhari')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.pendingUdhari}
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-rose-400 mt-1.5 tracking-tight">
              {formatINR(pendingUdhariTotal)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {state.udhariList.filter((u) => !u.isPaid).length} {language === 'hi' ? 'ग्राहकों पर बाकी' : 'Customers Pending'}
            </p>
          </div>

          {/* Card 3: Supplier Due */}
          <div
            id="card-supplier-due"
            onClick={() => onNavigateTab('supplier')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.supplierDue}
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-amber-400 mt-1.5 tracking-tight">
              {formatINR(supplierDueTotal)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {state.supplierList.filter((s) => s.status !== 'paid').length} {language === 'hi' ? 'सप्लायर बिल बाकी' : 'Suppliers to Pay'}
            </p>
          </div>

          {/* Card 4: Staff Present */}
          <div
            id="card-staff-present"
            onClick={() => onNavigateTab('staff')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.staffPresent}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-blue-400 mt-1.5 tracking-tight">
              {staffPresentCount} / {state.staffList.length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {state.staffList.length - staffPresentCount} {language === 'hi' ? 'गैरहाजिर' : 'Absent today'}
            </p>
          </div>

          {/* Card 5: Salary Pending */}
          <div
            id="card-salary-pending"
            onClick={() => onNavigateTab('staff')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.salaryPending}
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-purple-300 mt-1.5 tracking-tight">
              {formatINR(salaryPendingTotal)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {state.staffList.length} {language === 'hi' ? 'कर्मचारियों का माह वेतन' : 'Staff for this month'}
            </p>
          </div>

          {/* Card 6: Today Expenses */}
          <div
            id="card-today-expenses"
            onClick={onOpenAddExpense}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 cursor-pointer transition-all active:scale-98 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 truncate">
                {t.metrics.todayExpenses}
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-lg font-bold text-teal-300 mt-1.5 tracking-tight">
              {formatINR(todayExpensesTotal)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {state.expenseList.filter((e) => e.date === todayStr).length} {language === 'hi' ? 'खर्चे दर्ज' : 'Recorded entries'}
            </p>
          </div>
        </div>
      </div>

      {/* OVERDUE UDHARI ALERT SECTION */}
      {overdueUdhari.length > 0 && (
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-rose-900/30">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{language === 'hi' ? 'तारीख निकली उधारी (तगादा भेजें)' : 'Overdue Khata (Remind Now)'}</span>
            </div>
            <button
              onClick={() => onNavigateTab('udhari')}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 font-medium"
            >
              <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {overdueUdhari.map((u) => {
              const waLink = generateWhatsAppUdhariMessage(
                u,
                state.settings.shopName,
                state.settings.upiId,
                language
              );

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800/80 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white truncate">{u.customerName}</p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold shrink-0">
                        {language === 'hi' ? 'देरी' : 'Overdue'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {u.itemName} ({u.quantity})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-rose-400">
                      {formatINR(u.amount)}
                    </span>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-transform active:scale-95"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'तगादा' : 'Remind'}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FRESH ACCOUNT EMPTY STATE BANNER */}
      {state.udhariList.length === 0 && state.expenseList.length === 0 && state.supplierList.length === 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला • खाता नया है' : 'No Records Found • Fresh Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {language === 'hi'
                ? 'शुरुआत करने के लिए पहली उधारी, गल्ला या खर्चा दर्ज करें।'
                : 'Start fresh by recording your first customer udhari, galla balance, or expense.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={onOpenAddUdhari}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'hi' ? '+ पहली उधारी जोड़ें' : '+ Add First Udhari'}</span>
            </button>
            <button
              onClick={onOpenGalla}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>{language === 'hi' ? 'गल्ला दर्ज करें' : 'Set Galla Cash'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('supplier')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>{language === 'hi' ? 'सप्लायर बिल जोड़ें' : 'Add Supplier Due'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
