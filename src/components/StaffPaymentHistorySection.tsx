import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { StaffSalaryPayment } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { normalizeStaffPayment, parsePaymentDate } from '../utils/staffMonthlyPayment';

interface StaffPaymentHistorySectionProps {
  staffId: string;
  payments: StaffSalaryPayment[];
  selectedYear?: number;
  selectedMonth?: number; // 1-12
  selectedMonthLabel?: string;
}

export const StaffPaymentHistorySection: React.FC<StaffPaymentHistorySectionProps> = ({
  staffId,
  payments,
  selectedYear,
  selectedMonth,
  selectedMonthLabel,
}) => {
  const [filterMode, setFilterMode] = useState<'month' | 'all'>('month');

  // Normalize all payments for this staff member
  const allStaffPayments = payments
    .map(normalizeStaffPayment)
    .filter((p) => p.staff_id === staffId)
    .sort((a, b) => {
      const timeA = (parsePaymentDate(a.payment_date) || new Date(0)).getTime();
      const timeB = (parsePaymentDate(b.payment_date) || new Date(0)).getTime();
      return timeB - timeA;
    });

  // Filter for selected month if in 'month' mode and month bounds provided
  const displayedPayments = allStaffPayments.filter((p) => {
    if (filterMode === 'all' || !selectedYear || !selectedMonth) {
      return true;
    }
    const pDate = parsePaymentDate(p.payment_date);
    if (!pDate) return false;
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
    const t = pDate.getTime();
    return t >= monthStart.getTime() && t < monthEnd.getTime();
  });

  return (
    <div
      id="section-payment-history"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Payment History</h3>
            <p className="text-[11px] text-slate-400">
              {filterMode === 'month' && selectedMonthLabel
                ? `Records for ${selectedMonthLabel}`
                : 'All recorded salary and wage disbursements'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedMonthLabel && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {selectedMonthLabel.split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allStaffPayments.length})
              </button>
            </div>
          )}

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {displayedPayments.length}{' '}
            {displayedPayments.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
      </div>

      {/* List */}
      {displayedPayments.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1.5">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-300">
            {filterMode === 'month' && selectedMonthLabel
              ? `No payment records in ${selectedMonthLabel}`
              : 'No payment records yet'}
          </p>
          <p className="text-[11px] text-slate-500">
            {filterMode === 'month' && allStaffPayments.length > 0 ? (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="text-blue-400 hover:underline font-semibold"
              >
                View all {allStaffPayments.length} records across all months
              </button>
            ) : (
              "Payments made via 'Pay Staff' will appear here chronologically."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayedPayments.map((p) => {
            const isCompleted = p.isCompleted;
            const isFailed = p.status.toLowerCase().includes('fail');
            const isCancelled = p.status.toLowerCase().includes('cancel');

            return (
              <div
                key={p.payment_id || p.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-colors space-y-2.5"
              >
                {/* Top line: Amount & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      {formatINR(p.amount || 0)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {p.payment_method || 'Cash'}
                    </span>
                  </div>

                  {/* Status */}
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </span>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" />
                      <span>Payment Failed</span>
                    </span>
                  ) : isCancelled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      <Clock className="w-3 h-3" />
                      <span>Payment Cancelled</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span>{p.status || 'Pending'}</span>
                    </span>
                  )}
                </div>

                {/* Grid info: Date, UPI ID used, Transaction Reference, Remaining Salary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>
                      Date:{' '}
                      <strong className="text-slate-200">
                        {formatDate(p.payment_date)}
                      </strong>
                    </span>
                  </div>

                  {p.remaining_balance_after !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span>
                        Remaining Balance:{' '}
                        <strong className="text-slate-200">
                          {formatINR(p.remaining_balance_after)}
                        </strong>
                      </span>
                    </div>
                  )}

                  {p.upi_id && (
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>
                        UPI:{' '}
                        <strong className="text-emerald-400">{p.upi_id}</strong>
                      </span>
                    </div>
                  )}

                  {p.transaction_reference && (
                    <div className="flex items-center gap-1.5 font-mono truncate">
                      <span>
                        Ref:{' '}
                        <strong className="text-slate-300">
                          {p.transaction_reference}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Optional Note */}
                {p.note && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="italic">{p.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
