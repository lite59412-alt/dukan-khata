import React from 'react';
import { Home, Users, BookOpen, Truck, BarChart3 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

export type TabType = 'home' | 'staff' | 'udhari' | 'supplier' | 'reports';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  language: Language;
  counts: {
    pendingUdhari: number;
    pendingSupplier: number;
    staffCount: number;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  language,
  counts,
}) => {
  const t = translations[language].tabs;

  const navItems = [
    {
      id: 'home' as TabType,
      label: t.home,
      icon: Home,
      badge: null,
    },
    {
      id: 'staff' as TabType,
      label: t.staff,
      icon: Users,
      badge: counts.staffCount > 0 ? `${counts.staffCount}` : null,
    },
    {
      id: 'udhari' as TabType,
      label: t.udhari,
      icon: BookOpen,
      badge: counts.pendingUdhari > 0 ? `${counts.pendingUdhari}` : null,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'supplier' as TabType,
      label: t.supplier,
      icon: Truck,
      badge: counts.pendingSupplier > 0 ? `${counts.pendingSupplier}` : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'reports' as TabType,
      label: t.reports,
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="max-w-2xl mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Indicator bar */}
              {isActive && (
                <div className="absolute -top-1.5 w-8 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              )}

              <div className="relative p-1">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-400' : 'text-slate-400'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-2 px-1.5 py-0.2 min-w-4 h-4 text-[10px] font-extrabold text-white rounded-full flex items-center justify-center leading-none shadow-sm ${
                      item.badgeColor || 'bg-emerald-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight leading-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
