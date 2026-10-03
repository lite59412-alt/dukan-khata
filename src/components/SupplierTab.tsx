import React, { useState, useMemo } from 'react';
import {
  Truck,
  PlusCircle,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Share2,
  CreditCard,
  Eye,
  EyeOff,
  Search,
  Check,
  Package,
  Plus,
  Filter,
  FileText,
  Clock,
} from 'lucide-react';
import { SupplierDueEntry, Language, ShopSettings, SupplierPayment } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString, generateSupplierPurchaseListWhatsAppText } from '../utils/formatters';
import { SupplierPurchaseModal } from './SupplierPurchaseModal';

interface SupplierTabProps {
  supplierList: SupplierDueEntry[];
  supplierPayments?: SupplierPayment[];
  settings: ShopSettings;
  language: Language;
  onAddSupplierDue: (entry: Omit<SupplierDueEntry, 'id' | 'dueAmount' | 'status'>) => void;
  onRecordSupplierPayment: (
    paymentOrId: string | Omit<SupplierPayment, 'id' | 'created_at' | 'updated_at'>,
    paymentAmountArg?: number,
    paymentModeArg?: 'cash' | 'upi'
  ) => void;
  isGuest?: boolean;
}

export const SupplierTab: React.FC<SupplierTabProps> = ({
  supplierList,
  supplierPayments = [],
  settings,
  language,
  onAddSupplierDue,
  onRecordSupplierPayment,
  isGuest = false,
}) => {
  const t = translations[language] || translations.en;
  const todayStr = getTodayDateString();

  // Navigation State
  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'pending' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showAddPurchaseModal, setShowAddPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Expanded Sections in Supplier Detail View
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(true);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(true);
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState<Record<string, boolean>>({});

  // Payment History Filter State
  const [paymentFilter, setPaymentFilter] = useState<
    'all' | 'this_month' | 'prev_month' | 'cash' | 'upi' | 'bank' | 'other'
  >('all');

  // Payment Form State
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank' | 'other'>('upi');
  const [paymentRefNumber, setPaymentRefNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // 1. Group Bills by Supplier Account (Phone or Name)
  const groupedSuppliers = useMemo(() => {
    return supplierList.reduce((acc, entry) => {
      const cleanPhone = (entry.supplierPhone || '').replace(/[^0-9]/g, '');
      const key = cleanPhone ? `p_${cleanPhone}` : `n_${entry.supplierName.trim().toLowerCase()}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          id: entry.supplier_id || key,
          name: entry.supplierName,
          phone: entry.supplierPhone,
          bills: [] as SupplierDueEntry[],
        };
      }
      acc[key].bills.push(entry);
      return acc;
    }, {} as Record<string, { key: string; id: string; name: string; phone: string; bills: SupplierDueEntry[] }>);
  }, [supplierList]);

  // 2. Build Supplier Accounts with Payments and Totals
  const supplierAccounts = useMemo(() => {
    return Object.values(groupedSuppliers).map((sup) => {
      const cleanP = sup.phone.replace(/[^0-9]/g, '');
      const cleanN = sup.name.trim().toLowerCase();

      // Collect payments from global supplierPayments
      const fromGlobal = (supplierPayments || []).filter((p) => {
        const pClean = (p.supplierPhone || '').replace(/[^0-9]/g, '');
        const pName = (p.supplierName || '').trim().toLowerCase();
        return (cleanP && pClean === cleanP) || (cleanN && pName === cleanN);
      });

      // Collect payments from individual bills
      const fromBills = sup.bills.flatMap((b) => b.paymentHistory || b.payments || []);

      // De-duplicate payments by id
      const paymentMap = new Map<string, SupplierPayment>();
      for (const p of [...fromGlobal, ...fromBills]) {
        if (!paymentMap.has(p.id)) {
          paymentMap.set(p.id, p);
        }
      }
      const payments = Array.from(paymentMap.values());

      // Financial Totals
      const totalAmount = sup.bills.reduce((sum, b) => sum + (b.total_amount ?? b.amount ?? 0), 0);
      const totalPaid = payments.reduce((sum, p) => sum + (p.payment_amount ?? p.amount ?? 0), 0);
      const totalDue = Math.max(0, totalAmount - totalPaid);

      const totalItemsCount = sup.bills.reduce(
        (sum, b) => sum + (b.items && b.items.length > 0 ? b.items.length : 1),
        0
      );

      // Status
      let status: 'paid' | 'partially_paid' | 'pending' | 'overdue' = 'pending';
      const hasOverdue = sup.bills.some((b) => {
        const billDue = (b.dueAmount ?? b.remaining_amount ?? b.amount) > 0;
        return billDue && b.dueDate && b.dueDate < todayStr;
      });

      if (totalDue === 0) {
        status = 'paid';
      } else if (hasOverdue) {
        status = 'overdue';
      } else if (totalPaid > 0) {
        status = 'partially_paid';
      } else {
        status = 'pending';
      }

      return {
        ...sup,
        payments,
        totalAmount,
        totalPaid,
        totalDue,
        totalItemsCount,
        status,
      };
    });
  }, [groupedSuppliers, supplierPayments, todayStr]);

  // Overall Outstanding Due for the Header
  const grandTotalDue = useMemo(() => {
    return supplierAccounts.reduce((sum, s) => sum + s.totalDue, 0);
  }, [supplierAccounts]);

  // Filtered Suppliers for Main List
  const filteredSuppliers = useMemo(() => {
    return supplierAccounts.filter((sup) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sup.name.toLowerCase().includes(q) ||
        sup.phone.includes(q);

      if (!matchesSearch) return false;

      if (listFilter === 'pending') return sup.totalDue > 0;
      if (listFilter === 'paid') return sup.totalDue === 0;
      return true;
    });
  }, [supplierAccounts, searchQuery, listFilter]);

  // Selected Supplier Profile
  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierKey) return null;
    return supplierAccounts.find((s) => s.key === selectedSupplierKey) || null;
  }, [supplierAccounts, selectedSupplierKey]);

  // Toggle item expansion for a specific purchase bill
  const togglePurchaseExpand = (billId: string) => {
    setExpandedPurchaseIds((prev) => ({
      ...prev,
      [billId]: !prev[billId],
    }));
  };

  // Open Payment Modal
  const handleOpenPaymentModal = () => {
    if (!selectedSupplier) return;
    setPaymentAmountInput(String(selectedSupplier.totalDue));
    setPaymentDateInput(todayStr);
    setPaymentMethod('upi');
    setPaymentRefNumber('');
    setPaymentNote('');
    setShowPaymentModal(true);
  };

  // Save Supplier Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    const amountToPay = parseFloat(paymentAmountInput) || 0;
    if (amountToPay <= 0) return;

    onRecordSupplierPayment({
      supplier_id: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierPhone: selectedSupplier.phone,
      amount: amountToPay,
      payment_amount: amountToPay,
      payment_method: paymentMethod,
      paymentMode: paymentMethod === 'cash' ? 'cash' : 'upi',
      date: paymentDateInput,
      payment_date: paymentDateInput,
      reference_number: paymentRefNumber.trim() || undefined,
      note: paymentNote.trim() || undefined,
    });

    setShowPaymentModal(false);
  };

  // Send Supplier WhatsApp Summary
  const handleSendWhatsApp = () => {
    if (!selectedSupplier || selectedSupplier.bills.length === 0) return;

    if (isGuest) {
      alert(
        language === 'hi'
          ? 'टेस्ट मोड: सुरक्षा के लिए व्हाट्सएप संदेश भेजना अक्षम (disabled) है।'
          : 'Test mode: WhatsApp sending is disabled in Guest Mode.'
      );
      return;
    }

    const primaryBill = selectedSupplier.bills[0];
    const consolidatedEntry: SupplierDueEntry = {
      ...primaryBill,
      supplierName: selectedSupplier.name,
      supplierPhone: selectedSupplier.phone,
      amount: selectedSupplier.totalAmount,
      paidAmount: selectedSupplier.totalPaid,
      dueAmount: selectedSupplier.totalDue,
    };

    const text = generateSupplierPurchaseListWhatsAppText(
      consolidatedEntry,
      settings.shopName,
      language
    );
    const cleanPhone = selectedSupplier.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Previous Month Year-Month String (e.g. "2026-08")
  const prevMonthStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, []);

  const currentMonthStr = todayStr.slice(0, 7);

  // Compute Remaining Balance after each payment for selected supplier
  const paymentRunningBalances = useMemo(() => {
    if (!selectedSupplier) return new Map<string, number>();

    // Sort chronologically (oldest first)
    const sorted = [...selectedSupplier.payments].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const map = new Map<string, number>();
    let cumulativePaid = 0;
    for (const p of sorted) {
      cumulativePaid += (p.payment_amount ?? p.amount ?? 0);
      const remainingAfter = Math.max(0, selectedSupplier.totalAmount - cumulativePaid);
      map.set(p.id, p.remaining_supplier_balance ?? remainingAfter);
    }
    return map;
  }, [selectedSupplier]);

  // Filtered Payments for Selected Supplier
  const filteredPayments = useMemo(() => {
    if (!selectedSupplier) return [];

    let list = [...selectedSupplier.payments];

    // Filter
    if (paymentFilter === 'this_month') {
      list = list.filter((p) => p.date.startsWith(currentMonthStr));
    } else if (paymentFilter === 'prev_month') {
      list = list.filter((p) => p.date.startsWith(prevMonthStr));
    } else if (paymentFilter === 'cash') {
      list = list.filter((p) => (p.payment_method || p.paymentMode)?.toLowerCase() === 'cash');
    } else if (paymentFilter === 'upi') {
      list = list.filter((p) => (p.payment_method || p.paymentMode)?.toLowerCase() === 'upi');
    } else if (paymentFilter === 'bank') {
      list = list.filter((p) => (p.payment_method || p.paymentMode)?.toLowerCase() === 'bank');
    } else if (paymentFilter === 'other') {
      list = list.filter((p) => (p.payment_method || p.paymentMode)?.toLowerCase() === 'other');
    }

    // Newest first
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedSupplier, paymentFilter, currentMonthStr, prevMonthStr]);

  // Existing suppliers list for auto-suggestions in New Bill Modal
  const existingSuppliersList = useMemo(() => {
    return supplierAccounts.map((s) => ({
      name: s.name,
      phone: s.phone,
    }));
  }, [supplierAccounts]);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {selectedSupplier ? (
        /* ========================================================================= */
        /* VIEW 2: SUPPLIER DETAIL SCREEN                                            */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedSupplierKey(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.common.back}</span>
            </button>

            <span className="text-xs font-semibold text-slate-400">
              {language === 'hi' ? 'सप्लायर खाता विवरण' : 'Supplier Account Profile'}
            </span>
          </div>

          {/* Supplier Profile Card & Clean Summary */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">
                    {selectedSupplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">
                      {selectedSupplier.name}
                    </h2>
                    <a
                      href={`tel:${selectedSupplier.phone}`}
                      className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedSupplier.phone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedSupplier.status === 'paid'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                    : selectedSupplier.status === 'partially_paid'
                    ? 'bg-orange-950/60 border border-orange-500/40 text-orange-400'
                    : selectedSupplier.status === 'overdue'
                    ? 'bg-rose-950/60 border border-rose-500/40 text-rose-400'
                    : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                }`}
              >
                {selectedSupplier.status === 'paid'
                  ? t.common.paid
                  : selectedSupplier.status === 'partially_paid'
                  ? language === 'hi'
                    ? 'आंशिक भुगतान'
                    : 'Partially Paid'
                  : selectedSupplier.status === 'overdue'
                  ? language === 'hi'
                    ? 'अतिदेय'
                    : 'Overdue'
                  : t.supplier.pending}
              </span>
            </div>

            {/* 4 Clean Summary Stat Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  {language === 'hi' ? 'कुल खरीद' : 'Total Purchased'}
                </span>
                <span className="text-sm font-bold text-white">
                  {formatINR(selectedSupplier.totalAmount)}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">
                  {language === 'hi' ? 'कुल भुगतान' : 'Total Paid'}
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatINR(selectedSupplier.totalPaid)}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                selectedSupplier.totalDue > 0
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                <span className="block text-[10px] text-amber-400 font-semibold mb-0.5">
                  {language === 'hi' ? 'शेष देनदारी' : 'Remaining Due'}
                </span>
                <span className="text-sm font-extrabold">
                  {formatINR(selectedSupplier.totalDue)}
                </span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  {language === 'hi' ? 'कुल बिल' : 'Purchases'}
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedSupplier.bills.length} {language === 'hi' ? 'बिल' : 'bills'}
                </span>
              </div>
            </div>

            {/* 3 Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
              {/* + Add New Purchase */}
              <button
                id="btn-supplier-add-new-purchase"
                onClick={() => setShowAddPurchaseModal(true)}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Purchase</span>
              </button>

              {/* + Add Payment */}
              <button
                id="btn-supplier-add-payment"
                onClick={handleOpenPaymentModal}
                disabled={selectedSupplier.totalDue === 0}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  selectedSupplier.totalDue === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>+ Add Payment</span>
              </button>

              {/* Send Full List on WhatsApp */}
              <button
                id="btn-supplier-whatsapp"
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'व्हाट्सएप पर भेजें' : 'Send WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Section 1: Purchase History */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <button
              onClick={() => setIsPurchaseHistoryOpen(!isPurchaseHistoryOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/90 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'खरीद इतिहास (Purchase History)' : 'Purchase History'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold border border-slate-700">
                  {selectedSupplier.bills.length}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isPurchaseHistoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPurchaseHistoryOpen && (
              <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80">
                {selectedSupplier.bills.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    {language === 'hi' ? 'कोई खरीद बिल उपलब्ध नहीं है' : 'No purchase bills available'}
                  </p>
                ) : (
                  selectedSupplier.bills.map((bill) => {
                    const billTotal = bill.total_amount ?? bill.amount ?? 0;
                    const billPaid = bill.paid_amount ?? bill.paidAmount ?? 0;
                    const billRemaining = Math.max(0, bill.remaining_amount ?? bill.dueAmount ?? (billTotal - billPaid));
                    const isBillSettled = billRemaining === 0;
                    const isExpanded = !!expandedPurchaseIds[bill.id];
                    const items = bill.item_list || bill.items || [];

                    return (
                      <div
                        key={bill.id}
                        className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/90 space-y-3"
                      >
                        {/* Summary Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {formatDate(bill.purchase_date || bill.date, language)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isBillSettled
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                    : billPaid > 0
                                    ? 'bg-orange-950/60 text-orange-400 border border-orange-500/30'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {isBillSettled
                                  ? t.common.paid
                                  : billPaid > 0
                                  ? language === 'hi'
                                    ? 'आंशिक'
                                    : 'Partially Paid'
                                  : t.supplier.pending}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {bill.itemPurchased || (items.length > 0 ? items[0].itemName : 'Wholesale Goods')}
                              {items.length > 1 && ` (+${items.length - 1} items)`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                            <div>
                              <span className="text-xs text-slate-400 block">
                                {language === 'hi' ? 'बिल' : 'Total'}: <span className="font-bold text-white">{formatINR(billTotal)}</span>
                              </span>
                              <span className="text-xs block">
                                {language === 'hi' ? 'बाकी' : 'Remaining'}:{' '}
                                <span className={`font-bold ${isBillSettled ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {formatINR(billRemaining)}
                                </span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePurchaseExpand(bill.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{language === 'hi' ? 'सामान छिपाएं' : 'Hide Items'}</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{language === 'hi' ? 'सामान देखें' : 'Show Items'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Meta: Due Date & Note */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          {bill.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{t.common.dueDate}: {formatDate(bill.dueDate, language)}</span>
                            </span>
                          )}
                          {bill.note && (
                            <span className="italic text-slate-400">
                              "{bill.note}"
                            </span>
                          )}
                        </div>

                        {/* Expanded Item Breakdown Table */}
                        {isExpanded && (
                          <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                              {language === 'hi' ? 'सामान सूची' : 'Items List'} ({items.length || 1})
                            </span>

                            {items.length === 0 ? (
                              <div className="p-2.5 rounded-lg bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
                                <span>{bill.itemPurchased || 'Wholesale Goods'}</span>
                                <span className="font-bold text-white">{formatINR(billTotal)}</span>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {items.map((item, idx) => {
                                  const itemTotal = item.totalAmount ?? ((item.price || 0) * (typeof item.quantity === 'number' ? item.quantity : 1));
                                  return (
                                    <div
                                      key={item.id || idx}
                                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <span className="font-bold text-white block">
                                          {item.itemName}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          {item.quantity} {item.unit || ''} • {formatINR(item.price || 0)}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-bold text-white block">
                                          {formatINR(itemTotal)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Collapsible Section 2: Payment History */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
            <button
              onClick={() => setIsPaymentHistoryOpen(!isPaymentHistoryOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-900/90 hover:bg-slate-850 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'भुगतान इतिहास (Payment History)' : 'Payment History'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                  {selectedSupplier.payments.length}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isPaymentHistoryOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPaymentHistoryOpen && (
              <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80">
                {/* Payment History Filter Bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {[
                    { id: 'all', label: language === 'hi' ? 'सभी' : 'All' },
                    { id: 'this_month', label: language === 'hi' ? 'इस महीने' : 'This Month' },
                    { id: 'prev_month', label: language === 'hi' ? 'पिछले महीने' : 'Previous Month' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'upi', label: 'UPI' },
                    { id: 'bank', label: 'Bank' },
                    { id: 'other', label: 'Other' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      type="button"
                      onClick={() => setPaymentFilter(filterTab.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                        paymentFilter === filterTab.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                {/* Payment List */}
                {filteredPayments.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                    {language === 'hi'
                      ? 'कोई भुगतान रिकॉर्ड नहीं मिला।'
                      : 'No payments found matching the selected filter.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPayments.map((payment) => {
                      const balanceAfter = paymentRunningBalances.get(payment.id);
                      const paymentMethodLabel = (payment.payment_method || payment.paymentMode || 'upi').toUpperCase();

                      return (
                        <div
                          key={payment.id}
                          className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400 text-sm">
                                +{formatINR(payment.payment_amount ?? payment.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {paymentMethodLabel}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                              <span>{formatDate(payment.payment_date || payment.date, language)}</span>
                              {payment.reference_number && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-300">
                                    Ref: <span className="font-mono text-slate-200">{payment.reference_number}</span>
                                  </span>
                                </>
                              )}
                              {payment.purchase_id && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">
                                    Bill #{payment.purchase_id.slice(-6)}
                                  </span>
                                </>
                              )}
                            </div>

                            {payment.note && (
                              <p className="text-[11px] text-slate-400 italic mt-1">
                                "{payment.note}"
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                            {balanceAfter !== undefined && (
                              <div>
                                <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                                  {language === 'hi' ? 'शेष बाकी' : 'Remaining Balance'}
                                </span>
                                <span className="font-bold text-amber-400 text-xs">
                                  {formatINR(balanceAfter)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 1: SUPPLIER LIST SCREEN (Customer-First UI)                          */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Header & Prominent Add Button */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  {t.supplier.title}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'hi' ? 'कुल सप्लायर देनदारी:' : 'Total Supplier Due:'}{' '}
                <span className="text-amber-400 font-bold">{formatINR(grandTotalDue)}</span>
              </p>
            </div>

            <button
              id="btn-add-supplier-top"
              onClick={() => setShowAddPurchaseModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.supplier.newPurchaseBill}</span>
            </button>
          </div>

          {/* Search Bar & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={
                  language === 'hi'
                    ? 'सप्लायर का नाम या नंबर खोजें...'
                    : 'Search supplier name or phone...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {(['pending', 'paid', 'all'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setListFilter(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
                    listFilter === mode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mode === 'pending'
                    ? t.supplier.pending
                    : mode === 'paid'
                    ? t.common.paid
                    : t.common.all}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier List: Customer-First Clean Cards */}
          <div className="space-y-2.5">
            {filteredSuppliers.length === 0 ? (
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
                <Truck className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">
                  {language === 'hi' ? 'कोई सप्लायर रिकॉर्ड नहीं मिला' : 'No supplier entries found'}
                </p>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'नया खरीद बिल जोड़ने के लिए ऊपर बटन दबाएं'
                    : 'Tap the button above to add a new purchase bill'}
                </p>
              </div>
            ) : (
              filteredSuppliers.map((supplier) => {
                const isSettled = supplier.totalDue === 0;

                return (
                  <div
                    key={supplier.key}
                    onClick={() => {
                      setSelectedSupplierKey(supplier.key);
                    }}
                    className="bg-slate-900 hover:bg-slate-850 active:bg-slate-800 rounded-2xl p-3.5 border border-slate-800 shadow-sm cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Supplier Identity & Meta */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
                          isSettled
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {supplier.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {supplier.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{supplier.phone}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {supplier.bills.length} {language === 'hi' ? 'खरीद' : 'purchases'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount, Status Badge, Chevron Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-sm font-extrabold block ${
                            isSettled ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {formatINR(supplier.totalDue)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSettled ? 'text-emerald-500' : 'text-amber-400'
                          }`}
                        >
                          {isSettled ? t.common.paid : t.supplier.pending}
                        </span>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHARED MODALS                                                             */}
      {/* ========================================================================= */}

      {/* 1. MULTI-ITEM PURCHASE BILL MODAL (New Bill or New Purchase for Existing) */}
      {showAddPurchaseModal && (
        <SupplierPurchaseModal
          language={language}
          shopName={settings.shopName}
          existingSuppliers={existingSuppliersList}
          initialSupplierName={selectedSupplier?.name || ''}
          initialSupplierPhone={selectedSupplier?.phone || ''}
          initialSupplierId={selectedSupplier?.id}
          lockSupplier={!!selectedSupplier}
          onSave={(entry) => {
            onAddSupplierDue(entry);
            setShowAddPurchaseModal(false);
          }}
          onClose={() => setShowAddPurchaseModal(false)}
        />
      )}

      {/* 2. SUPPLIER PAYMENT RECORDING MODAL */}
      {showPaymentModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {language === 'hi' ? 'सप्लायर भुगतान' : 'Supplier Payment'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {t.supplier.addPayment}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5">
              {/* Supplier Info (Read-Only) */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {t.supplier.supplierName}
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm">
                      {selectedSupplier.name}
                    </span>
                    <span className="text-slate-400 text-xs ml-2">
                      ({selectedSupplier.phone})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      {language === 'hi' ? 'कुल बकाया:' : 'Total Due:'}
                    </span>
                    <span className="font-extrabold text-amber-400 text-sm">
                      {formatINR(selectedSupplier.totalDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount to Pay & Payment Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'hi' ? 'भुगतान राशि (₹) *' : 'Amount to Pay (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedSupplier.totalDue}
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t.common.date} *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Method: Cash, UPI, Bank, Other */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.common.paymentMode}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['upi', 'cash', 'bank', 'other'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold uppercase transition-all border ${
                        paymentMethod === method
                          ? method === 'cash'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : method === 'upi'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : method === 'bank'
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number (Optional) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'hi' ? 'रेफरेंस नंबर (वैकल्पिक)' : 'Reference Number (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / UTR / Cheque No."
                  value={paymentRefNumber}
                  onChange={(e) => setPaymentRefNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.common.note}
                </label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950/40 transition-transform active:scale-95"
                >
                  {language === 'hi' ? 'भुगतान सेव करें' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
