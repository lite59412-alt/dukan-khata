import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  Plus,
  ArrowRight,
  TrendingDown,
  Phone,
  Layers,
} from 'lucide-react';
import { UdhariEntry, CustomerPaymentRecord, Language, ShopSettings, CustomerTimelineEvent } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

export interface CustomerGroupData {
  key: string;
  name: string;
  phone: string;
  items: UdhariEntry[];
  pendingItems: UdhariEntry[];
  paidItems: UdhariEntry[];
  totalOutstanding: number;
  totalPaid: number;
  totalAmount: number;
  hasOverdue: boolean;
  hasDueToday: boolean;
  status: 'paid' | 'partially_paid' | 'pending' | 'overdue';
}

interface CustomerFullDetailsModalProps {
  customer: CustomerGroupData;
  payments: CustomerPaymentRecord[];
  settings: ShopSettings;
  language: Language;
  onOpenAddPayment: () => void;
  onClose: () => void;
}

export const CustomerFullDetailsModal: React.FC<CustomerFullDetailsModalProps> = ({
  customer,
  payments,
  settings,
  language,
  onOpenAddPayment,
  onClose,
}) => {
  const [showItems, setShowItems] = useState(false);

  // Filter payments for this customer
  const customerPaymentsList = payments
    .filter(
      (p) =>
        p.customer_id === customer.key ||
        p.customer_id === customer.phone ||
        (p.customerName && p.customerName.toLowerCase() === customer.name.toLowerCase())
    )
    .sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  // Determine earliest due date from pending items
  const pendingDueDates = customer.pendingItems
    .map((i) => i.dueDate)
    .filter(Boolean)
    .sort();
  const earliestDueDate = pendingDueDates[0] || customer.items[0]?.dueDate || 'N/A';

  // Build Transaction Timeline events (Requirement 9)
  const timelineEvents: CustomerTimelineEvent[] = [];

  // 1. Initial creation / items added
  customer.items.forEach((item) => {
    timelineEvents.push({
      id: `item-${item.id}`,
      type: 'item_added',
      title: `${item.itemName} (${item.quantity})`,
      description: `Original Udhari: ${formatINR(item.amount)} • Due: ${formatDate(item.dueDate, language)}`,
      date: item.date,
      amount: item.amount,
    });
  });

  // 2. Payments received
  customerPaymentsList.forEach((p) => {
    timelineEvents.push({
      id: `pay-${p.id}`,
      type: 'payment_received',
      title: `${language === 'hi' ? 'भुगतान प्राप्त हुआ' : 'Payment Received'}: ${formatINR(p.payment_amount)}`,
      description: `${p.payment_method}${p.reference_number ? ` (Ref: ${p.reference_number})` : ''}${p.note ? ` • "${p.note}"` : ''}${p.remaining_balance_after !== undefined ? ` • Remaining: ${formatINR(p.remaining_balance_after)}` : ''}`,
      date: p.payment_date,
      amount: p.payment_amount,
    });
  });

  // 3. Paid in full event if remaining === 0
  if (customer.totalOutstanding === 0 && customer.totalAmount > 0) {
    const latestDate = customerPaymentsList[0]?.payment_date || customer.paidItems[0]?.paidDate || '2026-09-20';
    timelineEvents.push({
      id: 'paid-full',
      type: 'paid_in_full',
      title: language === 'hi' ? 'पूरा उधार चुकता हुआ (Paid in Full)' : 'Full Payment Completed',
      description: language === 'hi' ? 'खाता शून्य बकाया के साथ पूर्ण हुआ' : 'All balance cleared to zero',
      date: latestDate,
    });
  }

  // Sort timeline chronologically (newest first for readability)
  timelineEvents.sort((a, b) => b.date.localeCompare(a.date));

  const getStatusBadge = () => {
    if (customer.totalOutstanding === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {language === 'hi' ? 'पूर्ण चुकता (Paid)' : 'Paid'}
        </span>
      );
    }
    if (customer.totalPaid > 0 && customer.totalOutstanding > 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
          {language === 'hi' ? 'आंशिक भुगतान (Partially Paid)' : 'Partially Paid'}
        </span>
      );
    }
    if (customer.hasOverdue) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          {language === 'hi' ? 'अतिदेय (Overdue)' : 'Overdue'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        {language === 'hi' ? 'बकाया (Pending)' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-md">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {customer.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-slate-500" />
                {customer.phone}
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

        {/* 1. SUMMARY SECTION (Requirement 7 & 9) */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {language === 'hi' ? 'खाता सारांश' : 'Customer Account Summary'}
            </span>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                {language === 'hi' ? 'कुल उधार' : 'Total Udhari'}
              </span>
              <span className="text-sm sm:text-base font-black text-white">
                {formatINR(customer.totalAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">
                {language === 'hi' ? 'प्राप्त राशि' : 'Received'}
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400">
                {formatINR(customer.totalPaid)}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border ${customer.totalOutstanding > 0 ? 'bg-amber-950/50 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
              <span className="block text-[10px] text-amber-400 font-semibold mb-0.5">
                {language === 'hi' ? 'शेष बकाया' : 'Remaining'}
              </span>
              <span className="text-sm sm:text-base font-black text-amber-300">
                {formatINR(customer.totalOutstanding)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-300">
            <div>
              <span className="text-slate-400">{language === 'hi' ? 'अंतिम देय तारीख:' : 'Due Date:'} </span>
              <span className="font-bold text-white">{formatDate(earliestDueDate, language)}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {customer.pendingItems.length} {language === 'hi' ? 'सामान बाकी' : 'pending'} • {customer.paidItems.length} {language === 'hi' ? 'चुकता' : 'paid'}
            </div>
          </div>

          {/* Add Payment CTA Button */}
          {customer.totalOutstanding > 0 && (
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAddPayment();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'hi' ? '+ भुगतान दर्ज करें (Add Payment)' : '+ Add Payment'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. ITEM LIST: Collapsed by Default with Show Items / Hide Items (Requirement 9 & 10) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {language === 'hi' ? 'सामान सूची (Item List)' : 'Items Breakdown'}
              </h4>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-bold">
                {customer.items.length}
              </span>
            </div>

            <button
              onClick={() => setShowItems(!showItems)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <span>{showItems ? (language === 'hi' ? 'सामान छुपाएं' : 'Hide Items') : (language === 'hi' ? 'सामान देखें' : 'Show Items')}</span>
              {showItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showItems && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {customer.items.map((item) => {
                const itemPaid = item.paidAmount || (item.isPaid ? item.amount : 0);
                const itemRemaining = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, item.amount - itemPaid);

                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">
                        {item.itemName} <span className="text-[11px] text-slate-400 font-normal">({item.quantity})</span>
                      </span>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{language === 'hi' ? 'मूल मूल्य' : 'Original'}: {formatINR(item.amount)}</span>
                        <span>•</span>
                        <span>{language === 'hi' ? 'प्राप्त' : 'Recd'}: {formatINR(itemPaid)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {language === 'hi' ? 'देय तारीख:' : 'Due:'} {formatDate(item.dueDate, language)}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      <div>
                        <span className="block text-[10px] text-slate-400">{language === 'hi' ? 'सामान शेष' : 'Remaining'}</span>
                        <span className={`font-black text-sm ${itemRemaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatINR(itemRemaining)}
                        </span>
                      </div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        item.isPaid
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : itemRemaining < item.amount && itemRemaining > 0
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.isPaid ? 'PAID' : itemRemaining < item.amount ? 'PARTIAL' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. PAYMENT HISTORY (Requirement 9) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'hi' ? 'भुगतान इतिहास (Payment History)' : 'Payment History'}</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {customerPaymentsList.length} {language === 'hi' ? 'भुगतान' : 'payments'}
            </span>
          </div>

          {customerPaymentsList.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
              {language === 'hi' ? 'अभी तक कोई भुगतान रिकॉर्ड नहीं है।' : 'No payment records yet.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {customerPaymentsList.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {formatINR(p.payment_amount)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                        {p.payment_method}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(p.payment_date, language)}
                      </span>
                    </div>

                    {p.reference_number && (
                      <p className="text-[10px] text-slate-400">
                        Ref: <span className="font-mono text-slate-300">{p.reference_number}</span>
                      </p>
                    )}

                    {p.note && (
                      <p className="text-[10px] text-slate-400 italic truncate">
                        "{p.note}"
                      </p>
                    )}
                  </div>

                  {p.remaining_balance_after !== undefined && (
                    <div className="text-right shrink-0">
                      <span className="block text-[10px] text-slate-500 font-medium">After Pay</span>
                      <span className="text-xs font-bold text-slate-300">
                        {formatINR(p.remaining_balance_after)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. TRANSACTION TIMELINE (Requirement 9) */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'hi' ? 'लेन-देन समयरेखा (Transaction Timeline)' : 'Transaction Timeline'}</span>
          </h4>

          <div className="relative pl-4 space-y-3.5 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {timelineEvents.map((ev) => (
              <div key={ev.id} className="relative text-xs pl-2">
                <span
                  className={`absolute -left-3 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-slate-900 ${
                    ev.type === 'paid_in_full'
                      ? 'bg-emerald-400'
                      : ev.type === 'payment_received'
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                  }`}
                />
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px]">{ev.title}</span>
                    <span className="text-[10px] text-slate-500">{formatDate(ev.date, language)}</span>
                  </div>
                  {ev.description && (
                    <p className="text-[10px] text-slate-400">{ev.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
