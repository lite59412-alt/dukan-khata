import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Info,
  RotateCcw,
} from 'lucide-react';
import { StaffMonthlySummary, MonthlyPaymentStatus } from '../utils/staffMonthlyPayment';
import { formatINR } from '../utils/formatters';

interface StaffMonthlySummarySectionProps {
  summary: StaffMonthlySummary | null;
  isLoading?: boolean;
  error?: string | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onResetToCurrentMonth?: () => void;
}

export const StaffMonthlySummarySection: React.FC<StaffMonthlySummarySectionProps> = ({
  summary,
  isLoading = false,
  error = null,
  onPreviousMonth,
  onNextMonth,
  onResetToCurrentMonth,
}) => {
  const getStatusBadge = (status: MonthlyPaymentStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Paid</span>
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Partially Paid</span>
          </span>
        );
      case 'Overpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>Overpaid</span>
          </span>
        );
      case 'Unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-300 border border-slate-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Unpaid</span>
          </span>
        );
    }
  };

  return (
    <div
      id="section-staff-monthly-summary"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4"
    >
      {/* SECTION 4: Simple Month Selector */}
      {/* Format: [ Previous Month ] [ October 2026 ] [ Next Month ] */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <button
          type="button"
          id="btn-prev-month"
          onClick={onPreviousMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Month</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span
              id="label-selected-month"
              className="text-xs sm:text-sm font-black text-white tracking-wide"
            >
              {summary ? summary.monthLabel : 'October 2026'}
            </span>
          </div>

          {onResetToCurrentMonth && (
            <button
              type="button"
              onClick={onResetToCurrentMonth}
              title="Jump to Current Month"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          id="btn-next-month"
          onClick={onNextMonth}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
        >
          <span>Next Month</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Calculating monthly payment summary...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Failed to calculate monthly summary</p>
            <p className="text-[11px] text-rose-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: Exact English labels:
          Monthly Salary
          Paid This Month
          Remaining This Month
          Payment Status
      */}
      {!isLoading && !error && summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Monthly Salary */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block text-[11px] text-slate-400 font-bold mb-1">
                  Monthly Salary
                </span>
                <span className="text-base sm:text-lg font-black text-white block">
                  {formatINR(summary.monthlySalary || 0)}
                </span>
              </div>
              {summary.isUsingCurrentSalary && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 italic">
                  <Info className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>Using current salary</span>
                </div>
              )}
            </div>

            {/* 2. Paid This Month */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex flex-col justify-between">
              <div>
                <span className="block text-[11px] text-emerald-400 font-bold mb-1">
                  Paid This Month
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-400 block">
                  {formatINR(summary.monthlyPaid || 0)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-500/80 mt-1.5 font-medium">
                {summary.completedPayments.length}{' '}
                {summary.completedPayments.length === 1 ? 'completed payment' : 'completed payments'}
              </span>
            </div>

            {/* 3. Remaining This Month */}
            <div
              className={`p-3 rounded-xl border flex flex-col justify-between ${
                summary.monthlyRemaining > 0
                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <span className="block text-[11px] text-rose-400 font-bold mb-1">
                  Remaining This Month
                </span>
                <span
                  className={`text-base sm:text-lg font-black block ${
                    summary.monthlyRemaining > 0 ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {formatINR(summary.monthlyRemaining || 0)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
                {summary.monthlyRemaining === 0 ? 'Fully cleared' : 'Due for month'}
              </span>
            </div>

            {/* 4. Payment Status */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block text-[11px] text-slate-400 font-bold mb-1.5">
                  Payment Status
                </span>
                <div className="pt-0.5">{getStatusBadge(summary.paymentStatus)}</div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 font-medium truncate">
                {summary.monthLabel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
