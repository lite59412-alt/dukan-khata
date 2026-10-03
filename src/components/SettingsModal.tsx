import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  QrCode,
  Languages,
  ShieldCheck,
  X,
  Save,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Undo2,
  Download,
  History,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Truck,
  Users,
  TrendingDown,
  Coins,
  Calendar,
  CreditCard,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mic,
  User,
  Mail,
  KeyRound,
  LogOut,
  Check,
  UserX,
  FlaskConical,
  LogIn,
} from 'lucide-react';
import { ShopSettings, Language, AppStateData } from '../types';
import { translations } from '../translations';
import { getInitialAppState, saveAppState } from '../mockData';
import {
  getSavedGoogleUser,
  saveUserDataToFirestore,
  GoogleUserProfile,
} from '../utils/cloudBackupService';
import { sendUserPasswordReset } from '../utils/authService';
import { ENABLE_GUEST_MODE, exitGuestLogin } from '../utils/guestAuth';
import { clearGuestSessionStorage, createInitialGuestAppState, saveGuestAppState } from '../utils/guestSession';
import {
  DataModuleKey,
  DATA_MODULES,
  ModuleInfo,
  reauthenticateWithGoogle,
  exportPreDeletionBackup,
  getLastPreDeletionBackup,
  executeModuleDeletion,
  undoModuleDeletion,
  getAuditLogs,
  recordAuditLog,
  AuditLogEntry,
} from '../utils/dataManagementService';

interface SettingsModalProps {
  settings: ShopSettings;
  language: Language;
  onUpdateSettings: (updated: Partial<ShopSettings>) => void;
  onOpenBackup: () => void;
  onClose: () => void;
  appState?: AppStateData;
  onUpdateAppState?: (newState: AppStateData) => void;
  currentUser?: GoogleUserProfile | null;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  language,
  onUpdateSettings,
  onOpenBackup,
  onClose,
  appState: passedAppState,
  onUpdateAppState,
  currentUser: propCurrentUser,
  onLogout,
}) => {
  const t = translations[language] || translations.en;

  // Shop Profile state
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [address, setAddress] = useState(settings.address);
  const [workingDays, setWorkingDays] = useState(String(settings.workingDaysPerMonth || 26));

  // Resolved current user & full app state
  const currentUser: GoogleUserProfile | null = propCurrentUser || getSavedGoogleUser();
  const [currentAppState, setCurrentAppState] = useState<AppStateData>(() => {
    return passedAppState || getInitialAppState(currentUser?.uid);
  });

  // Language Preview & Selection State
  const [previewLang, setPreviewLang] = useState<Language>(language);

  // Account Section States
  const [accountToast, setAccountToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountSuccess, setDeleteAccountSuccess] = useState(false);

  // Resolved account details
  const savedLoginId = currentUser?.uid ? localStorage.getItem(`dukankhata_login_id_${currentUser.uid}`) : null;
  const displayLoginId = savedLoginId || currentUser?.email || 'shree_ram_store';
  const savedLastLogin = currentUser?.uid ? localStorage.getItem(`dukankhata_last_login_${currentUser.uid}`) : null;
  const displayLastLogin = savedLastLogin
    ? new Date(savedLastLogin).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Active (Current Session)';

  // Sync state if passedAppState changes
  useEffect(() => {
    if (passedAppState) {
      setCurrentAppState(passedAppState);
    }
  }, [passedAppState]);

  // Data Management: active deletion workflow target module
  const [activeDeleteModule, setActiveDeleteModule] = useState<ModuleInfo | null>(null);

  // Deletion workflow steps
  // 1: Information & Reason
  // 2: Type DELETE
  // 3: Google Re-authentication (if cloud user)
  // 4: Final Confirmation
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3 | 4>(1);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [reauthSuccess, setReauthSuccess] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Result & Undo state
  const [undoArchiveId, setUndoArchiveId] = useState<string | null>(null);
  const [undoModuleName, setUndoModuleName] = useState<string | null>(null);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number>(0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Audit Logs view
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());

  // Pre-deletion backup check
  const lastPreBackup = getLastPreDeletionBackup();

  // Undo countdown timer
  useEffect(() => {
    if (undoTimeRemaining <= 0) {
      setUndoArchiveId(null);
      setUndoModuleName(null);
      return;
    }
    const timer = setInterval(() => {
      setUndoTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [undoTimeRemaining]);

  // Open deletion modal for a specific module
  const handleInitiateModuleDelete = (mod: ModuleInfo) => {
    setActiveDeleteModule(mod);
    setDeleteStep(1);
    setTypedConfirmation('');
    setDeletionReason('');
    setReauthSuccess(false);
    setReauthError(null);
    setActionErrorMsg(null);
  };

  // Close deletion workflow modal
  const handleCancelDelete = () => {
    setActiveDeleteModule(null);
    setDeleteStep(1);
    setTypedConfirmation('');
    setDeletionReason('');
    setReauthSuccess(false);
    setReauthError(null);
  };

  // Google Re-authentication step
  const handleGoogleReauth = async () => {
    setIsReauthenticating(true);
    setReauthError(null);
    const result = await reauthenticateWithGoogle();
    setIsReauthenticating(false);

    if (result.success) {
      setReauthSuccess(true);
      setDeleteStep(4); // Advance to final confirmation
    } else {
      setReauthError(result.error || 'Google re-authentication failed.');
    }
  };

  // Save changes to current state & persist to localStorage and Firestore
  const applyStateChanges = async (newState: AppStateData) => {
    setCurrentAppState(newState);
    saveAppState(newState, currentUser?.uid);
    if (onUpdateAppState) {
      onUpdateAppState(newState);
    }
    if (currentUser?.uid && !currentUser.isGuest) {
      try {
        await saveUserDataToFirestore(currentUser.uid, currentUser, newState);
      } catch (err) {
        console.warn('Notice syncing cleared state to Firestore:', err);
      }
    }
  };

  // Final Execution of Deletion
  const handleConfirmExecuteDeletion = async () => {
    if (!activeDeleteModule) return;
    setIsDeleting(true);
    setActionErrorMsg(null);

    try {
      // 6. Create a backup/export before deletion
      const backupFileName = exportPreDeletionBackup(
        currentAppState,
        activeDeleteModule.key,
        currentUser?.email
      );

      // 7 & 8. Delete only the selected module's data, do not touch other modules
      const { newState, deletedCount, archiveId } = executeModuleDeletion(
        currentAppState,
        activeDeleteModule.key,
        currentUser?.email || 'Store Owner',
        deletionReason
      );

      // Apply changes locally & in cloud
      await applyStateChanges(newState);

      // 10. Write an audit log
      await recordAuditLog(
        {
          timestamp: new Date().toISOString(),
          module: activeDeleteModule.key,
          moduleLabel: activeDeleteModule.label,
          recordCount: deletedCount,
          deletedBy: currentUser?.email || 'Local Store Owner',
          deletionReason: deletionReason || 'Manual deletion via Data Management',
          backupCreated: true,
          status: 'success',
        },
        currentUser?.uid
      );

      setAuditLogs(getAuditLogs());

      // 9. Show success result & activate 60s Undo window
      setUndoArchiveId(archiveId);
      setUndoModuleName(activeDeleteModule.label);
      setUndoTimeRemaining(60);
      setActionSuccessMsg(
        `${activeDeleteModule.label} completed (${deletedCount} records deleted). Automatic backup created: ${backupFileName}`
      );

      // Close deletion modal
      handleCancelDelete();
    } catch (err: any) {
      setActionErrorMsg(`Deletion failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Undo
  const handleUndo = async () => {
    if (!undoArchiveId) return;
    const res = undoModuleDeletion(undoArchiveId, currentAppState);
    if (res.success && res.restoredState) {
      await applyStateChanges(res.restoredState);
      setActionSuccessMsg(res.message);
      setUndoArchiveId(null);
      setUndoModuleName(null);
      setUndoTimeRemaining(0);
      setAuditLogs(getAuditLogs());
    } else {
      setActionErrorMsg(res.message);
    }
  };

  // Handle Restore from Pre-Deletion Backup
  const handleRestoreFromPreBackup = async () => {
    if (!lastPreBackup) return;
    const confirmRestore = window.confirm(
      `Restore snapshot from ${new Date(
        lastPreBackup.timestamp
      ).toLocaleTimeString()} created before clearing ${lastPreBackup.targetModule.toUpperCase()}?`
    );
    if (!confirmRestore) return;

    await applyStateChanges(lastPreBackup.fullStateSnapshot);
    setActionSuccessMsg(`State successfully restored from pre-deletion backup!`);
  };

  // Save Shop Profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      upiId: upiId.trim(),
      address: address.trim(),
      workingDaysPerMonth: parseInt(workingDays, 10) || 26,
    });
    onClose();
  };

  // Render module icon helper
  const renderModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'Truck':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'TrendingDown':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'Coins':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4 text-cyan-400" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.common.settings}</h3>
              <p className="text-[11px] text-slate-400">Shop Profile & Data Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Undo Toast Bar if active */}
        {undoArchiveId && undoModuleName && undoTimeRemaining > 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 min-w-0">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {undoModuleName} cleared
                </p>
                <p className="text-[10px] text-amber-300">
                  Undo available for {undoTimeRemaining}s
                </p>
              </div>
            </div>
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 shrink-0"
            >
              Undo Deletion
            </button>
          </div>
        )}

        {/* Success / Error notification alerts */}
        {actionSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
            <button
              onClick={() => setActionErrorMsg(null)}
              className="text-rose-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPORARY GUEST/TEST MODE SECTION (Only rendered when currentUser.isGuest) */}
        {/* ========================================================================= */}
        {ENABLE_GUEST_MODE && currentUser?.isGuest && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-amber-950/20 border-2 border-amber-500/50 space-y-3.5 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-300">Guest/Test Mode</h4>
                  <p className="text-[11px] text-amber-200/80">
                    Temporary testing session. Data is isolated in memory and deleted when you exit.
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                Active Test
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              • All changes are saved temporarily in memory / session only.<br />
              • Permanent cloud backup and real WhatsApp messages are disabled.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Exit Guest Mode */}
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('All guest test data will be deleted. Continue?')) {
                    await exitGuestLogin();
                    if (onLogout) onLogout();
                    onClose();
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Guest Mode</span>
              </button>

              {/* Clear Guest Data */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all guest test data to initial sample records?')) {
                    clearGuestSessionStorage();
                    const fresh = createInitialGuestAppState();
                    saveGuestAppState(fresh);
                    setCurrentAppState(fresh);
                    if (onUpdateAppState) onUpdateAppState(fresh);
                    setAccountToast({
                      type: 'success',
                      message: 'Guest test data reset to initial clean state.',
                    });
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Clear Guest Data</span>
              </button>

              {/* Login with Real Account */}
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('All guest test data will be deleted before opening Real Login. Continue?')) {
                    await exitGuestLogin();
                    if (onLogout) onLogout();
                    onClose();
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login with Real Account</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: ACCOUNT (Required) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{t.account.title}</h4>
                <p className="text-[11px] text-slate-400">{t.account.subtitle}</p>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all active:scale-95"
                title={t.account.logoutBtn}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.account.logoutBtn}</span>
              </button>
            )}
          </div>

          {/* Account Feedback Toast */}
          {accountToast && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                accountToast.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {accountToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{accountToast.message}</span>
              </div>
              <button onClick={() => setAccountToast(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* Account Profile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Login ID / Email */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {t.account.loginIdEmail}
              </span>
              <p className="font-semibold text-white truncate font-mono text-[11px]">
                {displayLoginId}
              </p>
            </div>

            {/* Owner Name */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {t.account.ownerName}
              </span>
              <p className="font-semibold text-white truncate">
                {ownerName || 'Dukandar'}
              </p>
            </div>

            {/* Shop Name */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {t.account.shopName}
              </span>
              <p className="font-semibold text-white truncate">
                {shopName || 'Meri Dukan'}
              </p>
            </div>

            {/* Phone Number */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {t.account.phoneNumber}
              </span>
              <p className="font-semibold text-white truncate font-mono">
                {phone || 'Not configured'}
              </p>
            </div>

            {/* Account Status */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  {t.account.accountStatus}
                </span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {t.account.statusActive}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Verified
              </span>
            </div>

            {/* Last Login */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                {t.account.lastLogin}
              </span>
              <p className="font-semibold text-slate-300 text-[11px] truncate">
                {displayLastLogin}
              </p>
            </div>
          </div>

          {/* Account Actions Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
            {/* Change Password Button */}
            <button
              type="button"
              onClick={async () => {
                const emailToReset = currentUser?.email || (displayLoginId.includes('@') ? displayLoginId : `${displayLoginId}@gmail.com`);
                setIsSendingResetEmail(true);
                setAccountToast(null);
                const res = await sendUserPasswordReset(emailToReset);
                setIsSendingResetEmail(false);
                if (res.success) {
                  setAccountToast({
                    type: 'success',
                    message: t.account.resetEmailSent,
                  });
                } else {
                  setAccountToast({
                    type: 'error',
                    message: t.validationErrors.unknownError,
                  });
                }
              }}
              disabled={isSendingResetEmail}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSendingResetEmail ? 'Sending...' : t.account.changePassword}</span>
            </button>

            {/* Delete Account Request Button */}
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold underline transition-colors"
            >
              {t.account.deleteAccountRequest}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: LANGUAGE SETTINGS WITH REAL-TIME PREVIEW (Required) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{t.languageSettings.title}</h4>
                <p className="text-[11px] text-slate-400">{t.languageSettings.subtitle}</p>
              </div>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              {language === 'en'
                ? 'English'
                : language === 'hi'
                ? 'Hindi'
                : language === 'or'
                ? 'Odia'
                : 'Bengali'}
            </span>
          </div>

          {/* 4 Language Buttons (Exact names: English, Hindi, Odia, Bengali) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { code: 'en' as Language, name: 'English', native: 'English' },
              { code: 'hi' as Language, name: 'Hindi', native: 'हिंदी' },
              { code: 'or' as Language, name: 'Odia', native: 'ଓଡ଼ିଆ' },
              { code: 'bn' as Language, name: 'Bengali', native: 'বাংলা' },
            ].map((item) => {
              const isSelected = previewLang === item.code;
              const isActive = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setPreviewLang(item.code);
                    // Immediate application as required
                    onUpdateSettings({ language: item.code });
                    try {
                      localStorage.setItem('dukankhata_preferred_language', item.code);
                    } catch {}
                    if (currentUser?.uid && !currentUser.isGuest) {
                      saveUserDataToFirestore(currentUser.uid, currentUser, {
                        ...currentAppState,
                        settings: { ...currentAppState.settings, language: item.code },
                      }).catch(() => {});
                    }
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md shadow-amber-950/40'
                      : isSelected
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-amber-400 font-bold" />}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">{item.native}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Language Preview Card */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {t.languageSettings.previewTitle}:{' '}
                <strong className="text-amber-400">
                  {previewLang === 'en'
                    ? 'English'
                    : previewLang === 'hi'
                    ? 'Hindi (हिंदी)'
                    : previewLang === 'or'
                    ? 'Odia (ଓଡ଼ିଆ)'
                    : 'Bengali (বাংলা)'}
                </strong>
              </span>
              <span className="text-[10px] text-slate-500">
                {t.languageSettings.previewNotice}
              </span>
            </div>

            {/* Sample Chips Preview */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                {(translations[previewLang] || translations.en).tabs.home}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                {(translations[previewLang] || translations.en).tabs.udhari}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                {(translations[previewLang] || translations.en).tabs.staff}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-200">
                {(translations[previewLang] || translations.en).quickActions.addUdhari}
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                {(translations[previewLang] || translations.en).common.save}
              </span>
            </div>
          </div>
        </div>

        {/* Option: Voice Add Udhari */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
              settings.voiceAddUdhariEnabled ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'hi' ? 'Voice Add Udhari (आवाज़ से उधारी)' : 'Voice Add Udhari'}
              </p>
              <p className="text-[10px] text-slate-400">
                {language === 'hi'
                  ? 'उधारी टैब में माइक से बोलकर सीधे उधारी जोड़ने का विकल्प'
                  : 'Enable microphone button to speak and add udhari'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold font-mono ${
                settings.voiceAddUdhariEnabled ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {settings.voiceAddUdhariEnabled ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              id="toggle-voice-add-udhari"
              role="switch"
              aria-checked={Boolean(settings.voiceAddUdhariEnabled)}
              onClick={() =>
                onUpdateSettings({
                  voiceAddUdhariEnabled: !settings.voiceAddUdhariEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.voiceAddUdhariEnabled ? 'bg-rose-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.voiceAddUdhariEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Backup Status Tile */}
        <div
          onClick={onOpenBackup}
          className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/40 flex items-center justify-between cursor-pointer hover:bg-teal-950/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'hi' ? 'डेटा बैकअप स्थिति: सक्रिय' : 'Backup Status: Active & Secured'}
              </p>
              <p className="text-[10px] text-teal-300">
                {settings.lastBackupDate
                  ? `Last sync: ${settings.lastBackupDate}`
                  : 'Cloud Backup Ready'}
              </p>
            </div>
          </div>
          <span className="text-xs text-teal-400 font-bold underline">Manage</span>
        </div>

        {/* ========================================================================= */}
        {/* NEW SECTION: DATA MANAGEMENT (Required) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Data Management</h4>
                <p className="text-[11px] text-slate-400">
                  Safely clear individual modules with automatic backup & confirmation
                </p>
              </div>
            </div>

            {/* Restore from Pre-Backup Quick Pill */}
            {lastPreBackup && (
              <button
                type="button"
                onClick={handleRestoreFromPreBackup}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all"
                title="Restore previous pre-deletion snapshot"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Backup</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Select a module to clear. Each module requires typing <strong>DELETE</strong> and creates an automatic backup before clearing. No one-tap wipe.
          </p>

          {/* Separate Module Clear Options List */}
          <div className="space-y-2">
            {DATA_MODULES.map((mod) => {
              const count = mod.getRecordCount(currentAppState);
              return (
                <div
                  key={mod.key}
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      {renderModuleIcon(mod.iconName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {mod.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                            count > 0
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-slate-800/60 text-slate-500'
                          }`}
                        >
                          {count} {count === 1 ? 'record' : 'records'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{mod.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInitiateModuleDelete(mod)}
                    disabled={count === 0}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    Clear Data
                  </button>
                </div>
              );
            })}
          </div>

          {/* Audit Logs Accordion Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <span className="flex items-center gap-1.5 font-bold">
                <History className="w-3.5 h-3.5" />
                <span>Deletion Audit Log ({auditLogs.length})</span>
              </span>
              {showAuditLogs ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAuditLogs && (
              <div className="mt-2 rounded-xl bg-slate-900 border border-slate-800 divide-y divide-slate-850 max-h-40 overflow-y-auto text-[11px]">
                {auditLogs.length === 0 ? (
                  <p className="p-3 text-center text-slate-500">No deletions recorded yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{log.moduleLabel}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {log.recordCount} records • By: {log.deletedBy}
                      </p>
                      {log.deletionReason && (
                        <p className="text-[10px] text-slate-500 italic">
                          Reason: "{log.deletionReason}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-1">
            Shop Profile Details:
          </h4>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Shop Name *
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Shop UPI ID *
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Working Days / Month
              </label>
              <input
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Shop Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* MULTI-STEP DELETION WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {activeDeleteModule && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl overflow-hidden">
            {/* Workflow Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {activeDeleteModule.label}
                  </h3>
                  <p className="text-[10px] text-slate-400">Step {deleteStep} of 4</p>
                </div>
              </div>
              <button
                onClick={handleCancelDelete}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: WHAT WILL BE DELETED & RECORD COUNT */}
            {deleteStep === 1 && (
              <div className="space-y-3.5 text-xs">
                {/* Record Count Badge */}
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                  <span className="font-bold text-rose-300">Target Records Found:</span>
                  <span className="font-mono text-sm font-black text-white px-2.5 py-0.5 rounded-lg bg-rose-600/30 border border-rose-500/40">
                    {activeDeleteModule.getRecordCount(currentAppState)} records
                  </span>
                </div>

                {/* 1. Exactly what will be deleted */}
                <div>
                  <p className="font-bold text-slate-300 mb-1.5">
                    1. Exactly what will be deleted:
                  </p>
                  <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
                    {activeDeleteModule.itemsWillBeDeleted.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 8. Reassurance that other modules are NOT deleted */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-emerald-400">Safety Guarantee:</strong> Only {activeDeleteModule.label.toLowerCase()} will be deleted. All other shop data, settings, and other tabs remain untouched.
                </div>

                {/* Deletion Reason (Optional) */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Reason for Deletion (Optional):
                  </label>
                  <input
                    type="text"
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="e.g. Financial year close, test data purge"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-750"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                  >
                    Proceed to Verification →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REQUIRE TYPING 'DELETE' */}
            {deleteStep === 2 && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <p className="font-bold text-white">
                    3. Type <span className="font-mono text-rose-400 select-all">DELETE</span> to confirm
                  </p>
                  <p className="text-[11px] text-slate-400">
                    To prevent accidental data loss, please type the confirmation word below:
                  </p>
                  <input
                    type="text"
                    value={typedConfirmation}
                    onChange={(e) => setTypedConfirmation(e.target.value.toUpperCase())}
                    placeholder="Type DELETE here"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 text-white font-mono text-sm tracking-wider uppercase focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={typedConfirmation.trim() !== 'DELETE'}
                    onClick={() => {
                      // Check if cloud login is enabled (Step 5)
                      if (currentUser) {
                        setDeleteStep(3);
                      } else {
                        setDeleteStep(4);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GOOGLE RE-AUTHENTICATION (If cloud user) */}
            {deleteStep === 3 && (
              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white text-sm">Security Verification</h4>
                  <p className="text-[11px] text-slate-400">
                    5. Cloud sync is active for <strong>{currentUser?.email}</strong>. Google re-authentication is required to verify your identity before deleting data.
                  </p>
                </div>

                {reauthError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {reauthError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleReauth}
                  disabled={isReauthenticating}
                  className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  {isReauthenticating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying with Google...</span>
                    </>
                  ) : (
                    <span>Re-authenticate with Google</span>
                  )}
                </button>

                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to Verification
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: SECOND & FINAL CONFIRMATION */}
            {deleteStep === 4 && (
              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-500/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-black">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>4. Final Confirmation</span>
                  </div>
                  <p className="text-slate-200 leading-snug">
                    Are you absolutely sure you want to clear <strong>{activeDeleteModule.label}</strong> ({activeDeleteModule.getRecordCount(currentAppState)} records)?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    6. An automatic snapshot backup will be downloaded and saved prior to deletion. A 60-second Undo window will also be provided.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-750"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmExecuteDeletion}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-950/50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting & Backing Up...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm & Clear {activeDeleteModule.label}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT REQUEST DIALOG */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-rose-500/30 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {t.account.deleteAccountConfirmTitle}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.account.deleteAccountConfirmDesc}
                </p>
              </div>
            </div>

            {deleteAccountSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'खाता हटाने का अनुरोध दर्ज हो गया है। व्यवस्थापक 24-48 घंटों में सत्यापन करेगा।'
                    : 'Account deletion request submitted. An admin will process and verify within 24-48 hours.'}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-bold">{displayLoginId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shop:</span>
                  <span>{shopName || 'Meri Dukan'}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountSuccess(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                {deleteAccountSuccess ? t.common.back : t.common.cancel}
              </button>
              {!deleteAccountSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAccountSuccess(true);
                    setAccountToast({
                      type: 'success',
                      message: language === 'hi' ? 'खाता हटाने का अनुरोध भेजा गया' : 'Deletion request submitted',
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/40"
                >
                  {t.account.confirmDeleteBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
