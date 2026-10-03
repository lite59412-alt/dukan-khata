import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Staff, StaffSalaryPayment, Language } from '../types';
import { formatINR, getTodayDateString } from '../utils/formatters';

interface AddSalaryPaymentModalProps {
  staff: Staff;
  salaryMonth: string;
  totalSalaryPayable: number;
  currentPaid: number;
  remainingSalary: number;
  language: Language;
  onSavePayment: (payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

export const AddSalaryPaymentModal: React.FC<AddSalaryPaymentModalProps> = ({
  staff,
  salaryMonth,
  totalSalaryPayable,
  currentPaid,
  remainingSalary,
  language,
  onSavePayment,
  onClose,
}) => {
  const todayStr = getTodayDateString();

  const [selectedMonth, setSelectedMonth] = useState(salaryMonth || 'September 2026');
  const [amountInput, setAmountInput] = useState<string>(remainingSalary > 0 ? String(remainingSalary) : '');
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank' | 'Other'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [confirmExcess, setConfirmExcess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const numAmount = parseFloat(amountInput) || 0;
  const isOverRemaining = numAmount > remainingSalary && remainingSalary > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया मान्य राशि दर्ज करें' : 'Please enter a valid amount');
      return;
    }

    if (isOverRemaining && !confirmExcess) {
      setErrorMessage(
        language === 'hi'
          ? 'भुगतान राशि बकाया से अधिक है। कृपया पुष्टि बॉक्स चेक करें।'
          : 'Payment amount exceeds remaining salary. Please confirm to proceed.'
      );
      return;
    }

    onSavePayment({
      staff_id: staff.id,
      salary_month: selectedMonth,
      payable_amount: totalSalaryPayable,
      paid_amount: numAmount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-5 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {language === 'hi' ? 'वेतन भुगतान दर्ज करें' : 'Record Salary Payment'}
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              {staff.name} <span className="text-xs text-slate-400 font-normal">({staff.role})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Snapshot Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">
              {language === 'hi' ? 'वेतन माह:' : 'Salary Month:'}
            </span>
            <span className="font-bold text-white">{selectedMonth}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-medium">
                {language === 'hi' ? 'कुल देय' : 'Payable'}
              </span>
              <span className="text-xs font-bold text-white">{formatINR(totalSalaryPayable)}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <span className="block text-[10px] text-emerald-400 font-medium">
                {language === 'hi' ? 'कुल भुगतान' : 'Paid'}
              </span>
              <span className="text-xs font-bold text-emerald-300">{formatINR(currentPaid)}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
              <span className="block text-[10px] text-amber-400 font-medium">
                {language === 'hi' ? 'बकाया वेतन' : 'Remaining'}
              </span>
              <span className="text-xs font-bold text-amber-300">{formatINR(remainingSalary)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount Paid Input */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1">
              {language === 'hi' ? 'भुगतान राशि (₹) *' : 'Amount Paid (₹) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="0"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick settlement chips */}
          {remainingSalary > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">
                {language === 'hi' ? 'तुरंत चुनें:' : 'Quick Select:'}
              </span>
              <button
                type="button"
                onClick={() => setAmountInput(String(remainingSalary))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
              >
                {language === 'hi' ? 'पूरा बकाया' : 'Full Balance'} ({formatINR(remainingSalary)})
              </button>
              {remainingSalary > 2000 && (
                <button
                  type="button"
                  onClick={() => setAmountInput(String(Math.round(remainingSalary / 2)))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                >
                  50% ({formatINR(Math.round(remainingSalary / 2))})
                </button>
              )}
            </div>
          )}

          {/* Excess warning & confirmation */}
          {isOverRemaining && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  {language === 'hi'
                    ? `दर्ज राशि (₹${numAmount}) बकाया राशि (${formatINR(remainingSalary)}) से अधिक है।`
                    : `Amount (₹${numAmount}) exceeds current remaining balance (${formatINR(remainingSalary)}).`}
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer pt-1 border-t border-amber-800/40">
                <input
                  type="checkbox"
                  checked={confirmExcess}
                  onChange={(e) => setConfirmExcess(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>
                  {language === 'hi'
                    ? 'हाँ, इस अतिरिक्त राशि को वेतन समायोजन/अग्रिम के रूप में दर्ज करें।'
                    : 'Yes, explicitly confirm this payment as an adjustment.'}
                </span>
              </label>
            </div>
          )}

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'hi' ? 'भुगतान तारीख' : 'Payment Date'}
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'hi' ? 'भुगतान माध्यम' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash (नकद)</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank">Bank Transfer / NEFT</option>
                <option value="Other">Other / अन्य</option>
              </select>
            </div>
          </div>

          {/* Reference Number (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {language === 'hi' ? 'रेफरेंस / UPI ट्रांजैक्शन ID (वैकल्पिक)' : 'Reference / UTR / UPI ID (Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-923847291 or Cheque #1029"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {language === 'hi' ? 'टिप्पणी / विवरण (वैकल्पिक)' : 'Note / Remarks (Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. Part payment for first 15 days"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 font-semibold">{errorMessage}</p>
          )}

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'भुगतान सुरक्षित करें' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
