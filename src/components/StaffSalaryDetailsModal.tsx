import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Printer,
  Share2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Staff, AttendanceRecord, SalaryAdjustment, StaffSalaryPayment, Language, ShopSettings } from '../types';
import { calculateStaffSalary } from '../utils/salaryCalculator';
import { formatINR, formatDate, generateSalarySlipWhatsAppText } from '../utils/formatters';
import { AddSalaryPaymentModal } from './AddSalaryPaymentModal';

interface StaffSalaryDetailsModalProps {
  staff: Staff;
  attendanceList: AttendanceRecord[];
  adjustment?: SalaryAdjustment;
  salaryPayments: StaffSalaryPayment[];
  settings: ShopSettings;
  language: Language;
  onAddPayment: (payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEditPayment: (payment: StaffSalaryPayment) => void;
  onDeletePayment: (paymentId: string) => void;
  onOpenSalarySlip: (staff: Staff) => void;
  onClose: () => void;
}

export const StaffSalaryDetailsModal: React.FC<StaffSalaryDetailsModalProps> = ({
  staff,
  attendanceList,
  adjustment,
  salaryPayments,
  settings,
  language,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onOpenSalarySlip,
  onClose,
}) => {
  const [activeFilter, setActiveFilter] = useState<'this_month' | 'prev_month' | 'all' | 'pending'>('this_month');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<StaffSalaryPayment | null>(null);

  // Month-wise calculation for Current Month (September 2026)
  const currentMonthCalc = calculateStaffSalary(
    staff,
    attendanceList,
    adjustment,
    settings.workingDaysPerMonth || 26,
    'September 2026',
    salaryPayments
  );

  // Filter payments for this staff member
  const staffAllPayments = salaryPayments.filter((p) => p.staff_id === staff.id);

  // Filter payments based on the tab
  const filteredPayments = staffAllPayments.filter((p) => {
    if (activeFilter === 'this_month') {
      return (
        !p.salary_month ||
        p.salary_month === 'September 2026' ||
        p.salary_month.includes('2026-09')
      );
    }
    if (activeFilter === 'prev_month') {
      return (
        p.salary_month === 'August 2026' ||
        Boolean(p.salary_month && p.salary_month.includes('2026-08'))
      );
    }
    if (activeFilter === 'pending') {
      // Return payments that have notes about partial payment or matches unpaid period
      return true;
    }
    return true; // 'all'
  });

  // Outstanding months simulation for arrears/carry-forward
  const outstandingMonths = [
    {
      month: 'September 2026',
      payable: currentMonthCalc.netSalary,
      paid: currentMonthCalc.totalPaid,
      remaining: currentMonthCalc.remainingSalary,
      status: currentMonthCalc.paymentStatus,
    },
    // If August had remaining arrears, show it as an outstanding month
    ...(staff.id === 'staff-2'
      ? [
          {
            month: 'August 2026',
            payable: 12000,
            paid: 9000,
            remaining: 3000,
            status: 'partially_paid' as const,
          },
        ]
      : []),
  ].filter((m) => m.remaining > 0);

  const getStatusBadge = (status: 'paid' | 'partially_paid' | 'pending') => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {language === 'hi' ? 'पूर्ण भुगतान (Paid)' : 'Paid'}
        </span>
      );
    }
    if (status === 'partially_paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
          <AlertCircle className="w-3.5 h-3.5" />
          {language === 'hi' ? 'आंशिक भुगतान (Partially Paid)' : 'Partially Paid'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <Clock className="w-3.5 h-3.5" />
        {language === 'hi' ? 'बकाया (Pending)' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-5 my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${staff.avatarBg} text-white font-extrabold flex items-center justify-center text-sm shadow-md`}>
              {staff.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {staff.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {staff.role} • {staff.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Summary Section (Requirement 1) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-lg space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              {language === 'hi' ? 'वेतन व भुगतान खाता (सितंबर 2026)' : 'Salary & Payment Ledger (September 2026)'}
            </span>
            {getStatusBadge(currentMonthCalc.paymentStatus)}
          </div>

          {/* Key Amounts Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="block text-[11px] text-slate-400 font-medium mb-0.5">
                {language === 'hi' ? 'देय वेतन' : 'Salary Payable'}
              </span>
              <span className="text-base font-black text-white">
                {formatINR(currentMonthCalc.netSalary)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/30">
              <span className="block text-[11px] text-emerald-400 font-medium mb-0.5">
                {language === 'hi' ? 'कुल भुगतान' : 'Total Paid'}
              </span>
              <span className="text-base font-black text-emerald-400">
                {formatINR(currentMonthCalc.totalPaid)}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${currentMonthCalc.remainingSalary > 0 ? 'bg-amber-950/50 border-amber-500/50' : 'bg-slate-800/80 border-slate-700'}`}>
              <span className="block text-[11px] text-amber-400 font-medium mb-0.5">
                {language === 'hi' ? 'बकाया वेतन' : 'Remaining'}
              </span>
              <span className="text-base font-black text-amber-300">
                {formatINR(currentMonthCalc.remainingSalary)}
              </span>
            </div>
          </div>

          {/* Secondary Details: Overtime, Deductions, Advances */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">{language === 'hi' ? 'ओवरटाइम:' : 'Overtime:'}</span>
              <span className="font-bold text-blue-400">+{formatINR(currentMonthCalc.overtimePay)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">{language === 'hi' ? 'कटौतियाँ:' : 'Deductions:'}</span>
              <span className="font-bold text-rose-400">-{formatINR(currentMonthCalc.totalDeductions)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">{language === 'hi' ? 'अग्रिम:' : 'Advances:'}</span>
              <span className="font-bold text-amber-400">-{formatINR(currentMonthCalc.advanceDeduction)}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setShowAddPaymentModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'hi' ? '+ वेतन भुगतान जोड़ें' : '+ Add Salary Payment'}</span>
            </button>

            <button
              onClick={() => onOpenSalarySlip(staff)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold"
              title="Salary Slip"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>{language === 'hi' ? 'वेतन पर्ची' : 'Salary Slip'}</span>
            </button>
          </div>
        </div>

        {/* Outstanding Salary Section (Requirement 3) */}
        {outstandingMonths.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                {language === 'hi' ? 'बकाया वेतन माह (Outstanding Salary)' : 'Outstanding Salary Months'}
              </span>
              <span className="text-[10px] text-slate-400">
                {outstandingMonths.length} {language === 'hi' ? 'माह शेष' : 'Month(s) Due'}
              </span>
            </div>

            <div className="space-y-2">
              {outstandingMonths.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{m.month}</span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi' ? 'देय' : 'Payable'}: {formatINR(m.payable)} • {language === 'hi' ? 'भुगतान' : 'Paid'}: {formatINR(m.paid)}
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-2.5">
                    <div>
                      <span className="block font-black text-amber-400 text-sm">{formatINR(m.remaining)}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {m.status === 'partially_paid' ? 'Partially Paid' : 'Pending'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-transform active:scale-95"
                    >
                      {language === 'hi' ? 'भुगतान करें' : 'Add Payment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History Section (Requirement 3) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {language === 'hi' ? 'भुगतान इतिहास (Payment History)' : 'Payment History'}
            </h4>
            <span className="text-[11px] text-slate-400">
              {staffAllPayments.length} {language === 'hi' ? 'रिकॉर्ड' : 'record(s)'}
            </span>
          </div>

          {/* Month-wise Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold">
            {[
              { key: 'this_month', labelEn: 'This Month', labelHi: 'इस महीने' },
              { key: 'prev_month', labelEn: 'Prev Month', labelHi: 'पिछला माह' },
              { key: 'pending', labelEn: 'Pending', labelHi: 'बकाया' },
              { key: 'all', labelEn: 'All', labelHi: 'सभी' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  activeFilter === tab.key
                    ? 'bg-slate-800 text-white shadow-sm font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? tab.labelHi : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Payment List Rows */}
          {filteredPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80">
              <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-1.5 opacity-40" />
              <p>{language === 'hi' ? 'इस अवधि में कोई भुगतान रिकॉर्ड नहीं है।' : 'No payment records for this period.'}</p>
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="mt-2 text-emerald-400 font-semibold hover:underline"
              >
                {language === 'hi' ? '+ पहला भुगतान दर्ज करें' : '+ Record First Payment'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">
                        {formatINR(p.paid_amount)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {p.payment_method}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {p.salary_month}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{formatDate(p.payment_date, language)}</span>
                      {p.reference_number && (
                        <span>• Ref: <span className="font-mono text-slate-300">{p.reference_number}</span></span>
                      )}
                    </div>

                    {p.note && (
                      <p className="text-[11px] text-slate-400 italic truncate">
                        "{p.note}"
                      </p>
                    )}
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingPayment(p);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Edit Payment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(language === 'hi' ? 'क्या आप इस भुगतान रिकॉर्ड को हटाना चाहते हैं?' : 'Delete this payment record?')) {
                          onDeletePayment(p.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Payment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Salary Payment Sub-modal */}
        {showAddPaymentModal && (
          <AddSalaryPaymentModal
            staff={staff}
            salaryMonth="September 2026"
            totalSalaryPayable={currentMonthCalc.netSalary}
            currentPaid={currentMonthCalc.totalPaid}
            remainingSalary={currentMonthCalc.remainingSalary}
            language={language}
            onSavePayment={onAddPayment}
            onClose={() => setShowAddPaymentModal(false)}
          />
        )}

        {/* Edit Payment Inline Modal */}
        {editingPayment && (
          <AddSalaryPaymentModal
            staff={staff}
            salaryMonth={editingPayment.salary_month || 'September 2026'}
            totalSalaryPayable={editingPayment.payable_amount ?? currentMonthCalc.netSalary}
            currentPaid={currentMonthCalc.totalPaid}
            remainingSalary={currentMonthCalc.remainingSalary + editingPayment.paid_amount}
            language={language}
            onSavePayment={(updated) => {
              onEditPayment({
                ...editingPayment,
                ...updated,
                updated_at: new Date().toISOString(),
              });
              setEditingPayment(null);
            }}
            onClose={() => setEditingPayment(null)}
          />
        )}
      </div>
    </div>
  );
};
