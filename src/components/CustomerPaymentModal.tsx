import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { UdhariEntry, CustomerPaymentRecord, ItemPaymentAllocation, Language } from '../types';
import { formatINR, getTodayDateString } from '../utils/formatters';
import { CustomerGroupData } from './CustomerFullDetailsModal';

interface CustomerPaymentModalProps {
  customer: CustomerGroupData;
  language: Language;
  onSavePayment: (
    payment: Omit<CustomerPaymentRecord, 'id' | 'created_at' | 'updated_at'>,
    allocatedItems: { itemId: string; amountPaid: number; isFullyPaid: boolean; newRemaining: number }[]
  ) => void;
  onClose: () => void;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  customer,
  language,
  onSavePayment,
  onClose,
}) => {
  const todayStr = getTodayDateString();

  const [paymentAmountInput, setPaymentAmountInput] = useState<string>(
    String(customer.totalOutstanding)
  );
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank' | 'Other'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto');

  // Manual allocation mapping: itemId -> allocatedAmount string
  const [manualAllocations, setManualAllocations] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    customer.pendingItems.forEach((item) => {
      init[item.id] = '';
    });
    return init;
  });

  const [confirmExcess, setConfirmExcess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const numPaymentAmount = parseFloat(paymentAmountInput) || 0;
  const isOverOutstanding = numPaymentAmount > customer.totalOutstanding && customer.totalOutstanding > 0;

  // Pending items sorted by oldest date first
  const sortedPendingItems = useMemo(() => {
    return [...customer.pendingItems].sort((a, b) => a.date.localeCompare(b.date));
  }, [customer.pendingItems]);

  // Compute auto allocation breakdown
  const autoAllocations = useMemo(() => {
    let unallocated = numPaymentAmount;
    const result: { item: UdhariEntry; allocated: number; remainingAfter: number }[] = [];

    for (const item of sortedPendingItems) {
      const itemCurrentRemaining = item.remainingAmount !== undefined ? item.remainingAmount : (item.amount - (item.paidAmount || 0));
      const allocated = Math.min(unallocated, itemCurrentRemaining);
      const remainingAfter = Math.max(0, itemCurrentRemaining - allocated);
      unallocated = Math.max(0, unallocated - allocated);

      result.push({
        item,
        allocated,
        remainingAfter,
      });
    }

    return result;
  }, [sortedPendingItems, numPaymentAmount]);

  // Sum of manual allocations
  const manualAllocatedTotal = useMemo(() => {
    return Object.values(manualAllocations).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  }, [manualAllocations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numPaymentAmount <= 0) {
      setErrorMessage(language === 'hi' ? 'कृपया मान्य भुगतान राशि दर्ज करें।' : 'Please enter a valid payment amount.');
      return;
    }

    if (isOverOutstanding && !confirmExcess) {
      setErrorMessage(
        language === 'hi'
          ? 'भुगतान राशि कुल बकाया से अधिक है। कृपया पुष्टि चेकबॉक्स चुनें।'
          : 'Payment amount exceeds outstanding balance. Please check the confirmation box.'
      );
      return;
    }

    // Allocation calculation
    let finalAllocations: { itemId: string; amountPaid: number; isFullyPaid: boolean; newRemaining: number }[] = [];
    let allocationDetails: ItemPaymentAllocation[] = [];

    if (allocationMode === 'auto') {
      finalAllocations = autoAllocations.map((a) => {
        const itemCurrentRemaining = a.item.remainingAmount !== undefined ? a.item.remainingAmount : (a.item.amount - (a.item.paidAmount || 0));
        const newRem = Math.max(0, itemCurrentRemaining - a.allocated);
        return {
          itemId: a.item.id,
          amountPaid: a.allocated,
          isFullyPaid: newRem === 0,
          newRemaining: newRem,
        };
      });

      allocationDetails = autoAllocations
        .filter((a) => a.allocated > 0)
        .map((a) => ({
          itemId: a.item.id,
          itemName: a.item.itemName,
          allocatedAmount: a.allocated,
          remainingItemBalance: a.remainingAfter,
        }));
    } else {
      // Manual validation: sum must match numPaymentAmount
      if (Math.abs(manualAllocatedTotal - numPaymentAmount) > 0.01) {
        setErrorMessage(
          language === 'hi'
            ? `सामानों में आवंटित कुल (₹${manualAllocatedTotal}) भुगतान राशि (₹${numPaymentAmount}) के बराबर होना चाहिए।`
            : `Manual allocation sum (₹${manualAllocatedTotal}) must equal total payment (₹${numPaymentAmount}).`
        );
        return;
      }

      finalAllocations = sortedPendingItems.map((item) => {
        const alloc = parseFloat(manualAllocations[item.id]) || 0;
        const itemCurrentRemaining = item.remainingAmount !== undefined ? item.remainingAmount : (item.amount - (item.paidAmount || 0));
        const newRem = Math.max(0, itemCurrentRemaining - alloc);
        return {
          itemId: item.id,
          amountPaid: alloc,
          isFullyPaid: newRem === 0,
          newRemaining: newRem,
        };
      });

      allocationDetails = sortedPendingItems
        .filter((item) => (parseFloat(manualAllocations[item.id]) || 0) > 0)
        .map((item) => {
          const alloc = parseFloat(manualAllocations[item.id]) || 0;
          const itemCurrentRemaining = item.remainingAmount !== undefined ? item.remainingAmount : (item.amount - (item.paidAmount || 0));
          return {
            itemId: item.id,
            itemName: item.itemName,
            allocatedAmount: alloc,
            remainingItemBalance: Math.max(0, itemCurrentRemaining - alloc),
          };
        });
    }

    const remainingBalanceAfter = Math.max(0, customer.totalOutstanding - numPaymentAmount);

    onSavePayment(
      {
        customer_id: customer.key,
        customerName: customer.name,
        payment_amount: numPaymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        note: note.trim() || undefined,
        allocation_details: allocationDetails,
        remaining_balance_after: remainingBalanceAfter,
      },
      finalAllocations
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {language === 'hi' ? 'उधार भुगतान दर्ज करें' : 'Record Customer Payment'}
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              {customer.name} <span className="text-xs text-slate-400 font-normal">({customer.phone})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Outstanding Info */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">
              {language === 'hi' ? 'कुल बकाया राशि' : 'Total Outstanding'}
            </span>
            <span className="text-lg font-black text-amber-400">{formatINR(customer.totalOutstanding)}</span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">
              {language === 'hi' ? 'बाकी सामान' : 'Pending Items'}
            </span>
            <span className="text-xs font-bold text-slate-200">{customer.pendingItems.length} {language === 'hi' ? 'आइटम' : 'items'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount Received Input */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1">
              {language === 'hi' ? 'प्राप्त भुगतान राशि (₹) *' : 'Amount Received (₹) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="0"
                value={paymentAmountInput}
                onChange={(e) => {
                  setPaymentAmountInput(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">{language === 'hi' ? 'त्वरित चयन:' : 'Quick Select:'}</span>
            <button
              type="button"
              onClick={() => setPaymentAmountInput(String(customer.totalOutstanding))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
            >
              {language === 'hi' ? 'पूरा बकाया' : 'Full Amount'} ({formatINR(customer.totalOutstanding)})
            </button>
            {customer.totalOutstanding > 200 && (
              <button
                type="button"
                onClick={() => setPaymentAmountInput(String(Math.round(customer.totalOutstanding / 2)))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
              >
                50% ({formatINR(Math.round(customer.totalOutstanding / 2))})
              </button>
            )}
          </div>

          {/* Overpayment Confirmation */}
          {isOverOutstanding && (
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  {language === 'hi'
                    ? `दर्ज राशि (₹${numPaymentAmount}) कुल बकाया (${formatINR(customer.totalOutstanding)}) से अधिक है।`
                    : `Entered amount (₹${numPaymentAmount}) exceeds total outstanding (${formatINR(customer.totalOutstanding)}).`}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-amber-800/40 text-slate-200">
                <input
                  type="checkbox"
                  checked={confirmExcess}
                  onChange={(e) => setConfirmExcess(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span>
                  {language === 'hi'
                    ? 'हाँ, इस अतिरिक्त राशि को अग्रिम क्रेडिट के रूप में सुरक्षित करें।'
                    : 'Yes, explicitly confirm payment above outstanding.'}
                </span>
              </label>
            </div>
          )}

          {/* Item Allocation Mode Selector (Requirement 10) */}
          {customer.pendingItems.length > 1 && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <label className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                {language === 'hi' ? 'सामान अनुसार भुगतान आवंटन (Item Allocation)' : 'Item Payment Allocation'}
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAllocationMode('auto')}
                  className={`p-2.5 rounded-xl border text-left space-y-0.5 transition-all ${
                    allocationMode === 'auto'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-emerald-400 text-xs font-bold">
                    {language === 'hi' ? 'विकल्प A: पुराने सामान पहले' : 'Option A: Oldest First'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {language === 'hi' ? 'स्वचालित FIFO आवंटन' : 'Automatic FIFO allocation'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAllocationMode('manual')}
                  className={`p-2.5 rounded-xl border text-left space-y-0.5 transition-all ${
                    allocationMode === 'manual'
                      ? 'bg-purple-950/50 border-purple-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block text-purple-400 text-xs font-bold">
                    {language === 'hi' ? 'विकल्प B: मैन्युअल आवंटन' : 'Option B: Manual Selection'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {language === 'hi' ? 'प्रत्येक सामान की राशि खुद तय करें' : 'Assign specific amount per item'}
                  </span>
                </button>
              </div>

              {/* Manual Selection Item Input List */}
              {allocationMode === 'manual' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{language === 'hi' ? 'सामान व शेष बकाया' : 'Item & Balance'}</span>
                    <span>
                      {language === 'hi' ? 'आवंटित:' : 'Allocated:'}{' '}
                      <strong className={manualAllocatedTotal === numPaymentAmount ? 'text-emerald-400' : 'text-amber-400'}>
                        ₹{manualAllocatedTotal}
                      </strong>{' '}
                      / ₹{numPaymentAmount}
                    </span>
                  </div>

                  {sortedPendingItems.map((item) => {
                    const itemRemaining = item.remainingAmount !== undefined ? item.remainingAmount : (item.amount - (item.paidAmount || 0));
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white truncate block">{item.itemName}</span>
                          <span className="text-[10px] text-slate-400">
                            {language === 'hi' ? 'शेष बकाया:' : 'Remaining:'} {formatINR(itemRemaining)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max={itemRemaining}
                            placeholder="0"
                            value={manualAllocations[item.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setManualAllocations((prev) => ({
                                ...prev,
                                [item.id]: val,
                              }));
                            }}
                            className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-purple-500 text-right"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Payment Date & Method (Requirement 8) */}
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
                <option value="Bank">Bank Transfer / Cheque</option>
                <option value="Other">Other / अन्य</option>
              </select>
            </div>
          </div>

          {/* Reference Number & Note (Requirement 8) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {language === 'hi' ? 'रेफरेंस / UPI ID (वैकल्पिक)' : 'Reference Number (Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. UPI-129381928"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {language === 'hi' ? 'टिप्पणी (वैकल्पिक)' : 'Note / Remarks (Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in cash at counter"
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
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'hi' ? 'भुगतान दर्ज करें' : 'Save Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
