import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  PlusCircle,
  MessageCircle,
  CheckCircle2,
  Phone,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Clock,
  Check,
  MoreVertical,
  Edit2,
  AlertCircle,
  History,
  Mic,
  Volume2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UdhariEntry, UdhariItem, Language, ShopSettings, PopularItem, CustomerPaymentRecord } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import { CustomerFullDetailsModal, CustomerGroupData } from './CustomerFullDetailsModal';
import { CustomerPaymentModal } from './CustomerPaymentModal';
import { VoiceUdhariModal } from './VoiceUdhariModal';
import { ParsedVoiceUdhari } from '../utils/voiceUdhariParser';

const POPULAR_ITEMS_STORAGE_KEY = 'dukankhata_popular_items_v1';

const INITIAL_POPULAR_ITEMS: PopularItem[] = [
  { id: 'pop-1', itemName: 'Aashirvaad Atta', defaultPrice: 420, unit: '10 kg', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'pop-2', itemName: 'Fortune Mustard Oil', defaultPrice: 340, unit: '2 litre', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'pop-3', itemName: 'Madhur Sugar', defaultPrice: 240, unit: '5 kg', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'pop-4', itemName: 'Basmati Rice', defaultPrice: 480, unit: '5 kg', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'pop-5', itemName: 'Tata Tea Gold', defaultPrice: 290, unit: '500 gm', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
  { id: 'pop-6', itemName: 'Surf Excel', defaultPrice: 280, unit: '2 kg', createdAt: '2026-09-01', updatedAt: '2026-09-01' },
];

function loadPopularItems(): PopularItem[] {
  try {
    const saved = localStorage.getItem(POPULAR_ITEMS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load popular items:', e);
  }
  return INITIAL_POPULAR_ITEMS;
}

function savePopularItems(items: PopularItem[]): void {
  try {
    localStorage.setItem(POPULAR_ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save popular items:', e);
  }
}

interface UdhariTabProps {
  udhariList: UdhariEntry[];
  customerPayments?: CustomerPaymentRecord[];
  settings: ShopSettings;
  language: Language;
  onAddUdhari: (entry: Omit<UdhariEntry, 'id' | 'isPaid'>) => void;
  onMarkPaid: (id: string, paymentMethod: 'cash' | 'upi') => void;
  onDeleteUdhari: (id: string) => void;
  onRecordCustomerPayment?: (
    payment: Omit<CustomerPaymentRecord, 'id' | 'created_at' | 'updated_at'>,
    allocatedItems: { itemId: string; amountPaid: number; isFullyPaid: boolean; newRemaining: number }[]
  ) => void;
  initialOpenModal?: boolean;
  isGuest?: boolean;
}

interface NewItemRow {
  itemName: string;
  quantity: string;
  unit?: string;
  price?: string;
  amount: string;
}

export const UdhariTab: React.FC<UdhariTabProps> = ({
  udhariList,
  customerPayments = [],
  settings,
  language,
  onAddUdhari,
  onMarkPaid,
  onDeleteUdhari,
  onRecordCustomerPayment,
  initialOpenModal = false,
  isGuest = false,
}) => {
  const t = translations[language];
  const todayStr = getTodayDateString();

  // Navigation inside Udhari Tab: List View vs Customer Detail View
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);

  // Filters: strictly "Pending", "Due Today", "Paid" as requested
  const [filter, setFilter] = useState<'pending' | 'due_today' | 'paid'>('pending');

  // Search only customer name and phone
  const [searchQuery, setSearchQuery] = useState('');
  const [customerTxSearchQuery, setCustomerTxSearchQuery] = useState('');

  // Track expanded state for individual transaction cards in customer profile
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(initialOpenModal);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [showAllocationPaymentModal, setShowAllocationPaymentModal] = useState(false);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');

  // Multi-item support in "+ New Udhari" modal
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [itemRows, setItemRows] = useState<NewItemRow[]>([
    { itemName: '', quantity: '1', unit: 'pcs', price: '', amount: '' },
  ]);

  // Voice Add Udhari state & missing fields tracker
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceRecognizedText, setVoiceRecognizedText] = useState<string | null>(null);
  const [voiceMissingFields, setVoiceMissingFields] = useState<('customer' | 'item' | 'amount' | 'quantity')[]>([]);

  // Popular Items state & CRUD
  const [popularItems, setPopularItems] = useState<PopularItem[]>(() => loadPopularItems());
  const [activePopularMenuId, setActivePopularMenuId] = useState<string | null>(null);
  const [showPopularModal, setShowPopularModal] = useState(false);
  const [editingPopularItem, setEditingPopularItem] = useState<PopularItem | null>(null);
  const [popularForm, setPopularForm] = useState({ itemName: '', defaultPrice: '', unit: '' });
  const [itemToDelete, setItemToDelete] = useState<PopularItem | null>(null);

  // Helper to select a popular item and add/populate current udhari item list
  const handleSelectPopularItem = (item: PopularItem) => {
    const defaultQty = '1';
    const defaultUnit = item.unit || 'pcs';
    const defaultPrice = String(item.defaultPrice);
    const defaultAmt = String(item.defaultPrice);

    setItemRows((prev) => {
      // If the first row is empty, fill it
      if (prev.length === 1 && !prev[0].itemName.trim() && !prev[0].amount.trim()) {
        return [{ itemName: item.itemName, quantity: defaultQty, unit: defaultUnit, price: defaultPrice, amount: defaultAmt }];
      }
      // Otherwise append to current list, preserving multiple items and existing entries
      return [...prev, { itemName: item.itemName, quantity: defaultQty, unit: defaultUnit, price: defaultPrice, amount: defaultAmt }];
    });
  };

  // Open modal to add a new popular item
  const handleOpenAddPopular = () => {
    setActivePopularMenuId(null);
    setEditingPopularItem(null);
    setPopularForm({ itemName: '', defaultPrice: '', unit: '' });
    setShowPopularModal(true);
  };

  // Open modal to edit an existing popular item
  const handleOpenEditPopular = (item: PopularItem) => {
    setActivePopularMenuId(null);
    setEditingPopularItem(item);
    setPopularForm({
      itemName: item.itemName,
      defaultPrice: String(item.defaultPrice),
      unit: item.unit || '',
    });
    setShowPopularModal(true);
  };

  // Save add/edit popular item
  const handleSavePopularItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = popularForm.itemName.trim();
    if (!trimmedName) return;
    const price = Math.max(0, parseFloat(popularForm.defaultPrice) || 0);
    const unitVal = popularForm.unit.trim() || undefined;

    if (editingPopularItem) {
      // Edit: updates preset only, does NOT touch old udhari records or payments
      const updated = popularItems.map((p) =>
        p.id === editingPopularItem.id
          ? {
              ...p,
              itemName: trimmedName,
              defaultPrice: price,
              unit: unitVal,
              updatedAt: todayStr,
            }
          : p
      );
      setPopularItems(updated);
      savePopularItems(updated);
    } else {
      // Add: creates new preset
      const newItem: PopularItem = {
        id: `pop-${Date.now()}`,
        itemName: trimmedName,
        defaultPrice: price,
        unit: unitVal,
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      const updated = [...popularItems, newItem];
      setPopularItems(updated);
      savePopularItems(updated);
    }

    setShowPopularModal(false);
    setEditingPopularItem(null);
  };

  // Confirm delete popular item
  const handleConfirmDeletePopular = () => {
    if (!itemToDelete) return;
    // Remove only from preset list; existing udhari entries and customer data remain untouched
    const updated = popularItems.filter((p) => p.id !== itemToDelete.id);
    setPopularItems(updated);
    savePopularItems(updated);
    setItemToDelete(null);
    setActivePopularMenuId(null);
  };

  // Group udhariList into Customer summaries
  const customerGroups: CustomerGroupData[] = useMemo(() => {
    const map = new Map<string, CustomerGroupData>();

    for (const item of udhariList) {
      // Key by clean phone if present, or lowercase name
      const cleanPhone = (item.customerPhone || '').replace(/[^0-9]/g, '');
      const key = cleanPhone ? `p_${cleanPhone}` : `n_${item.customerName.trim().toLowerCase()}`;

      let group = map.get(key);
      if (!group) {
        group = {
          key,
          name: item.customerName,
          phone: item.customerPhone,
          items: [],
          pendingItems: [],
          paidItems: [],
          totalOutstanding: 0,
          totalPaid: 0,
          totalAmount: 0,
          hasOverdue: false,
          hasDueToday: false,
          status: 'pending',
        };
        map.set(key, group);
      }

      group.items.push(item);
      group.totalAmount += item.amount;

      const itemRemaining = item.isPaid
        ? 0
        : item.remainingAmount !== undefined
        ? item.remainingAmount
        : Math.max(0, item.amount - (item.paidAmount || 0));

      const itemPaid = item.isPaid
        ? item.paidAmount || item.amount
        : item.paidAmount || Math.max(0, item.amount - itemRemaining);

      if (item.isPaid || itemRemaining === 0) {
        group.paidItems.push(item);
        group.totalPaid += itemPaid;
      } else {
        group.pendingItems.push(item);
        group.totalOutstanding += itemRemaining;
        group.totalPaid += itemPaid;

        if (item.dueDate === todayStr) {
          group.hasDueToday = true;
        } else if (item.dueDate < todayStr) {
          group.hasOverdue = true;
        }
      }
    }

    // Determine status for each customer (Pending, Partially Paid, Paid, Overdue)
    for (const group of map.values()) {
      if (group.totalOutstanding <= 0) {
        group.status = 'paid';
      } else if (group.totalPaid > 0) {
        group.status = 'partially_paid';
      } else if (group.hasOverdue) {
        group.status = 'overdue';
      } else {
        group.status = 'pending';
      }
    }

    return Array.from(map.values());
  }, [udhariList, todayStr]);

  // Total pending across all customers for compact header
  const grandTotalPending = useMemo(() => {
    return udhariList
      .filter((u) => !u.isPaid)
      .reduce((sum, u) => sum + u.amount, 0);
  }, [udhariList]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customerGroups.filter((c) => {
      // Filter tab check
      if (filter === 'pending') {
        if (c.totalOutstanding <= 0) return false;
      } else if (filter === 'due_today') {
        if (c.totalOutstanding <= 0 || !c.hasDueToday) return false;
      } else if (filter === 'paid') {
        if (c.totalOutstanding > 0) return false;
      }

      // Search check: Search customer name, phone number, and items
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanQ = q.replace(/[^0-9]/g, '');
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = cleanQ
          ? c.phone.replace(/[^0-9]/g, '').includes(cleanQ)
          : c.phone.includes(q);
        const matchesItem = c.items.some(
          (it) =>
            (it.itemName && it.itemName.toLowerCase().includes(q)) ||
            (it.items &&
              it.items.some(
                (sub) => sub.itemName && sub.itemName.toLowerCase().includes(q)
              ))
        );
        if (!matchesName && !matchesPhone && !matchesItem) return false;
      }

      return true;
    });
  }, [customerGroups, filter, searchQuery]);

  // Selected customer object for the Detail Screen
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerKey) return null;
    return customerGroups.find((c) => c.key === selectedCustomerKey) || null;
  }, [customerGroups, selectedCustomerKey]);

  // Filtered transactions for current selected customer
  const visibleCustomerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    if (!customerTxSearchQuery.trim()) return selectedCustomer.items;
    const q = customerTxSearchQuery.toLowerCase().trim();
    return selectedCustomer.items.filter((tx) => {
      const matchName = tx.itemName.toLowerCase().includes(q);
      const matchDate =
        (tx.transaction_date || tx.date || '').includes(q) ||
        (tx.due_date || tx.dueDate || '').includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchSub =
        tx.items && tx.items.some((it) => it.itemName.toLowerCase().includes(q));
      return matchName || matchDate || matchNote || matchSub;
    });
  }, [selectedCustomer, customerTxSearchQuery]);

  // Voice parser customer references (to avoid duplicate customers)
  const existingCustomersForVoice = useMemo(() => {
    return customerGroups.map((c) => ({
      key: c.key,
      name: c.name,
      phone: c.phone,
    }));
  }, [customerGroups]);

  const popularItemNamesForVoice = useMemo(() => {
    return popularItems.map((p) => p.itemName);
  }, [popularItems]);

  // Open "+ Add New Udhari" manually
  const handleOpenManualAddUdhari = () => {
    setVoiceRecognizedText(null);
    setVoiceMissingFields([]);
    setNewCustName('');
    setNewCustPhone('');
    setNewDueDate('');
    setNewNote('');
    setItemRows([{ itemName: '', quantity: '1', unit: 'pcs', price: '', amount: '' }]);
    setSelectedCustomerKey(null);
    setShowAddModal(true);
  };

  // Open "+ Add New Udhari" specifically for current selected customer
  const handleOpenAddUdhariForCurrentCustomer = () => {
    if (!selectedCustomer) return;
    setVoiceRecognizedText(null);
    setVoiceMissingFields([]);
    setNewCustName(selectedCustomer.name);
    setNewCustPhone(selectedCustomer.phone);
    setNewDueDate('');
    setNewNote('');
    setItemRows([{ itemName: '', quantity: '1', unit: 'pcs', price: '', amount: '' }]);
    setShowAddModal(true);
  };

  // Voice Command Recognized Callback: Pre-fills and opens form automatically
  const handleVoiceCommandRecognized = (parsed: ParsedVoiceUdhari) => {
    setShowVoiceModal(false);
    setVoiceRecognizedText(parsed.rawTranscript);
    setVoiceMissingFields(parsed.missingFields);

    // 1. Customer matching logic: Reuse existing customer matching to prevent duplicate customers
    if (parsed.matchedCustomer) {
      setNewCustName(parsed.matchedCustomer.name);
      setNewCustPhone(parsed.matchedCustomer.phone);
      setSelectedCustomerKey(parsed.matchedCustomer.key);
    } else if (parsed.customerName) {
      const q = parsed.customerName.toLowerCase().trim();
      const existing = customerGroups.find(
        (c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q)
      );
      if (existing) {
        setNewCustName(existing.name);
        setNewCustPhone(existing.phone);
        setSelectedCustomerKey(existing.key);
      } else {
        setNewCustName(parsed.customerName);
        setNewCustPhone('');
        setSelectedCustomerKey(null);
      }
    } else {
      setNewCustName('');
      setNewCustPhone('');
      setSelectedCustomerKey(null);
    }

    // 2. Pre-fill detected item, quantity, unit, and amount
    const finalItemName = parsed.itemName || '';
    const finalQty = parsed.quantity || '1';
    const finalUnit = parsed.unit || 'pcs';
    const finalPrice = parsed.price || '';
    const finalAmount = parsed.amount || '';

    setItemRows([
      {
        itemName: finalItemName,
        quantity: finalQty,
        unit: finalUnit,
        price: finalPrice,
        amount: finalAmount,
      },
    ]);

    // 6. Open the existing New Udhari form automatically
    setShowAddModal(true);
  };

  // Handle "+ New Udhari" submission with multi-item support as a discrete transaction
  const handleCreateNewUdhari = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustName = (selectedCustomer ? selectedCustomer.name : newCustName).trim();
    const finalCustPhone = (selectedCustomer ? selectedCustomer.phone : (newCustPhone.trim() || '9876500000')).trim();

    // Check missing fields for user feedback
    const missing: ('customer' | 'item' | 'amount' | 'quantity')[] = [];
    if (!finalCustName) missing.push('customer');

    // Filter valid rows that have itemName and a valid amount/price
    const validRows = itemRows.filter(
      (r) =>
        r.itemName.trim() &&
        (parseFloat(r.amount) > 0 ||
          (parseFloat(r.price || '0') > 0 && parseFloat(r.quantity || '0') > 0))
    );

    if (!itemRows.some((r) => r.itemName.trim())) {
      missing.push('item');
    }
    if (
      !itemRows.some(
        (r) =>
          parseFloat(r.amount) > 0 ||
          (parseFloat(r.price || '0') > 0 && parseFloat(r.quantity || '0') > 0)
      )
    ) {
      missing.push('amount');
    }

    if (missing.length > 0 || validRows.length === 0) {
      setVoiceMissingFields(missing);
      return;
    }

    let targetDueDate = newDueDate;
    if (!targetDueDate) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      targetDueDate = d.toISOString().split('T')[0];
    }

    const txId = `udh-${Date.now()}`;
    const cleanPhone = finalCustPhone.replace(/[^0-9]/g, '');
    const custId = selectedCustomer
      ? selectedCustomer.key
      : cleanPhone
      ? `p_${cleanPhone}`
      : `n_${finalCustName.toLowerCase()}`;

    const txItems: UdhariItem[] = validRows.map((r, idx) => {
      const qtyNum = parseFloat(r.quantity) || 1;
      const priceNum = parseFloat(r.price || '0') || 0;
      const amtNum = parseFloat(r.amount) || (priceNum * qtyNum) || 0;
      return {
        id: `item-${Date.now()}-${idx}`,
        itemName: r.itemName.trim(),
        quantity: r.quantity.trim() || '1',
        unit: r.unit?.trim() || undefined,
        price: priceNum > 0 ? priceNum : undefined,
        totalAmount: amtNum,
        paidAmount: 0,
        remainingAmount: amtNum,
        dueDate: targetDueDate,
        note: newNote.trim() || undefined,
      };
    });

    const totalTxAmount = txItems.reduce((acc, it) => acc + it.totalAmount, 0);
    const summaryItemName =
      txItems.length === 1
        ? txItems[0].itemName
        : `${txItems[0].itemName} + ${txItems.length - 1} more items`;

    onAddUdhari({
      customer_id: custId,
      transaction_id: txId,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      itemName: summaryItemName,
      quantity: txItems.length === 1 ? String(txItems[0].quantity) : `${txItems.length} items`,
      unit: txItems.length === 1 ? txItems[0].unit : undefined,
      price: txItems.length === 1 ? txItems[0].price : undefined,
      amount: totalTxAmount,
      total_amount: totalTxAmount,
      paidAmount: 0,
      paid_amount: 0,
      remainingAmount: totalTxAmount,
      remaining_amount: totalTxAmount,
      date: todayStr,
      transaction_date: todayStr,
      dueDate: targetDueDate,
      due_date: targetDueDate,
      note: newNote.trim(),
      items: txItems,
      item_list: txItems,
    });

    // Reset form
    if (!selectedCustomer) {
      setNewCustName('');
      setNewCustPhone('');
    }
    setNewDueDate('');
    setNewNote('');
    setItemRows([{ itemName: '', quantity: '1', unit: 'pcs', price: '', amount: '' }]);
    setVoiceRecognizedText(null);
    setVoiceMissingFields([]);
    setShowAddModal(false);
  };

  // Open Payment modal for the current selected customer
  const handleOpenPaymentModal = () => {
    if (!selectedCustomer) return;
    setPaymentAmountInput(String(selectedCustomer.totalOutstanding));
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  // Submit Payment (Supports Full & Partial Payment)
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amountToPay = parseFloat(paymentAmountInput) || 0;
    if (amountToPay <= 0) return;

    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Settle pending items FIFO (oldest first)
    let remainingPayment = amountToPay;
    const sortedPending = [...selectedCustomer.pendingItems].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    for (const item of sortedPending) {
      if (remainingPayment <= 0) break;

      if (remainingPayment >= item.amount) {
        // Fully covers this item
        onMarkPaid(item.id, paymentMethod);
        remainingPayment -= item.amount;
      } else {
        // Partial settlement of this item
        // Mark current item with paid part, and add remainder as balance item
        const unpaidRemainder = item.amount - remainingPayment;
        onMarkPaid(item.id, paymentMethod);
        onAddUdhari({
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          itemName: `${item.itemName} (${language === 'hi' ? 'बाकी शेष' : 'Remaining'})`,
          quantity: item.quantity,
          amount: unpaidRemainder,
          date: todayStr,
          dueDate: item.dueDate,
          note: item.note ? `${item.note} [Partial]` : 'Remaining after partial payment',
        });
        remainingPayment = 0;
      }
    }

    setShowPaymentModal(false);
  };

  // Generate Customer-level WhatsApp Reminder link
  const handleOpenWhatsAppReminder = () => {
    if (!selectedCustomer) return;

    if (isGuest) {
      alert(
        language === 'hi'
          ? 'टेस्ट मोड: सुरक्षा के लिए व्हाट्सएप संदेश भेजना अक्षम (disabled) है।'
          : 'Test mode: WhatsApp sending is disabled in Guest Mode.'
      );
      return;
    }

    const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsSummary = selectedCustomer.pendingItems
      .map((i) => `• ${i.itemName} (${i.quantity}) - ₹${i.amount}`)
      .join('\n');

    let text = '';
    if (language === 'hi') {
      text =
        `नमस्ते ${selectedCustomer.name} जी,\n\n` +
        `यह *${settings.shopName}* की तरफ से आपकी उधारी का विनम्र अनुस्मारक है।\n\n` +
        `*कुल बकाया रकम: ${formatINR(selectedCustomer.totalOutstanding)}*\n\n` +
        (itemsSummary ? `सामान विवरण:\n${itemsSummary}\n\n` : '') +
        `कृपया इस UPI ID पर भुगतान करें:\n*UPI ID: ${settings.upiId}*\n\n` +
        `धन्यवाद!\n${settings.shopName}`;
    } else {
      text =
        `Hello ${selectedCustomer.name},\n\n` +
        `This is a polite reminder from *${settings.shopName}* regarding your pending dues.\n\n` +
        `*Total Outstanding Amount: ${formatINR(selectedCustomer.totalOutstanding)}*\n\n` +
        (itemsSummary ? `Items:\n${itemsSummary}\n\n` : '') +
        `Please pay via UPI to:\n*UPI ID: ${settings.upiId}*\n\n` +
        `Thank you!\n${settings.shopName}`;
    }

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // =========================================================================
  // UNIFIED VIEW: CUSTOMER DETAIL SCREEN or UDHARI LIST SCREEN
  // =========================================================================
  const isOverdue = selectedCustomer?.status === 'overdue';
  const isPaid = selectedCustomer?.status === 'paid';

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {selectedCustomer ? (
        <div className="space-y-4">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            id="btn-back-to-udhari-list"
            onClick={() => {
              setSelectedCustomerKey(null);
              setCustomerTxSearchQuery('');
              setExpandedTxIds({});
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'उधारी सूची' : 'Udhari Khata'}</span>
          </button>

          {/* Status Pill */}
          {isPaid ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {language === 'hi' ? 'पूर्ण भुगतान (Paid)' : 'Paid'}
            </span>
          ) : isOverdue ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'तारीख निकली (Overdue)' : 'Overdue'}</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {language === 'hi' ? 'देय (Due)' : 'Due'}
            </span>
          )}
        </div>

        {/* Customer Header Card: Partial Payment Ledger (Requirements 7 & 9) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {selectedCustomer.name}
              </h2>
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 mt-1 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{selectedCustomer.phone}</span>
              </a>
            </div>

            {/* Payment Status Badge */}
            <div>
              {selectedCustomer.status === 'paid' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {language === 'hi' ? 'पूर्ण भुगतान (Paid)' : 'Paid'}
                </span>
              ) : selectedCustomer.status === 'partially_paid' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {language === 'hi' ? 'आंशिक भुगतान (Partially Paid)' : 'Partially Paid'}
                </span>
              ) : selectedCustomer.status === 'overdue' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'तारीख निकली (Overdue)' : 'Overdue'}</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {language === 'hi' ? 'लंबित (Pending)' : 'Pending'}
                </span>
              )}
            </div>
          </div>

          {/* Ledger Numbers: Total Udhari, Received, Remaining */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                {language === 'hi' ? 'कुल उधारी' : 'Total Udhari'}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatINR(selectedCustomer.totalAmount)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
              <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">
                {language === 'hi' ? 'जमा रकम' : 'Received'}
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {formatINR(selectedCustomer.totalPaid)}
              </span>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              selectedCustomer.totalOutstanding > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400'
                : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-semibold mb-0.5">
                {language === 'hi' ? 'शेष बाकी' : 'Remaining'}
              </span>
              <span className="text-sm font-black">
                {formatINR(selectedCustomer.totalOutstanding)}
              </span>
            </div>
          </div>

          {/* Pending and Paid Items Count */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              {selectedCustomer.pendingItems.length}{' '}
              {selectedCustomer.pendingItems.length === 1 ? 'item pending' : 'items pending'}
            </span>
            <span>
              {selectedCustomer.paidItems.length}{' '}
              {selectedCustomer.paidItems.length === 1 ? 'item paid' : 'items paid'}
            </span>
          </div>

          {/* View Full Details Button (Requirement 9) */}
          <button
            id="btn-view-full-details"
            onClick={() => setShowFullDetailsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>{language === 'hi' ? 'ग्राहक का पूरा विवरण देखें' : 'View Full Details'}</span>
          </button>

          {/* Action Buttons: + Add New Udhari, + Add Payment, WhatsApp Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
            {/* + Add New Udhari (Requirement 1) */}
            <div className="flex gap-1.5">
              <button
                id="btn-add-extra-udhari"
                onClick={handleOpenAddUdhariForCurrentCustomer}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Udhari</span>
              </button>
              {settings.voiceAddUdhariEnabled && (
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="px-3 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-950/40 transition-all active:scale-95"
                  title="Voice se Udhari Add Karein"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                </button>
              )}
            </div>

            {/* + Add Payment */}
            <button
              id="btn-add-payment-detail"
              onClick={() => setShowAllocationPaymentModal(true)}
              disabled={isPaid}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isPaid
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>+ Add Payment</span>
            </button>

            {/* WhatsApp Reminder */}
            <button
              id="btn-whatsapp-reminder-detail"
              onClick={handleOpenWhatsAppReminder}
              disabled={isPaid}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isPaid
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Reminder</span>
            </button>
          </div>

          {/* Secondary Action: Full Statement Details */}
          <button
            id="btn-view-full-details"
            onClick={() => setShowFullDetailsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'hi' ? 'ग्राहक का पूरा लेजर स्टेटमेंट देखें' : 'View Full Ledger Statement'}</span>
          </button>
        </div>

        {/* =========================================================================
            REQUIREMENT 2: UDHARI HISTORY WITH CLEAN EXPANDABLE TRANSACTION CARDS
           ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{language === 'hi' ? 'उधारी इतिहास' : 'Udhari History'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold lowercase">
                {selectedCustomer.items.length} {selectedCustomer.items.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </h3>
          </div>

          {/* Search inside customer transactions if 2 or more transactions */}
          {selectedCustomer.items.length >= 2 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerTxSearchQuery}
                onChange={(e) => setCustomerTxSearchQuery(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'लेनदेन खोजें (सामान, तारीख, नोट)...'
                    : 'Search transactions (Item, date, note)...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-sm"
              />
              {customerTxSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCustomerTxSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {visibleCustomerTransactions.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
              <p>No transactions matching "{customerTxSearchQuery}"</p>
              <button
                type="button"
                onClick={() => setCustomerTxSearchQuery('')}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            visibleCustomerTransactions.map((tx) => {
            const txId = tx.transaction_id || tx.id;
            const isExpanded = !!expandedTxIds[txId];
            const txAmount = tx.total_amount ?? tx.amount;
            const txPaid = tx.paid_amount ?? (tx.isPaid ? txAmount : (tx.paidAmount || 0));
            const txRemaining = tx.remaining_amount ?? (tx.isPaid ? 0 : (tx.remainingAmount ?? Math.max(0, txAmount - txPaid)));
            const isTxOverdue = txRemaining > 0 && (tx.due_date || tx.dueDate) < todayStr;
            const isTxPaid = txRemaining === 0 || tx.isPaid;
            const isTxPartial = txPaid > 0 && txRemaining > 0;

            return (
              <div
                key={txId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
              >
                {/* Collapsed Header - Always visible with key summary info */}
                <div
                  onClick={() => setExpandedTxIds((prev) => ({ ...prev, [txId]: !prev[txId] }))}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatDate(tx.transaction_date || tx.date, language)}
                      </span>

                      {/* Status Badge */}
                      {isTxPaid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {language === 'hi' ? 'पूर्ण जमा' : 'Paid'}
                        </span>
                      ) : isTxOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {language === 'hi' ? 'तारीख निकली' : 'Overdue'}
                        </span>
                      ) : isTxPartial ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {language === 'hi' ? 'आंशिक' : 'Partially Paid'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {language === 'hi' ? 'लंबित' : 'Pending'}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {tx.items && tx.items.length > 0
                          ? `${tx.items.length} ${tx.items.length === 1 ? 'item' : 'items'}`
                          : tx.itemName}
                      </span>
                    </div>

                    {/* Default visible metrics: Total, Paid, Remaining, Due Date */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-0.5">
                      <div>
                        Total: <strong className="text-white font-bold">{formatINR(txAmount)}</strong>
                      </div>
                      <div>
                        Paid: <strong className="text-emerald-400 font-bold">{formatINR(txPaid)}</strong>
                      </div>
                      <div>
                        Remaining: <strong className={txRemaining > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{formatINR(txRemaining)}</strong>
                      </div>
                      <div>
                        Due: <strong className={isTxOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>{formatDate(tx.due_date || tx.dueDate, language)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Show Items / Hide Items toggle button & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTxIds((prev) => ({ ...prev, [txId]: !prev[txId] }));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-[11px] font-bold text-slate-200 border border-slate-700 transition-all active:scale-95"
                    >
                      <span>{isExpanded ? 'Hide Items' : 'Show Items'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Items List */}
                {isExpanded && (
                  <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      {language === 'hi' ? 'सामान का विवरण' : 'Transaction Items List'}
                    </div>

                    <div className="space-y-1.5">
                      {(tx.items && tx.items.length > 0 ? tx.items : [{
                        id: tx.id,
                        itemName: tx.itemName,
                        quantity: tx.quantity,
                        unit: tx.unit,
                        price: tx.price,
                        totalAmount: txAmount,
                        paidAmount: txPaid,
                        remainingAmount: txRemaining,
                        dueDate: tx.due_date || tx.dueDate,
                        note: tx.note,
                      }]).map((it, idx) => {
                        const itemPaid = it.paidAmount || 0;
                        const itemRem = it.remainingAmount ?? Math.max(0, it.totalAmount - itemPaid);

                        return (
                          <div
                            key={it.id || idx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-white text-xs">{it.itemName}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Qty: <span className="text-slate-300 font-semibold">{it.quantity}{it.unit ? ` ${it.unit}` : ''}</span>
                                  {it.price ? ` @ ${formatINR(it.price)}` : ''}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-black text-white text-xs">{formatINR(it.totalAmount)}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Paid: <span className="text-emerald-400 font-bold">{formatINR(itemPaid)}</span> | Rem: <span className="text-rose-400 font-bold">{formatINR(itemRem)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                              <span>Due: {formatDate(it.dueDate || tx.due_date || tx.dueDate, language)}</span>
                              {it.note && <span className="italic text-slate-400">Note: {it.note}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {tx.note && (
                      <p className="text-[11px] text-slate-400 italic px-1">
                        Note: {tx.note}
                      </p>
                    )}

                    {/* Transaction Quick Actions */}
                    <div className="flex items-center justify-between pt-2 px-1 text-xs border-t border-slate-850">
                      <button
                        onClick={() => onDeleteUdhari(tx.id)}
                        className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Transaction</span>
                      </button>

                      {!isTxPaid && (
                        <button
                          onClick={() => onMarkPaid(tx.id, 'cash')}
                          className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 font-bold transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Settle (Cash)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>

        {/* Payment History Summary */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {language === 'hi' ? 'भुगतान इतिहास (Payment History)' : 'Payment History Summary'}
            </h3>
            <span className="text-xs text-emerald-400 font-bold">
              {formatINR(selectedCustomer.totalPaid)} {language === 'hi' ? 'जमा' : 'Cleared'}
            </span>
          </div>

          {selectedCustomer.paidItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">
              {language === 'hi'
                ? 'अभी तक कोई भुगतान प्राप्त नहीं हुआ है'
                : 'No past payments recorded yet for this customer'}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedCustomer.paidItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-200">{p.itemName}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.paidDate ? formatDate(p.paidDate, language) : formatDate(p.date, language)}
                      {(p as any).paymentMethod ? ` • ${(p as any).paymentMethod === 'upi' ? '📱 UPI' : '💵 Cash'}` : ''}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-400">
                    +{formatINR(p.paidAmount || p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAYMENT MODAL (Supports Full & Partial) */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-base font-bold text-white">
                  {language === 'hi' ? 'रुपये जमा करें' : 'Record Payment'}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center py-1">
                <span className="text-xs text-slate-400 block">
                  {selectedCustomer.name} ({selectedCustomer.phone})
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  {language === 'hi' ? 'कुल बकाया रकम:' : 'Total Outstanding:'}
                </span>
                <span className="text-2xl font-black text-rose-400">
                  {formatINR(selectedCustomer.totalOutstanding)}
                </span>
              </div>

              <form onSubmit={handleConfirmPayment} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'hi'
                      ? 'जमा रकम (₹) - आंशिक या पूरा:'
                      : 'Payment Amount (₹) - Partial or Full:'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedCustomer.totalOutstanding}
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-black text-xl focus:outline-none focus:border-emerald-500"
                  />

                  {/* Real-time remaining balance display */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5 px-1">
                    <span>{language === 'hi' ? 'भुगतान बाद बाकी शेष:' : 'Remaining Balance:'}</span>
                    <span className="font-bold text-white">
                      {formatINR(
                        Math.max(
                          0,
                          selectedCustomer.totalOutstanding -
                            (parseFloat(paymentAmountInput) || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {language === 'hi' ? 'भुगतान माध्यम:' : 'Payment Method:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>💵 नकद (Cash)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        paymentMethod === 'upi'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span>📱 ऑनलाइन (UPI)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40"
                  >
                    {language === 'hi' ? 'भुगतान दर्ज करें' : 'Confirm Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Requirement 9: CUSTOMER FULL DETAILS MODAL */}
        {showFullDetailsModal && (
          <CustomerFullDetailsModal
            customer={selectedCustomer}
            payments={customerPayments}
            settings={settings}
            language={language}
            onClose={() => setShowFullDetailsModal(false)}
            onOpenAddPayment={() => {
              setShowFullDetailsModal(false);
              setShowAllocationPaymentModal(true);
            }}
          />
        )}

        {/* Requirements 8 & 10: CUSTOMER PAYMENT RECORDING MODAL WITH ITEM-LEVEL ALLOCATION */}
        {showAllocationPaymentModal && (
          <CustomerPaymentModal
            customer={selectedCustomer}
            language={language}
            onClose={() => setShowAllocationPaymentModal(false)}
            onSavePayment={(paymentData, allocatedItems) => {
              if (onRecordCustomerPayment) {
                onRecordCustomerPayment(paymentData, allocatedItems);
              }
              setShowAllocationPaymentModal(false);
            }}
          />
        )}
        </div>
      ) : (
        <div className="space-y-4">
        {/* 1. Header: "Udhari Khata" + Total pending amount (compact) + 2. Main Action: "+ New Udhari" */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'hi' ? 'उधारी खाता' : 'Udhari Khata'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'hi' ? 'कुल बाकी उधारी:' : 'Total Pending:'}{' '}
            <span className="text-rose-600 dark:text-rose-400 font-bold">{formatINR(grandTotalPending)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {settings.voiceAddUdhariEnabled && (
            <button
              id="btn-voice-add-udhari"
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-transform active:scale-95"
            >
              <Mic className="w-4 h-4 animate-pulse text-white" />
              <span>Voice se Udhari Add Karein</span>
            </button>
          )}

          <button
            id="btn-add-udhari-top"
            onClick={handleOpenManualAddUdhari}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Udhari</span>
          </button>
        </div>
      </div>

      {/* 3. Search: Customer name, phone number, and items */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="input-udhari-customer-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'hi'
              ? 'उधारी / ग्राहक खोजें (नाम, फ़ोन, सामान)...'
              : 'Search udhari / customer (Name, Phone, Item)...'
          }
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-full"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4. Filters: Strictly "Pending", "Due Today", "Paid" */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
        {[
          { id: 'pending', label: language === 'hi' ? 'बाकी (Pending)' : 'Pending' },
          { id: 'due_today', label: language === 'hi' ? 'आज देय (Due Today)' : 'Due Today' },
          { id: 'paid', label: language === 'hi' ? 'चुकाया (Paid)' : 'Paid' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as 'pending' | 'due_today' | 'paid')}
              className={`py-2 rounded-lg transition-all text-center font-bold ${
                isActive
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 5. Customer-first list: Shows customer summary cards only */}
      <div className="space-y-2.5">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
              {searchQuery.trim()
                ? `No udhari or customer matching "${searchQuery}"`
                : language === 'hi'
                ? 'कोई ग्राहक रिकॉर्ड नहीं मिला'
                : 'No Customer Records Found'}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
              >
                Clear Search
              </button>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'नया उधारी जोड़ने के लिए ऊपर "+ New Udhari" पर क्लिक करें'
                  : 'Click "+ New Udhari" above to record a new entry'}
              </p>
            )}
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const isOverdue = cust.status === 'overdue';
            const isPaid = cust.status === 'paid';

            return (
              <div
                key={cust.key}
                id={`customer-card-${cust.key}`}
                onClick={() => {
                  setSelectedCustomerKey(cust.key);
                  setExpandedTxIds({}); // Collapsed by default as instructed
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Customer Name, Phone, Status Badge, Items count */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                      {cust.name}
                    </h3>

                    {/* Status badge: Due, Overdue, or Paid */}
                    {isPaid ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Paid
                      </span>
                    ) : isOverdue ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        Overdue
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                        Due
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{cust.phone}</span>
                    <span>•</span>
                    {/* Number of pending items */}
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {cust.pendingItems.length}{' '}
                      {cust.pendingItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                {/* Right: Total outstanding amount + Chevron Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-base font-black ${
                        isPaid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatINR(cust.totalOutstanding)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
        </div>
        </div>
      )}

      {/* NEW UDHARI MODAL (Supports Customer Info + Multi-Item Entry) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-base font-bold text-white">
                {selectedCustomer
                  ? language === 'hi'
                    ? `नई उधारी जोड़ें - ${selectedCustomer.name}`
                    : `+ Add New Udhari - ${selectedCustomer.name}`
                  : language === 'hi'
                  ? 'नई उधारी दर्ज करें'
                  : '+ New Udhari Entry'}
              </h3>
              <div className="flex items-center gap-1.5">
                {settings.voiceAddUdhariEnabled && (
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
                    title="Voice Add Udhari"
                  >
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                    <span className="hidden xs:inline">Voice</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setVoiceRecognizedText(null);
                    setVoiceMissingFields([]);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 8. Show the recognized text for confirmation */}
            {voiceRecognizedText && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Recognized Voice Command:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(true)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    <Mic className="w-3 h-3" />
                    <span>Re-speak</span>
                  </button>
                </div>
                <p className="text-xs font-semibold text-white bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  "{voiceRecognizedText}"
                </p>

                {voiceMissingFields.length > 0 ? (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {language === 'hi'
                        ? `कुछ जानकारी अधूरी है (${voiceMissingFields.join(', ')}). कृपया नीचे हाइलाइट किए गए फील्ड्स को भरें।`
                        : `Missing details (${voiceMissingFields.join(', ')}). Please complete the highlighted fields below before saving.`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold px-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {language === 'hi'
                        ? 'सभी विवरण पहचान लिए गए हैं। जांच कर "उधारी सेव करें" दबाएं।'
                        : 'All details detected. Review and tap "Save Udhari".'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Existing Customer Profile Banner */}
            {selectedCustomer && (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                    {language === 'hi' ? 'ग्राहक खाता (मौजूदा)' : 'Customer Profile (Existing)'}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    ({selectedCustomer.phone})
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  + New Udhari
                </span>
              </div>
            )}

            {/* Popular Items Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'hi' ? 'दुकान के लोकप्रिय सामान' : 'Popular Items'}
                </p>
                <button
                  type="button"
                  id="btn-add-popular-item"
                  onClick={handleOpenAddPopular}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Popular Item</span>
                </button>
              </div>

              {popularItems.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
                  {language === 'hi'
                    ? 'कोई लोकप्रिय सामान नहीं है। ऊपर "+ Add Popular Item" पर क्लिक करें।'
                    : 'No popular items saved. Tap "+ Add Popular Item" above.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {popularItems.map((item) => {
                    const isMenuOpen = activePopularMenuId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="relative flex items-center justify-between pl-2.5 pr-1 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 transition-all group shadow-sm"
                      >
                        {/* Clickable body: taps item to fill into current transaction */}
                        <button
                          type="button"
                          onClick={() => handleSelectPopularItem(item)}
                          className="flex-1 min-w-0 text-left pr-1 flex flex-col justify-center select-none"
                          title="Click to add to bill"
                        >
                          <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-rose-300 transition-colors">
                            {item.itemName} {item.unit ? <span className="text-[10px] text-slate-400 font-normal">({item.unit})</span> : ''}
                          </span>
                          <span className="text-xs font-black text-rose-400 leading-tight mt-0.5">
                            {formatINR(item.defaultPrice)}
                          </span>
                        </button>

                        {/* Three-dot menu button */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePopularMenuId(isMenuOpen ? null : item.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopularMenuId(null);
                                }}
                              />
                              <div
                                className="absolute right-0 top-full mt-1 w-28 bg-slate-850 rounded-xl shadow-2xl border border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPopular(item)}
                                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-750 hover:text-white flex items-center gap-1.5 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3 text-blue-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePopularMenuId(null);
                                    setItemToDelete(item);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleCreateNewUdhari} className="space-y-3.5">
              {/* Customer Name & Phone */}
              {!selectedCustomer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span>{t.udhari.customerName} *</span>
                      {voiceMissingFields.includes('customer') && !newCustName.trim() && (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>Required (अपेक्षित)</span>
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={newCustName}
                      onChange={(e) => {
                        setNewCustName(e.target.value);
                        if (e.target.value.trim()) {
                          setVoiceMissingFields((prev) => prev.filter((f) => f !== 'customer'));
                        }
                      }}
                      className={`w-full px-3.5 py-2 rounded-xl bg-slate-800 border text-white placeholder-slate-500 focus:outline-none text-xs transition-all ${
                        voiceMissingFields.includes('customer') && !newCustName.trim()
                          ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20'
                          : 'border-slate-700 focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {t.common.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                    />
                  </div>
                </div>
              ) : null}

              {/* Items Section: Multi-item support for the same customer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'hi' ? 'सामान विवरण (Items)' : 'Items Details'}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setItemRows((prev) => [
                        ...prev,
                        { itemName: '', quantity: '1', unit: 'pcs', price: '', amount: '' },
                      ])
                    }
                    className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {itemRows.map((row, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Item Name (e.g. Sugar / Milk / Dal)"
                          value={row.itemName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItemRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, itemName: val } : r))
                            );
                            if (val.trim()) {
                              setVoiceMissingFields((prev) => prev.filter((f) => f !== 'item'));
                            }
                          }}
                          className={`flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border text-white text-xs placeholder-slate-500 focus:outline-none transition-all ${
                            voiceMissingFields.includes('item') && !row.itemName.trim()
                              ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20'
                              : 'border-slate-700 focus:border-rose-500'
                          }`}
                        />
                        {itemRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItemRows((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            placeholder="1"
                            value={row.quantity}
                            onChange={(e) => {
                              const q = e.target.value;
                              setItemRows((prev) =>
                                prev.map((r, i) => {
                                  if (i !== idx) return r;
                                  const pr = parseFloat(r.price || '0');
                                  const calculatedAmt = pr > 0 && parseFloat(q) > 0 ? String(pr * parseFloat(q)) : r.amount;
                                  return { ...r, quantity: q, amount: calculatedAmt };
                                })
                              );
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Unit</label>
                          <input
                            type="text"
                            placeholder="kg/pcs"
                            value={row.unit || ''}
                            onChange={(e) => {
                              const u = e.target.value;
                              setItemRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, unit: u } : r))
                              );
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">Rate ₹</label>
                          <input
                            type="number"
                            placeholder="Price"
                            value={row.price || ''}
                            onChange={(e) => {
                              const p = e.target.value;
                              setItemRows((prev) =>
                                prev.map((r, i) => {
                                  if (i !== idx) return r;
                                  const qty = parseFloat(r.quantity || '1') || 1;
                                  const calculatedAmt = parseFloat(p) > 0 ? String(parseFloat(p) * qty) : r.amount;
                                  return { ...r, price: p, amount: calculatedAmt };
                                })
                              );
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Total ₹ *
                            {voiceMissingFields.includes('amount') && (!row.amount || parseFloat(row.amount) <= 0) && (
                              <span className="text-rose-400 font-bold ml-0.5">(!)</span>
                            )}
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="₹"
                            value={row.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItemRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, amount: val } : r))
                              );
                              if (parseFloat(val) > 0) {
                                setVoiceMissingFields((prev) => prev.filter((f) => f !== 'amount'));
                              }
                            }}
                            className={`w-full px-2 py-1.5 rounded-lg bg-slate-800 border text-rose-400 font-bold text-xs placeholder-slate-500 focus:outline-none transition-all ${
                              voiceMissingFields.includes('amount') && (!row.amount || parseFloat(row.amount) <= 0)
                                ? 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20'
                                : 'border-slate-700 focus:border-rose-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Date & Optional Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {t.udhari.dueDate}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setNewDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        +7D
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 15);
                          setNewDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        +15D
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 30);
                          setNewDueDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-300 font-medium"
                      >
                        +30D
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t.common.note}
                  </label>
                  <input
                    type="text"
                    placeholder="Optional note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40"
                >
                  {language === 'hi' ? 'उधारी सेव करें' : 'Save Udhari'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPULAR ITEM ADD / EDIT MODAL */}
      {showPopularModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h4 className="text-sm font-bold text-white">
                {editingPopularItem
                  ? (language === 'hi' ? 'लोकप्रिय सामान बदलें (Edit Item)' : 'Edit Popular Item')
                  : (language === 'hi' ? '+ नया लोकप्रिय सामान (+ Add Popular Item)' : '+ Add Popular Item')}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowPopularModal(false);
                  setEditingPopularItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePopularItem} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'hi' ? 'सामान का नाम (Item Name) *' : 'Item Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice 1 kg or Sugar"
                  value={popularForm.itemName}
                  onChange={(e) => setPopularForm({ ...popularForm, itemName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'hi' ? 'मूल्य (Default Price ₹) *' : 'Default Price (₹) *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 60"
                  value={popularForm.defaultPrice}
                  onChange={(e) => setPopularForm({ ...popularForm, defaultPrice: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {language === 'hi' ? 'इकाई (Unit - optional):' : 'Unit (optional):'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. kg, litre, piece, packet"
                  value={popularForm.unit}
                  onChange={(e) => setPopularForm({ ...popularForm, unit: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
                />

                {/* Quick unit suggestion chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['kg', 'litre', 'piece', 'packet', 'gm', 'box'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPopularForm({ ...popularForm, unit: u })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        popularForm.unit === u
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-750 hover:text-slate-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPopularModal(false);
                    setEditingPopularItem(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40"
                >
                  {editingPopularItem ? 'Save Changes' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPULAR ITEM DELETE CONFIRMATION DIALOG */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  Delete this popular item?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This will remove it from Popular Items. Existing udhari records will not be affected.
                </p>
                <div className="mt-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                  <span className="font-bold text-slate-200">{itemToDelete.itemName}</span>
                  {itemToDelete.unit && <span className="text-slate-400"> ({itemToDelete.unit})</span>}
                  <span className="text-rose-400 font-bold ml-2">{formatINR(itemToDelete.defaultPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePopular}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VOICE UDHARI MODAL */}
      {showVoiceModal && (
        <VoiceUdhariModal
          language={language}
          existingCustomers={existingCustomersForVoice}
          popularItemNames={popularItemNamesForVoice}
          onVoiceCommandRecognized={handleVoiceCommandRecognized}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
};
