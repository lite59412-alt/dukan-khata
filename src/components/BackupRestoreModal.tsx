import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  LogOut,
  LogIn,
  HardDrive,
  Wifi,
  WifiOff,
  Clock,
  X,
  Database,
  User,
} from 'lucide-react';
import { AppStateData, Language } from '../types';
import { translations } from '../translations';
import {
  GoogleUserProfile,
  getSavedGoogleUser,
  saveGoogleUser,
  getAutoSyncPreference,
  saveAutoSyncPreference,
  getLastCloudBackupTime,
  uploadBackupToCloud,
  fetchBackupFromCloud,
  signInWithGooglePopup,
  signOutGoogle,
  CloudBackupRecord,
} from '../utils/cloudBackupService';

interface BackupRestoreModalProps {
  state: AppStateData;
  language: Language;
  onRestoreState: (restored: AppStateData) => void;
  onToggleAutoBackup: (enabled: boolean) => void;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  state,
  language,
  onRestoreState,
  onToggleAutoBackup,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Google User Auth State
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(() =>
    getSavedGoogleUser()
  );

  // Auto-sync Toggle State
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() =>
    getAutoSyncPreference()
  );

  // Cloud Backup State
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() =>
    currentUser ? getLastCloudBackupTime(currentUser.uid) : null
  );
  const [backupStatus, setBackupStatus] = useState<
    'idle' | 'in_progress' | 'success' | 'failed'
  >('idle');
  const [backupMessage, setBackupMessage] = useState<string>('');

  // Cloud Restore State
  const [restoreStatus, setRestoreStatus] = useState<
    'idle' | 'in_progress' | 'success' | 'failed'
  >('idle');
  const [restoreMessage, setRestoreMessage] = useState<string>('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);
  const [fetchedRecord, setFetchedRecord] = useState<CloudBackupRecord | null>(null);

  // JSON Local File State
  const [localFileError, setLocalFileError] = useState<string | null>(null);
  const [localFileSuccess, setLocalFileSuccess] = useState<boolean>(false);

  // Sync Status Indicator
  const getSyncIndicator = () => {
    if (!isOnline) return { label: 'Offline', color: 'text-amber-400', icon: WifiOff };
    if (backupStatus === 'in_progress' || restoreStatus === 'in_progress')
      return { label: 'Syncing...', color: 'text-blue-400 animate-pulse', icon: RefreshCw };
    return { label: 'Synced', color: 'text-emerald-400', icon: CheckCircle2 };
  };

  const syncIndicator = getSyncIndicator();

  // Sign In with Google via Firebase Auth
  const handleGoogleSignIn = async () => {
    try {
      setBackupStatus('in_progress');
      setBackupMessage(language === 'hi' ? 'Google खाता कनेक्ट हो रहा है...' : 'Connecting Google account...');
      const googleUser = await signInWithGooglePopup();
      setCurrentUser(googleUser);
      const existingBackup = getLastCloudBackupTime(googleUser.uid);
      setLastBackupTime(existingBackup);
      setBackupStatus('idle');
      setBackupMessage('');
    } catch (err: any) {
      setBackupStatus('idle');
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(err?.message || (language === 'hi' ? 'साइन-इन विफल रहा' : 'Sign-in failed'));
      }
    }
  };

  // Sign Out from Firebase Auth
  const handleGoogleSignOut = async () => {
    try {
      await signOutGoogle();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(null);
    setLastBackupTime(null);
    setBackupStatus('idle');
    setRestoreStatus('idle');
  };

  // Toggle Auto Sync
  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    saveAutoSyncPreference(enabled);
    onToggleAutoBackup(enabled);
  };

  // Backup to Cloud
  const handleBackupToCloud = async () => {
    if (!currentUser) return;

    if (!isOnline) {
      setBackupStatus('failed');
      setBackupMessage(
        language === 'hi'
          ? 'ऑफ़लाइन - इंटरनेट उपलब्ध होने पर क्लाउड सिंक होगा'
          : 'Offline - changes will sync when connected to internet'
      );
      return;
    }

    setBackupStatus('in_progress');
    setBackupMessage(language === 'hi' ? 'क्लाउड पर बैकअप हो रहा है...' : 'Uploading backup to cloud...');

    try {
      const savedTime = await uploadBackupToCloud(currentUser, state);
      setLastBackupTime(savedTime);
      setBackupStatus('success');
      setBackupMessage(
        language === 'hi'
          ? 'क्लाउड बैकअप सुरक्षित रूप से सहेज लिया गया!'
          : 'Shop backup successfully saved to cloud vault!'
      );
      setTimeout(() => setBackupStatus('idle'), 3000);
    } catch (err) {
      setBackupStatus('failed');
      setBackupMessage(
        language === 'hi' ? 'क्लाउड बैकअप विफल रहा। कृपया पुन: प्रयास करें।' : 'Cloud backup failed. Please retry.'
      );
    }
  };

  // Step 1: Fetch Cloud Backup & Ask for Confirmation
  const handleInitiateCloudRestore = async () => {
    if (!currentUser) return;

    if (!isOnline) {
      setRestoreStatus('failed');
      setRestoreMessage(
        language === 'hi'
          ? 'ऑफ़लाइन हैं - क्लाउड से पुनर्स्थापित करने के लिए इंटरनेट आवश्यक है'
          : 'Offline - Internet required to restore from cloud'
      );
      return;
    }

    setRestoreStatus('in_progress');
    setRestoreMessage(language === 'hi' ? 'क्लाउड से डेटा खोजा जा रहा है...' : 'Checking cloud backup...');

    try {
      const record = await fetchBackupFromCloud(currentUser);
      if (!record || !record.data) {
        setRestoreStatus('failed');
        setRestoreMessage(
          language === 'hi'
            ? 'इस Google खाते के लिए कोई पिछला क्लाउड बैकअप नहीं मिला'
            : 'No previous cloud backup found for this Google account'
        );
        return;
      }

      setFetchedRecord(record);
      setShowRestoreConfirm(true);
      setRestoreStatus('idle');
    } catch (err) {
      setRestoreStatus('failed');
      setRestoreMessage(
        language === 'hi' ? 'क्लाउड बैकअप पढ़ने में त्रुटि' : 'Error reading cloud backup'
      );
    }
  };

  // Step 2: Confirm Restore & Apply
  const handleConfirmRestore = () => {
    if (!fetchedRecord) return;

    setRestoreStatus('in_progress');
    setShowRestoreConfirm(false);

    try {
      onRestoreState(fetchedRecord.data);
      setRestoreStatus('success');
      setRestoreMessage(
        language === 'hi'
          ? 'दुकान डेटा क्लाउड से सफलतापूर्वक पुनर्स्थापित हो गया!'
          : 'App state successfully restored from Cloud!'
      );
      setTimeout(() => {
        setRestoreStatus('idle');
        onClose();
      }, 1500);
    } catch (err) {
      setRestoreStatus('failed');
      setRestoreMessage(language === 'hi' ? 'डेटा लागू करने में विफल' : 'Failed to apply data');
    }
  };

  // Local JSON Download
  const handleDownloadJsonBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DukanKhata_Local_Backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Local JSON Upload
  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: AppStateData = JSON.parse(content);

        if (!parsed.staffList || !parsed.udhariList || !parsed.settings) {
          throw new Error('Invalid format');
        }

        onRestoreState(parsed);
        setLocalFileSuccess(true);
        setLocalFileError(null);
        setTimeout(() => {
          setLocalFileSuccess(false);
          onClose();
        }, 1200);
      } catch (err) {
        setLocalFileError(
          language === 'hi'
            ? 'अमान्य JSON बैकअप फाइल। कृपया मान्य फाइल चुनें।'
            : 'Invalid JSON backup file. Please select a valid file.'
        );
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4 my-auto max-h-[94vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {t.backup.title}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'Google खाता और क्लाउड डेटा सिंक'
                  : 'Google Account & Cloud Data Vault'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-bold ${syncIndicator.color}`}
            >
              <syncIndicator.icon className="w-3.5 h-3.5" />
              <span>{syncIndicator.label}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SECTION 1: GOOGLE ACCOUNT LOGIN */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              {language === 'hi' ? 'गूगल खाता (Google Account)' : 'Google Account'}
            </span>

            {currentUser && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {language === 'hi' ? 'सक्रिय' : 'Connected'}
              </span>
            )}
          </div>

          {!currentUser ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">
                  {language === 'hi'
                    ? 'सुरक्षित क्लाउड बैकअप के लिए साइन-इन करें'
                    : 'Sign in to enable automatic cloud backup'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {language === 'hi'
                    ? 'आपका डेटा आपके अपने Google खाते से सुरक्षित रहेगा'
                    : 'Your shop data will be safely linked to your personal Google account'}
                </p>
              </div>

              <button
                id="btn-google-signin"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold shadow-md transition-transform active:scale-95 shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>{language === 'hi' ? 'Sign in with Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-teal-500/50 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <button
                id="btn-google-signout"
                type="button"
                onClick={handleGoogleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-transform active:scale-95 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'साइन आउट' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: CLOUD BACKUP & RESTORE ACTIONS */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              {language === 'hi' ? 'क्लाउड बैकअप व रिकवरी' : 'Cloud Backup & Recovery'}
            </span>

            {lastBackupTime && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-400" />
                <span>
                  {language === 'hi' ? 'अंतिम बैकअप:' : 'Last:'}{' '}
                  {new Date(lastBackupTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  , {new Date(lastBackupTime).toLocaleDateString()}
                </span>
              </span>
            )}
          </div>

          {/* Buttons: Backup to Cloud / Restore from Cloud */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="btn-cloud-backup"
              disabled={!currentUser || backupStatus === 'in_progress'}
              onClick={handleBackupToCloud}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-transform active:scale-95 ${
                !currentUser
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                  : backupStatus === 'in_progress'
                  ? 'bg-teal-700 text-white cursor-wait animate-pulse'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/50'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>
                {backupStatus === 'in_progress'
                  ? language === 'hi'
                    ? 'सहेजा जा रहा है...'
                    : 'Saving...'
                  : language === 'hi'
                  ? 'क्लाउड में बैकअप लें'
                  : 'Backup to Cloud'}
              </span>
            </button>

            <button
              id="btn-cloud-restore"
              disabled={!currentUser || restoreStatus === 'in_progress'}
              onClick={handleInitiateCloudRestore}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-transform active:scale-95 ${
                !currentUser
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                  : restoreStatus === 'in_progress'
                  ? 'bg-blue-700 text-white cursor-wait animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {restoreStatus === 'in_progress'
                  ? language === 'hi'
                    ? 'जांच रहे हैं...'
                    : 'Checking...'
                  : language === 'hi'
                  ? 'क्लाउड से रीस्टोर करें'
                  : 'Restore from Cloud'}
              </span>
            </button>
          </div>

          {/* Backup Status Messages */}
          {backupMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                backupStatus === 'success'
                  ? 'bg-teal-950/60 border border-teal-500/40 text-teal-300'
                  : backupStatus === 'failed'
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {backupStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {backupStatus === 'failed' && <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{backupMessage}</span>
            </div>
          )}

          {/* Restore Status Messages */}
          {restoreMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                restoreStatus === 'success'
                  ? 'bg-blue-950/60 border border-blue-500/40 text-blue-300'
                  : restoreStatus === 'failed'
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {restoreStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {restoreStatus === 'failed' && <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{restoreMessage}</span>
            </div>
          )}

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <p className="text-xs font-bold text-white">
                {language === 'hi' ? 'ऑटो क्लाउड सिंक (Auto Sync to Cloud)' : 'Auto Sync to Cloud'}
              </p>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'दुकान बंद करते समय या बदलाव पर अपने-आप बैकअप'
                  : 'Syncs automatically after major updates & daily close'}
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>
        </div>

        {/* SECTION 3: OFFLINE LOCAL BACKUP FALLBACK (JSON) */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              {language === 'hi' ? 'ऑफ़लाइन लोकल बैकअप (JSON)' : 'Offline Local Fallback (JSON)'}
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'hi' ? 'बिना इंटरनेट के भी सुरक्षित' : 'Works without internet'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadJsonBackup}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'JSON डाउनलोड' : 'Download JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'hi' ? 'JSON अपलोड' : 'Upload JSON'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleUploadJsonFile}
              className="hidden"
            />
          </div>

          {localFileSuccess && (
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'hi'
                ? 'लोकल JSON से डेटा सफलतापूर्वक रीस्टोर हुआ!'
                : 'Local JSON backup restored successfully!'}
            </p>
          )}

          {localFileError && (
            <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {localFileError}
            </p>
          )}
        </div>

        {/* Confirmation Modal for Cloud Restore */}
        {showRestoreConfirm && fetchedRecord && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'क्लाउड बैकअप रीस्टोर पुष्टि' : 'Confirm Cloud Restore'}
                </h4>
              </div>

              <p className="text-xs text-slate-300">
                {language === 'hi'
                  ? `क्या आप ${new Date(
                      fetchedRecord.backupTimestamp
                    ).toLocaleString()} का क्लाउड बैकअप लोड करना चाहते हैं? इससे वर्तमान स्थिति अपडेट होगी।`
                  : `Are you sure you want to restore the cloud backup from ${new Date(
                      fetchedRecord.backupTimestamp
                    ).toLocaleString()}? This will safely update your current app state.`}
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirm(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-950/50"
                >
                  {language === 'hi' ? 'हाँ, रीस्टोर करें' : 'Yes, Restore'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
