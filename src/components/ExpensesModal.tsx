import React, { useState } from 'react';
import { Receipt, PlusCircle, Trash2, Calendar, Tag, X, DollarSign } from 'lucide-react';
import { ExpenseEntry, ExpenseCategory, Language, ShopSettings } from '../types';
import { translations, expenseCategoryLabels } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';

interface ExpensesModalProps {
  expenses: ExpenseEntry[];
  settings: ShopSettings;
  language: Language;
  onAddExpense: (expense: Omit<ExpenseEntry, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onClose: () => void;
}

export const ExpensesModal: React.FC<ExpensesModalProps> = ({
  expenses,
  settings,
  language,
  onAddExpense,
  onDeleteExpense,
  onClose,
}) => {
  const t = translations[language];
  const todayStr = getTodayDateString();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Tea & Snacks');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const categories = Object.keys(expenseCategoryLabels) as ExpenseCategory[];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    onAddExpense({
      title: title.trim(),
      category,
      amount: parseFloat(amount) || 0,
      paymentMode,
      date: selectedDate || todayStr,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      note: note.trim(),
    });

    setTitle('');
    setAmount('');
    setNote('');
  };

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.expenses.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'hi' ? 'दुकान के दैनिक व मासिक खर्चे' : 'Daily & Monthly Shop Expenses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Badges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">
              {language === 'hi' ? 'आज का कुल खर्च' : "Today's Expenses"}
            </span>
            <span className="text-lg font-black text-rose-400">
              {formatINR(todayTotal)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block">
              {t.expenses.monthlyTotal}
            </span>
            <span className="text-lg font-black text-white">
              {formatINR(monthlyTotal)}
            </span>
          </div>
        </div>

        {/* Add New Expense Form */}
        <form onSubmit={handleCreate} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t.expenses.addExpense}
          </h4>

          {/* Category Chips */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              {t.expenses.category}:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {categories.map((cat) => {
                const info = expenseCategoryLabels[cat];
                const isSelected = category === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{language === 'hi' ? info.hi : info.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                {language === 'hi' ? 'खर्च का विवरण *' : 'Expense Details *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Samosa & Chai"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                {language === 'hi' ? 'रकम (₹) *' : 'Amount (₹) *'}
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 180"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                {t.expenses.paymentMode}
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'upi')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="cash">💵 नकद (Cash from Galla)</option>
                <option value="upi">📱 ऑनलाइन (UPI / Bank)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                {t.common.date}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.expenses.addExpense}</span>
          </button>
        </form>

        {/* Date-wise Expense List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {language === 'hi' ? 'हालिया खर्चे सूची:' : 'Recent Expense Entries:'}
          </h4>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {expenses.map((exp) => {
              const catInfo = expenseCategoryLabels[exp.category];

              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{catInfo?.icon || '📋'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{exp.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(exp.date, language)} • {exp.paymentMode === 'cash' ? '💵 Cash' : '📱 UPI'} • {language === 'hi' ? catInfo?.hi : catInfo?.en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-black text-rose-400 text-sm">
                      {formatINR(exp.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
