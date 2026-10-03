import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Share2,
  Save,
  MoreVertical,
  Edit2,
  Calendar,
  CheckCircle,
  Package,
} from 'lucide-react';
import {
  SupplierDueEntry,
  SupplierPurchaseItem,
  SupplierPopularItem,
  Language,
} from '../types';
import { translations } from '../translations';
import {
  formatINR,
  getTodayDateString,
  generateSupplierPurchaseListWhatsAppText,
} from '../utils/formatters';

const SUPPLIER_POPULAR_STORAGE_KEY = 'dukankhata_supplier_popular_items_v1';

const INITIAL_SUPPLIER_POPULAR_ITEMS: SupplierPopularItem[] = [
  { id: 'sp-1', itemName: 'Atta 50kg Bag (आटा)', defaultPrice: 1450, unit: 'bag' },
  { id: 'sp-2', itemName: 'Mustard Oil 15L Tin (सरसों तेल)', defaultPrice: 2150, unit: 'tin' },
  { id: 'sp-3', itemName: 'Sugar 50kg Sack (चीनी)', defaultPrice: 2050, unit: 'bag' },
  { id: 'sp-4', itemName: 'Basmati Rice 25kg Bag (चावल)', defaultPrice: 1850, unit: 'bag' },
  { id: 'sp-5', itemName: 'Tea 5kg Wholesale Pack (चाय)', defaultPrice: 1200, unit: 'packet' },
  { id: 'sp-6', itemName: 'Washing Powder 30kg Box (सर्फ़)', defaultPrice: 1950, unit: 'carton' },
];

function loadSupplierPopularItems(): SupplierPopularItem[] {
  try {
    const saved = localStorage.getItem(SUPPLIER_POPULAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load supplier popular items:', e);
  }
  return INITIAL_SUPPLIER_POPULAR_ITEMS;
}

function saveSupplierPopularItems(items: SupplierPopularItem[]): void {
  try {
    localStorage.setItem(SUPPLIER_POPULAR_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save supplier popular items:', e);
  }
}

interface ItemRow {
  id: string;
  itemName: string;
  quantity: string;
  unit: string;
  price: string;
}

interface SupplierPurchaseModalProps {
  language: Language;
  shopName: string;
  existingSuppliers: { name: string; phone: string }[];
  initialSupplierName?: string;
  initialSupplierPhone?: string;
  initialSupplierId?: string;
  lockSupplier?: boolean;
  onSave: (entry: Omit<SupplierDueEntry, 'id' | 'dueAmount' | 'status'>) => void;
  onClose: () => void;
}

export const SupplierPurchaseModal: React.FC<SupplierPurchaseModalProps> = ({
  language,
  shopName,
  existingSuppliers,
  initialSupplierName = '',
  initialSupplierPhone = '',
  initialSupplierId,
  lockSupplier = false,
  onSave,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const todayStr = getTodayDateString();

  const defaultDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  })();

  const [supplierName, setSupplierName] = useState(initialSupplierName);
  const [supplierPhone, setSupplierPhone] = useState(initialSupplierPhone);
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [note, setNote] = useState('');

  // Multi-item rows
  const [items, setItems] = useState<ItemRow[]>([
    { id: `item-${Date.now()}-1`, itemName: '', quantity: '1', unit: 'bag', price: '' },
  ]);

  // Popular items state
  const [popularItems, setPopularItems] = useState<SupplierPopularItem[]>(() =>
    loadSupplierPopularItems()
  );
  const [activePopularMenuId, setActivePopularMenuId] = useState<string | null>(null);
  const [showAddEditPopularModal, setShowAddEditPopularModal] = useState(false);
  const [editingPopularItem, setEditingPopularItem] = useState<SupplierPopularItem | null>(null);
  const [popularForm, setPopularForm] = useState({ itemName: '', defaultPrice: '', unit: 'bag' });

  // Compute item row total
  const computeRowTotal = (row: ItemRow): number => {
    const q = parseFloat(row.quantity) || 0;
    const p = parseFloat(row.price) || 0;
    return Math.round(q * p);
  };

  // Compute total bill amount
  const totalBillAmount = items.reduce((sum, row) => sum + computeRowTotal(row), 0);
  const paidAmount = Math.max(0, parseFloat(paidAmountInput) || 0);
  const remainingDue = Math.max(0, totalBillAmount - paidAmount);

  // Add Item Row
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: `item-${Date.now()}-${prev.length + 1}`, itemName: '', quantity: '1', unit: 'bag', price: '' },
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (id: string) => {
    if (items.length <= 1) {
      setItems([{ id: `item-${Date.now()}-1`, itemName: '', quantity: '1', unit: 'bag', price: '' }]);
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  // Update Item Row
  const handleUpdateItemRow = (id: string, field: keyof ItemRow, val: string) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Select Popular Item -> populate empty row or append
  const handleSelectPopularItem = (pop: SupplierPopularItem) => {
    const priceStr = String(pop.defaultPrice);
    const unitStr = pop.unit || 'bag';

    setItems((prev) => {
      if (prev.length === 1 && !prev[0].itemName.trim() && !prev[0].price.trim()) {
        return [{ id: prev[0].id, itemName: pop.itemName, quantity: '1', unit: unitStr, price: priceStr }];
      }
      return [
        ...prev,
        { id: `item-${Date.now()}-${prev.length + 1}`, itemName: pop.itemName, quantity: '1', unit: unitStr, price: priceStr },
      ];
    });
  };

  // Save add/edit popular item
  const handleSavePopularItem = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrim = popularForm.itemName.trim();
    if (!nameTrim) return;
    const price = Math.max(0, parseFloat(popularForm.defaultPrice) || 0);

    if (editingPopularItem) {
      const updated = popularItems.map((p) =>
        p.id === editingPopularItem.id
          ? { ...p, itemName: nameTrim, defaultPrice: price, unit: popularForm.unit }
          : p
      );
      setPopularItems(updated);
      saveSupplierPopularItems(updated);
    } else {
      const newItem: SupplierPopularItem = {
        id: `sp-${Date.now()}`,
        itemName: nameTrim,
        defaultPrice: price,
        unit: popularForm.unit,
      };
      const updated = [...popularItems, newItem];
      setPopularItems(updated);
      saveSupplierPopularItems(updated);
    }

    setShowAddEditPopularModal(false);
    setEditingPopularItem(null);
    setPopularForm({ itemName: '', defaultPrice: '', unit: 'bag' });
  };

  // Delete popular item
  const handleDeletePopularItem = (id: string) => {
    const updated = popularItems.filter((p) => p.id !== id);
    setPopularItems(updated);
    saveSupplierPopularItems(updated);
    setActivePopularMenuId(null);
  };

  // Convert rows to final data
  const buildEntryData = (): Omit<SupplierDueEntry, 'id' | 'dueAmount' | 'status'> => {
    const formattedItems: SupplierPurchaseItem[] = items
      .filter((r) => r.itemName.trim() || parseFloat(r.price) > 0)
      .map((r, idx) => ({
        id: `pi-${Date.now()}-${idx}`,
        itemName: r.itemName.trim() || 'Wholesale Goods',
        quantity: parseFloat(r.quantity) || 1,
        unit: r.unit || 'unit',
        price: parseFloat(r.price) || 0,
        totalAmount: computeRowTotal(r),
      }));

    const summaryItem =
      formattedItems.length > 0
        ? formattedItems[0].itemName + (formattedItems.length > 1 ? ` (+${formattedItems.length - 1} items)` : '')
        : 'Wholesale Goods';

    const cleanPhone = (supplierPhone || '').replace(/[^0-9]/g, '');
    const supId =
      initialSupplierId ||
      (cleanPhone ? `sup-${cleanPhone}` : `sup-${supplierName.trim().toLowerCase().replace(/\s+/g, '_')}`);

    return {
      supplier_id: supId,
      supplierName: supplierName.trim() || 'General Supplier',
      supplierPhone: supplierPhone.trim() || '9876500000',
      itemPurchased: summaryItem,
      items: formattedItems,
      item_list: formattedItems,
      quantity: `${formattedItems.length} items`,
      amount: totalBillAmount,
      total_amount: totalBillAmount,
      paidAmount,
      paid_amount: paidAmount,
      date: purchaseDate,
      purchase_date: purchaseDate,
      dueDate,
      due_date: dueDate,
      note: note.trim(),
    };
  };

  // Save Purchase Bill
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;
    if (totalBillAmount <= 0) return;

    const data = buildEntryData();
    onSave(data);
    onClose();
  };

  // Send Full List on WhatsApp
  const handleSendWhatsApp = () => {
    if (!supplierName.trim()) return;
    const entryData = buildEntryData();
    const dummyFullEntry: SupplierDueEntry = {
      ...entryData,
      id: `temp-${Date.now()}`,
      dueAmount: remainingDue,
      status: remainingDue <= 0 ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'pending',
    };

    const text = generateSupplierPurchaseListWhatsAppText(dummyFullEntry, shopName, language);
    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {t.supplier.title}
            </span>
            <h3 className="text-base font-bold text-white">
              {lockSupplier
                ? language === 'hi'
                  ? `नई खरीद दर्ज करें - ${supplierName}`
                  : `+ Add New Purchase - ${supplierName}`
                : t.supplier.addDue}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Supplier Alert if locked */}
        {lockSupplier && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                {language === 'hi' ? 'सप्लायर खाता (मौजूदा)' : 'Supplier Account (Existing)'}
              </span>
              <span className="font-bold text-white text-sm">
                {supplierName}
              </span>
              <span className="text-slate-400 text-xs ml-2">
                ({supplierPhone})
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              + New Purchase
            </span>
          </div>
        )}

        <form onSubmit={handleSaveBill} className="space-y-4">
          {/* Supplier Info */}
          {!lockSupplier ? (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t.supplier.supplierName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shyam Mandi Traders"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
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
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          ) : null}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.common.date}
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.common.dueDate}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Popular Items System */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                {t.supplier.popularItems}
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingPopularItem(null);
                  setPopularForm({ itemName: '', defaultPrice: '', unit: 'bag' });
                  setShowAddEditPopularModal(true);
                }}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all"
              >
                {t.supplier.addPopularItem}
              </button>
            </div>

            {/* Popular Items Horizontal Grid */}
            <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {popularItems.map((pop) => (
                <div
                  key={pop.id}
                  className="relative group shrink-0 flex items-center bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl px-2.5 py-1.5 transition-all text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPopularItem(pop)}
                    className="text-left pr-6"
                  >
                    <div className="font-bold text-white max-w-[120px] truncate text-[11px]">
                      {pop.itemName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-semibold">
                      {formatINR(pop.defaultPrice)} {pop.unit ? `/${pop.unit}` : ''}
                    </div>
                  </button>

                  {/* 3-dot menu button */}
                  <div className="absolute right-1 top-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopularMenuId(activePopularMenuId === pop.id ? null : pop.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {activePopularMenuId === pop.id && (
                      <div className="absolute right-0 top-6 w-24 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePopularMenuId(null);
                            setEditingPopularItem(pop);
                            setPopularForm({
                              itemName: pop.itemName,
                              defaultPrice: String(pop.defaultPrice),
                              unit: pop.unit || 'bag',
                            });
                            setShowAddEditPopularModal(true);
                          }}
                          className="w-full text-left px-2.5 py-1 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3 text-blue-400" />
                          <span>{t.common.edit}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePopularItem(pop.id)}
                          className="w-full text-left px-2.5 py-1 hover:bg-slate-800 text-rose-400 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t.common.delete}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Item Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {t.supplier.purchaseItems} ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.supplier.addItem}</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {items.map((row, idx) => {
                const rowTotal = computeRowTotal(row);
                return (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500">#{idx + 1}</span>
                      <input
                        type="text"
                        placeholder="Item name (e.g. Sugar 50kg)"
                        value={row.itemName}
                        onChange={(e) => handleUpdateItemRow(row.id, 'itemName', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(row.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 items-center">
                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-0.5">
                          {t.common.quantity}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          placeholder="1"
                          value={row.quantity}
                          onChange={(e) => handleUpdateItemRow(row.id, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-0.5">
                          {t.common.unit}
                        </label>
                        <select
                          value={row.unit}
                          onChange={(e) => handleUpdateItemRow(row.id, 'unit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-xs text-white"
                        >
                          <option value="bag">bag (बोरी)</option>
                          <option value="tin">tin (टिन)</option>
                          <option value="kg">kg (किलो)</option>
                          <option value="carton">carton (पेटी)</option>
                          <option value="packet">packet (पैकेट)</option>
                          <option value="piece">piece (पीस)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-0.5">
                          {t.common.price} (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Price"
                          value={row.price}
                          onChange={(e) => handleUpdateItemRow(row.id, 'price', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-400 font-bold block mb-0.5">
                          {t.common.totalAmount}
                        </label>
                        <div className="bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-black text-right">
                          {formatINR(rowTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill Calculation & Paid Summary */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">{t.supplier.totalBillAmount}:</span>
              <span className="text-sm font-extrabold text-white">{formatINR(totalBillAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  {t.supplier.paidAmount} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalBillAmount || 9999999}
                  placeholder="0"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  {t.supplier.remainingDue} (₹)
                </label>
                <div className="px-2.5 py-1.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs font-black text-amber-400">
                  {formatINR(remainingDue)}
                </div>
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.common.note} (Bill No. / Transport Remarks)
            </label>
            <input
              type="text"
              placeholder="e.g. Mandi Invoice #4029, tempo delivery"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.supplier.sendWhatsApp}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                {t.common.cancel}
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950/50 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'hi' ? 'खरीद सेव करें' : 'Save Purchase'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Popular Item Add / Edit Sub-Modal */}
        {showAddEditPopularModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  {editingPopularItem ? t.common.edit : t.supplier.addPopularItem}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddEditPopularModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePopularItem} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {t.common.itemName} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rice 25kg Bag"
                    value={popularForm.itemName}
                    onChange={(e) => setPopularForm({ ...popularForm, itemName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {t.supplier.defaultPrice} (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="1850"
                      value={popularForm.defaultPrice}
                      onChange={(e) => setPopularForm({ ...popularForm, defaultPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {t.common.unit}
                    </label>
                    <select
                      value={popularForm.unit}
                      onChange={(e) => setPopularForm({ ...popularForm, unit: e.target.value })}
                      className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    >
                      <option value="bag">bag (बोरी)</option>
                      <option value="tin">tin (टिन)</option>
                      <option value="carton">carton (पेटी)</option>
                      <option value="kg">kg (किलो)</option>
                      <option value="packet">packet (पैकेट)</option>
                      <option value="piece">piece (पीस)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEditPopularModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
