import React, { useState, useRef, useEffect } from 'react';
import { Store, Languages, Coins, ShieldCheck, Settings, LogIn, LogOut, Cloud, RefreshCw, CheckCircle2, Key, FlaskConical } from 'lucide-react';
import { ShopSettings, Language } from '../types';
import { translations } from '../translations';
import { formatINR } from '../utils/formatters';
import { GoogleUserProfile } from '../utils/cloudBackupService';
import { SubscriptionStatus, isUserAdmin } from '../utils/licenseService';

interface HeaderProps {
  settings: ShopSettings;
  currentCash: number;
  onLanguageToggle: () => void;
  onOpenGalla: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenAdminPanel?: () => void;
  currentUser?: GoogleUserProfile | null;
  subscription?: SubscriptionStatus;
  onLoginWithGoogle?: () => void;
  onLogout?: () => void;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentCash,
  onLanguageToggle,
  onOpenGalla,
  onOpenSettings,
  onOpenBackup,
  onOpenAdminPanel,
  currentUser,
  subscription,
  onLoginWithGoogle,
  onLogout,
  onSyncNow,
  isSyncing = false,
}) => {
  const t = translations[settings.language];
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 transition-all">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {/* Shop Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight truncate leading-snug">
              {currentUser?.name ? `${currentUser.name.split(' ')[0]} ki Dukan` : settings.shopName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {currentUser?.name || settings.ownerName}
              {settings.phone ? ` • ${settings.phone}` : (currentUser?.email ? ` • ${currentUser.email}` : '')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Galla Balance pill */}
          <button
            id="btn-quick-galla"
            onClick={onOpenGalla}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all active:scale-95"
            title={t.galla.title}
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">{t.tabs.home === 'होम' ? 'गल्ला' : 'Galla'}:</span>
            <span>{formatINR(currentCash)}</span>
          </button>

          {/* Admin Dashboard Badge (only for lite59412@gmail.com) */}
          {isUserAdmin(currentUser?.email) && (
            <button
              id="btn-header-admin-badge"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm shadow-amber-950/40"
              title="Admin Dashboard (Generate 1-Year Key & Manage Users)"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* Google Sign-In or User Profile Button */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                id="btn-user-profile-header"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                  currentUser.isGuest
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                    : 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300'
                }`}
                title={currentUser.isGuest ? 'Guest/Test Mode (Temporary)' : `${currentUser.name} (${currentUser.email})`}
              >
                {currentUser.isGuest ? (
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FlaskConical className="w-3 h-3" />
                  </div>
                ) : currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-4 h-4 rounded-full object-cover ring-1 ring-sky-400/50"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-sky-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px]">
                  {currentUser.isGuest ? 'Guest Mode' : currentUser.name.split(' ')[0]}
                </span>
                {currentUser.isGuest ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ) : isSyncing ? (
                  <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                ) : (
                  <Cloud className="w-3 h-3 text-emerald-400" />
                )}
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                    {currentUser.isGuest ? (
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                    ) : currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/40"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white flex items-center justify-center">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {currentUser.isGuest ? 'Temporary In-Memory Session' : currentUser.email}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                        {currentUser.isGuest ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Guest/Test Mode
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Cloud Firestore Linked
                          </span>
                        )}
                      </div>
                      {!currentUser.isGuest && subscription?.isValid && (
                        <div className="mt-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold flex items-center justify-between">
                          <span>1-Year Pro Active</span>
                          <span>{subscription.daysRemaining}d left</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    {!currentUser.isGuest && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onSyncNow?.();
                        }}
                        disabled={isSyncing}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Saving to Cloud...' : 'Sync to Cloud Now'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenBackup();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-left"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>{currentUser.isGuest ? 'Test Data Backup' : t.backup.title}</span>
                    </button>
                    {!currentUser.isGuest && isUserAdmin(currentUser?.email) && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAdminPanel?.();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-left"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Super Admin Panel</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{currentUser.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="btn-google-login-header"
              onClick={onLoginWithGoogle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Login with Google to save data on Cloud Firestore"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="hidden sm:inline">Login with Google</span>
              <span className="sm:hidden font-bold">Login</span>
            </button>
          )}

          {/* Language Switch Button */}
          <button
            id="btn-switch-lang"
            onClick={onLanguageToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95"
            title="Switch Language / भाषा बदलें"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{settings.language === 'hi' ? 'ENG' : 'हिंदी'}</span>
          </button>

          {/* Backup Cloud Status */}
          <button
            id="btn-header-backup"
            onClick={onOpenBackup}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 transition-all active:scale-95"
            title={t.backup.title}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Settings Shortcut */}
          <button
            id="btn-header-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all active:scale-95"
            title={t.common.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
