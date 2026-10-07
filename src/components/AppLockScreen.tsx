import React, { useState, useEffect } from 'react';
import {
  Lock,
  Fingerprint,
  Delete,
  AlertCircle,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { AppLockConfig, verifyEnteredPin, promptBiometricAuth } from '../utils/appLockService';

interface AppLockScreenProps {
  shopName: string;
  userName: string;
  userId: string;
  lockConfig: AppLockConfig;
  onUnlock: () => void;
  onForgotPin: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  shopName,
  userName,
  userId,
  lockConfig,
  onUnlock,
  onForgotPin,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState<boolean>(false);

  // Trigger biometric on initial mount if biometric or both mode is enabled
  useEffect(() => {
    if (lockConfig.lockMode === 'biometric' || lockConfig.lockMode === 'both') {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    setIsVerifyingBiometric(true);
    setErrorMsg(null);
    try {
      const success = await promptBiometricAuth(userId);
      if (success) {
        onUnlock();
      } else {
        // Biometric failed or not available - prompt for PIN
        if (lockConfig.pinHash) {
          setErrorMsg('Biometric failed or cancelled. Please enter your PIN.');
        }
      }
    } catch {
      setErrorMsg('Biometric error. Please use PIN to unlock.');
    } finally {
      setIsVerifyingBiometric(false);
    }
  };

  const handleDigitPress = async (digit: string) => {
    if (enteredPin.length >= 6) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    // If reached 4 digits or more, we can auto-check if it matches stored PIN hash
    if (nextPin.length >= 4 && lockConfig.pinHash) {
      const isValid = await verifyEnteredPin(nextPin, lockConfig.pinHash);
      if (isValid) {
        onUnlock();
        return;
      }
      // If reached maximum 6 digits and still not valid:
      if (nextPin.length === 6) {
        setErrorMsg('Incorrect PIN. Please try again.');
        setEnteredPin('');
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleManualSubmit = async () => {
    if (enteredPin.length < 4) {
      setErrorMsg('PIN must be at least 4 digits.');
      return;
    }
    const isValid = await verifyEnteredPin(enteredPin, lockConfig.pinHash);
    if (isValid) {
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
      setEnteredPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between p-6 select-none transition-colors"
      style={{ WebkitUserSelect: 'none' }}
    >
      {/* Top Header: Shop branding */}
      <div className="pt-8 text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{shopName || 'DukanKhata'}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{userName || 'Dukandar'}</span>
        </p>
      </div>

      {/* Center: PIN indicator & Error */}
      <div className="w-full max-w-xs mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Enter PIN to Unlock</span>
        </div>

        {/* Masked PIN Dots (4 to 6 dots display) */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 border ${
                  isFilled
                    ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                    : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Biometric trigger button if enabled */}
        {(lockConfig.lockMode === 'biometric' || lockConfig.lockMode === 'both') && (
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={isVerifyingBiometric}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isVerifyingBiometric ? 'Verifying...' : 'Unlock with Fingerprint/Face'}</span>
          </button>
        )}
      </div>

      {/* Numeric Keypad: 3x4 grid */}
      <div className="w-full max-w-xs mx-auto pb-4 space-y-2.5">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-14 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 active:scale-95 text-slate-900 dark:text-white text-xl font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-slate-700/60 transition-all flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 active:bg-slate-200 dark:active:bg-slate-700 active:scale-95 text-slate-900 dark:text-white text-xl font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center cursor-pointer shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Backspace"
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Enter PIN submit button (if 4+ digits entered) */}
        {enteredPin.length >= 4 && (
          <button
            type="button"
            onClick={handleManualSubmit}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock App</span>
          </button>
        )}

        {/* Forgot PIN Recovery Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forgot PIN?</span>
          </button>
        </div>
      </div>

      {/* Forgot PIN Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left">
            <div className="flex items-center gap-2.5 text-amber-500">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reset / Recover App Lock</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              If you have forgotten your PIN, you can securely sign out and log back in using your
              Google or email account.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Your business data is completely safe</p>
              <p>Signing out clears the local lock state without deleting your shop data or accounts.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  onForgotPin();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Reset Lock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
