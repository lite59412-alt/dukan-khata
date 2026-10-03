import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Share2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Calendar,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Staff, StaffSalaryPayment } from '../types';
import { formatINR, getTodayDateString } from '../utils/formatters';

interface PayStaffModalProps {
  staff: Staff;
  currentSalary: number;
  totalPaid: number;
  remainingAmount: number;
  onSavePayment: (payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>) => void;
  onOpenEditPaymentDetails: () => void;
  onClose: () => void;
}

export const PayStaffModal: React.FC<PayStaffModalProps> = ({
  staff,
  currentSalary,
  totalPaid,
  remainingAmount,
  onSavePayment,
  onOpenEditPaymentDetails,
  onClose,
}) => {
  const todayStr = getTodayDateString();

  // Form State
  const defaultAmount = remainingAmount > 0 ? remainingAmount : currentSalary > 0 ? currentSalary : 0;
  const [amountInput, setAmountInput] = useState<string>(defaultAmount > 0 ? String(defaultAmount) : '');
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank' | 'Other'>(
    staff.upi_id || staff.qr_image_url ? 'UPI' : 'Cash'
  );
  const [note, setNote] = useState<string>('Staff Salary Payment');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation Step State
  // Step 1: Payment Form
  // Step 2: "Did you complete the payment?" confirmation
  const [isConfirmingStep, setIsConfirmingStep] = useState<boolean>(false);
  const [pendingTxRef, setPendingTxRef] = useState<string>('');

  const numAmount = parseFloat(amountInput) || 0;
  const hasUpiId = Boolean(staff.upi_id && staff.upi_id.trim());
  const hasQr = Boolean(staff.qr_image_url && staff.qr_image_url.trim());
  const hasAnyPaymentDetails = hasUpiId || hasQr;

  // Generate generic UPI payment intent URL
  const generateUpiUrl = (txRef: string): string => {
    const pa = encodeURIComponent(staff.upi_id?.trim() || '');
    const pn = encodeURIComponent(staff.payment_name?.trim() || staff.name.trim());
    const am = encodeURIComponent(numAmount.toFixed(2));
    const cu = 'INR';
    const tn = encodeURIComponent(note.trim() || 'Staff Salary Payment');
    const tr = encodeURIComponent(txRef);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}&tr=${tr}`;
  };

  // Launch generic UPI payment intent
  const handleLaunchUpi = () => {
    if (numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }
    setErrorMessage(null);
    const txRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setPendingTxRef(txRef);

    const upiUrl = generateUpiUrl(txRef);

    // Open generic device UPI app chooser
    try {
      window.location.href = upiUrl;
    } catch (e) {
      console.warn('Could not launch UPI URL directly:', e);
    }

    // Switch to Step 2 confirmation
    setIsConfirmingStep(true);
  };

  // Record non-UPI payment or proceed to confirmation
  const handleProceedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }
    setErrorMessage(null);

    const txRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setPendingTxRef(txRef);

    if (paymentMethod === 'UPI' && hasUpiId) {
      handleLaunchUpi();
    } else {
      setIsConfirmingStep(true);
    }
  };

  // Final Action: Payment Completed
  const handleConfirmCompleted = () => {
    const finalAmount = Number(numAmount) || 0;
    const remainingAfter = Math.max(0, remainingAmount - finalAmount);

    onSavePayment({
      payment_id: `spay-${Date.now()}`,
      staff_id: staff.id,
      amount: finalAmount,
      paid_amount: finalAmount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      upi_id: paymentMethod === 'UPI' ? staff.upi_id : undefined,
      transaction_reference: pendingTxRef,
      note: note.trim() || undefined,
      status: 'Completed',
      remaining_balance_after: remainingAfter,
    });

    onClose();
  };

  // Final Action: Payment Failed
  const handleConfirmFailed = () => {
    onSavePayment({
      payment_id: `spay-${Date.now()}`,
      staff_id: staff.id,
      amount: numAmount,
      paid_amount: 0,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      upi_id: paymentMethod === 'UPI' ? staff.upi_id : undefined,
      transaction_reference: pendingTxRef,
      note: `${note.trim()} (Failed)`.trim(),
      status: 'Payment Failed',
      remaining_balance_after: remainingAmount,
    });

    onClose();
  };

  // Final Action: Cancel
  const handleCancelPayment = () => {
    setIsConfirmingStep(false);
  };

  // Share QR Image
  const handleShareQr = async () => {
    if (!staff.qr_image_url) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${staff.name} - UPI QR Code`,
          text: `Scan & Pay with any UPI app for ${staff.name}${staff.upi_id ? ` (UPI: ${staff.upi_id})` : ''}`,
          url: staff.qr_image_url,
        });
      } else {
        navigator.clipboard.writeText(staff.upi_id || '');
        alert('UPI ID copied to clipboard!');
      }
    } catch (e) {
      console.warn('Share not completed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-5 space-y-4 my-auto max-h-[94vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Pay Staff</h3>
              <p className="text-xs text-slate-400">{staff.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 2: PAYMENT CONFIRMATION SCREEN */}
        {isConfirmingStep ? (
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">Did you complete the payment?</h4>
              <p className="text-xs text-slate-400">
                Staff: <strong className="text-white">{staff.name}</strong> • Amount:{' '}
                <strong className="text-emerald-400">{formatINR(numAmount)}</strong> via{' '}
                <span className="font-semibold text-slate-200">{paymentMethod}</span>
              </p>
            </div>

            {/* Warning requirement */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Please verify your UPI app or bank notification before marking payment completed.</span>
            </div>

            {/* 3 Explicit Confirmation Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-confirm-payment-completed"
                onClick={handleConfirmCompleted}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.99] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Payment Completed</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-confirm-payment-failed"
                  onClick={handleConfirmFailed}
                  className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Payment Failed</span>
                </button>

                <button
                  type="button"
                  id="btn-confirm-payment-cancel"
                  onClick={handleCancelPayment}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 1: PAYMENT DETAILS & METHOD SELECTION */
          <form onSubmit={handleProceedPayment} className="space-y-4">
            {/* Quick Balance Overview */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">Salary</span>
                <span className="text-xs font-black text-white">{formatINR(currentSalary)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-emerald-400 font-bold uppercase mb-0.5">Total Paid</span>
                <span className="text-xs font-black text-emerald-400">{formatINR(totalPaid)}</span>
              </div>
              <div>
                <span className="block text-[10px] text-rose-400 font-bold uppercase mb-0.5">Remaining</span>
                <span className="text-xs font-black text-rose-400">{formatINR(remainingAmount)}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount to pay */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Amount to Pay (₹) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter amount"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Payment Method *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['UPI', 'Cash', 'Bank', 'Other'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                      paymentMethod === method
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Staff Payment Details Card (if UPI/QR) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Staff Payment Details</span>
                {hasAnyPaymentDetails ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEditPaymentDetails();
                    }}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    Edit Details
                  </button>
                ) : null}
              </div>

              {!hasAnyPaymentDetails ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">Payment details not added</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEditPaymentDetails();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Add Payment Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {hasUpiId && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">UPI ID</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">{staff.upi_id}</span>
                        {staff.payment_name && (
                          <span className="text-[10px] text-slate-400 block">Name: {staff.payment_name}</span>
                        )}
                      </div>
                      {paymentMethod === 'UPI' && (
                        <button
                          type="button"
                          onClick={handleLaunchUpi}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition-all"
                        >
                          Pay via UPI
                        </button>
                      )}
                    </div>
                  )}

                  {hasQr && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white text-xs block">Staff QR Code</span>
                          <span className="text-[10px] text-slate-400">Scan & Pay with any UPI app</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold text-xs border border-slate-700 transition-colors"
                      >
                        Show QR
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date & Optional Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Optional Note</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Advance, Bonus"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-proceed-pay-staff"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.99] cursor-pointer"
              >
                {paymentMethod === 'UPI' && hasUpiId ? (
                  <>
                    <span>Pay via UPI ({formatINR(numAmount)})</span>
                    <ExternalLink className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Proceed to Pay {formatINR(numAmount)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal: Fullscreen / Large QR Code Preview */}
        {showQrModal && staff.qr_image_url && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white">{staff.name}</h4>
                  <p className="text-[11px] text-slate-400">Payment QR Code</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Large Readable QR Image */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-md max-w-[240px] max-h-[240px] mx-auto overflow-hidden">
                <img
                  src={staff.qr_image_url}
                  alt={`${staff.name} Payment QR`}
                  className="w-full h-full object-contain mx-auto"
                />
              </div>

              {/* UPI ID below QR when available */}
              {hasUpiId && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">UPI ID</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs select-all">{staff.upi_id}</span>
                </div>
              )}

              {/* Tagline */}
              <p className="text-xs font-bold text-amber-300">Scan & Pay with any UPI app</p>

              {/* Actions: Share QR & Close */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareQr}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
