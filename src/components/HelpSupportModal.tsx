import React from 'react';
import { X, HelpCircle, BookOpen, MessageCircle, ShieldCheck, PhoneCall, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Help & User Guide</h3>
              <p className="text-[11px] text-slate-400">Tips for managing your shop khata</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-3 text-xs text-slate-300 pr-1 custom-scrollbar">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Managing Customer Udhari</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Add customers and record credit with item names and quantity. Use the WhatsApp reminder
              button to send professional payment reminders directly to customers.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-blue-400 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>2. Voice Khata Entry</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap the microphone in the Udhari tab and speak like: <em>"Ramesh 2 packet tel 180 rupaye"</em>.
              The app automatically parses items and creates the entry.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. App Lock & Security</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enable App Lock in Settings with a 4 to 6 digit PIN or your phone's fingerprint/face unlock.
              Configure auto-lock when leaving the app.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>4. Staff Salaries & QR Code</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Track attendance, overtime, and advances. Pay staff via their saved UPI ID or QR code,
              and maintain an unalterable payment ledger for every month.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
