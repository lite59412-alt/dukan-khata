import React, { useState } from 'react';
import { Coins, Plus, Minus, CheckCircle, Calculator, X, Save, ArrowRight } from 'lucide-react';
import { DailyGalla, CashDenominations, Language, ShopSettings } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';

interface DailyGallaModalProps {
  currentGalla: DailyGalla;
  settings: ShopSettings;
  language: Language;
  onSaveGalla: (updated: DailyGalla) => void;
  onClose: () => void;
}

export const DailyGallaModal: React.FC<DailyGallaModalProps> = ({
  currentGalla,
  settings,
  language,
  onSaveGalla,
  onClose,
}) => {
  const t = translations[language];

  const [openingCash, setOpeningCash] = useState(String(currentGalla.openingCash));
  const [cashIn, setCashIn] = useState(String(currentGalla.cashIn));
  const [upiIn, setUpiIn] = useState(String(currentGalla.upiIn));
  const [cardIn, setCardIn] = useState(String(currentGalla.cardIn || 0));
  const [expenseOut, setExpenseOut] = useState(String(currentGalla.expenseOut));
  const [note, setNote] = useState(currentGalla.note || '');

  // Denomination counter
  const [showDenom, setShowDenom] = useState(false);
  const [denoms, setDenoms] = useState<CashDenominations>(
    currentGalla.denominations || {
      n500: 0,
      n200: 0,
      n100: 0,
      n50: 0,
      n20: 0,
      n10: 0,
      coins: 0,
    }
  );

  const denomTotal =
    denoms.n500 * 500 +
    denoms.n200 * 200 +
    denoms.n100 * 100 +
    denoms.n50 * 50 +
    denoms.n20 * 20 +
    denoms.n10 * 10 +
    denoms.coins;

  const numOpening = parseFloat(openingCash) || 0;
  const numCashIn = parseFloat(cashIn) || 0;
  const numUpiIn = parseFloat(upiIn) || 0;
  const numCardIn = parseFloat(cardIn) || 0;
  const numExpenseOut = parseFloat(expenseOut) || 0;

  // Expected cash in drawer = Opening + Cash In - Expenses Out
  const expectedClosingCash = numOpening + numCashIn - numExpenseOut;
  const totalDailySales = numCashIn + numUpiIn + numCardIn;

  // If user used denomination counter, actual physical cash is denomTotal
  const actualClosingCash = showDenom && denomTotal > 0 ? denomTotal : expectedClosingCash;
  const cashDifference = actualClosingCash - expectedClosingCash;

  const handleUpdateDenom = (field: keyof CashDenominations, val: string) => {
    const parsed = parseInt(val, 10) || 0;
    setDenoms((prev) => ({
      ...prev,
      [field]: Math.max(0, parsed),
    }));
  };

  const handleSave = () => {
    onSaveGalla({
      ...currentGalla,
      openingCash: numOpening,
      cashIn: numCashIn,
      upiIn: numUpiIn,
      cardIn: numCardIn,
      expenseOut: numExpenseOut,
      expectedClosingCash,
      actualClosingCash,
      cashDifference,
      denominations: denoms,
      note,
      isClosed: true,
      closedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.galla.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatDate(currentGalla.date, language)} • {settings.shopName}
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

        {/* Daily Summary Highlights */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {language === 'hi' ? 'आज की कुल बिक्री' : 'Total Sales Today'}
            </span>
            <span className="text-lg font-black text-white">
              {formatINR(totalDailySales)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cash + UPI + Card
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
            <span className="text-[11px] font-semibold text-emerald-400 block">
              {language === 'hi' ? 'गल्ले की अपेक्षित रकम' : 'Expected In Galla'}
            </span>
            <span className="text-lg font-black text-emerald-300">
              {formatINR(expectedClosingCash)}
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              {language === 'hi' ? 'आरंभिक + नकद - खर्चे' : 'Opening + Cash - Exp'}
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {language === 'hi' ? 'सुबह का आरंभिक कैश (Opening Cash ₹)' : 'Opening Cash (₹)'}
            </label>
            <input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.galla.cashIn} (₹)
              </label>
              <input
                type="number"
                value={cashIn}
                onChange={(e) => setCashIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.galla.upiIn} (₹)
              </label>
              <input
                type="number"
                value={upiIn}
                onChange={(e) => setUpiIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 font-bold text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.galla.cardIn} (₹)
              </label>
              <input
                type="number"
                value={cardIn}
                onChange={(e) => setCardIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-purple-400 font-bold text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.galla.expenseOut} (₹)
              </label>
              <input
                type="number"
                value={expenseOut}
                onChange={(e) => setExpenseOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Toggle Physical Denomination Counter */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDenom(!showDenom)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'hi'
                    ? 'नोट गिनने का कैलकुलेटर (500, 200, 100...)'
                    : 'Physical Note Denomination Counter'}
                </span>
              </div>
              <span className="font-extrabold text-white">{formatINR(denomTotal)}</span>
            </button>

            {showDenom && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹500 x</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n500 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n500', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹200 x</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n200 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n200', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹100 x</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n100 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n100', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹50 x</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n50 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n50', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹20 x</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n20 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n20', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">₹10 & सिक्का</span>
                    <input
                      type="number"
                      min="0"
                      value={denoms.n10 || ''}
                      placeholder="0"
                      onChange={(e) => handleUpdateDenom('n10', e.target.value)}
                      className="w-16 px-2 py-1 text-right bg-slate-800 rounded border border-slate-700 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    {language === 'hi' ? 'गिनती अनुसार कुल कैश:' : 'Physical Cash Total:'}
                  </span>
                  <span className="font-black text-emerald-400 text-sm">
                    {formatINR(denomTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.common.note}
            </label>
            <input
              type="text"
              placeholder="e.g. Festival morning crowd, high sugar sales"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40"
          >
            <Save className="w-4 h-4" />
            <span>{t.galla.closeGalla}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
