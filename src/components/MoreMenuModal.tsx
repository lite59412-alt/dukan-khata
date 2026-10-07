import React from 'react';
import {
  X,
  BarChart3,
  Receipt,
  Coins,
  Calendar,
  DollarSign,
  Cloud,
  Settings,
  Languages,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectAction: (action: string) => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectAction,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const menuItems = [
    {
      id: 'reports',
      label: 'Reports & Analytics',
      sublabel: 'Sales, Udhari, and financial reports',
      icon: BarChart3,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'expenses',
      label: 'Daily Expenses',
      sublabel: 'Rent, electricity, tea/snacks, maintenance',
      icon: Receipt,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'galla',
      label: 'Daily Cash Galla',
      sublabel: 'Cash in/out, UPI collection, closing balance',
      icon: Coins,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'attendance',
      label: 'Attendance Calendar',
      sublabel: 'Full monthly staff attendance calendar',
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'salary',
      label: 'Staff Salary & Rules',
      sublabel: 'Salary rates, overtime, deductions',
      icon: DollarSign,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      sublabel: 'Local JSON export, cloud backup & sync',
      icon: Cloud,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      sublabel: 'Account, App Lock (PIN & Biometric), Shop Profile',
      icon: Settings,
      color: 'text-slate-300 bg-slate-800 border-slate-700',
    },
    {
      id: 'language',
      label: 'Change Language',
      sublabel: 'English, हिंदी, ଓଡ଼ିଆ, বাংলা',
      icon: Languages,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'help',
      label: 'Help & User Guide',
      sublabel: 'How to use DukanKhata & support tips',
      icon: HelpCircle,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-black text-white">More Features & Tools</h3>
            <p className="text-xs text-slate-400">Quick access to all shop tools</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list of items */}
        <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectAction(item.id);
                  onClose();
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{item.sublabel}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            DukanKhata v2.0 • 100% Offline Capable & Cloud Sync
          </p>
        </div>
      </div>
    </div>
  );
};
