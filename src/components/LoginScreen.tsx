import React, { useState } from 'react';
import {
  Store,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Languages,
  Mail,
  UserPlus,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import {
  signInWithEmailOrLoginId,
  registerWithEmailOrLoginId,
  sendUserPasswordReset,
  getLocalizedAuthError,
} from '../utils/authService';
import { GoogleUserProfile } from '../utils/cloudBackupService';
import { GuestLoginButton } from './GuestLoginButton';

interface LoginScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (user: GoogleUserProfile) => void;
  onLoginWithGoogle: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
  onLoginWithGoogle,
}) => {
  const t = translations[language] || translations.en;

  // Form State
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [ownerName, setOwnerName] = useState('');

  // Processing & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetModalSuccess, setResetModalSuccess] = useState<string | null>(null);

  // Language options with native labels
  const languageOptions: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  ];

  // Submit Handler for Email/Password or Registration
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent double taps

    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = loginId.trim();
    if (!cleanId) {
      setErrorMessage(t.validationErrors.emptyLoginId);
      return;
    }
    if (!password) {
      setErrorMessage(t.validationErrors.emptyPassword);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        const result = await registerWithEmailOrLoginId(cleanId, password, ownerName.trim());
        if (result.success && result.user) {
          setSuccessMessage(language === 'hi' ? 'खाता सफलतापूर्वक बन गया!' : 'Account created successfully!');
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(getLocalizedAuthError(result.errorKey || 'UNKNOWN_ERROR', language));
        }
      } else {
        const result = await signInWithEmailOrLoginId(cleanId, password);
        if (result.success && result.user) {
          setSuccessMessage(language === 'hi' ? 'लॉगिन सफल रहा!' : 'Login successful!');
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(getLocalizedAuthError(result.errorKey || 'WRONG_CREDENTIALS', language));
        }
      }
    } catch {
      setErrorMessage(t.validationErrors.unknownError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Login Handler
  const handleGoogleClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onLoginWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(t.validationErrors.unknownError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Handler
  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotInput.trim();
    if (!cleanEmail) {
      setResetModalError(t.validationErrors.emptyLoginId);
      return;
    }

    setIsSendingReset(true);
    setResetModalError(null);
    setResetModalSuccess(null);

    const res = await sendUserPasswordReset(cleanEmail);
    setIsSendingReset(false);

    if (res.success) {
      setResetModalSuccess(t.login.resetLinkSent);
    } else {
      setResetModalError(getLocalizedAuthError(res.errorKey || 'UNKNOWN_ERROR', language));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500/30 transition-colors">
      {/* Container */}
      <div className="w-full max-w-md space-y-4">
        {/* Top Bar with Language Selector */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">SSL Secured • Dukandar Login</span>
          </div>

          {/* Language Selector Dropdown / Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <Languages className="w-3.5 h-3.5 text-amber-500 ml-1.5 shrink-0" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-slate-900 dark:text-white text-xs font-bold py-1 px-1.5 focus:outline-none cursor-pointer"
              title="Select Language"
            >
              {languageOptions.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">
                  {opt.name} ({opt.native})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 transition-colors">
          {/* Header & Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20 text-slate-950 font-black mb-1">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.appName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isRegisterMode ? t.login.createAccountTitle : t.login.subtitle}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="flex-1">{successMessage}</span>
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Owner Name field for registration mode */}
            {isRegisterMode && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.account.ownerName}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Bhai"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm"
                />
              </div>
            )}

            {/* Login ID or Email Field */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {t.login.loginIdOrEmail}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder={t.login.loginIdPlaceholder}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.login.password}
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotInput(loginId.trim());
                      setResetModalError(null);
                      setResetModalSuccess(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline transition-colors"
                  >
                    {t.login.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  title={showPassword ? t.login.hidePassword : t.login.showPassword}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isRegisterMode ? t.login.creatingAccount : t.login.loggingIn}</span>
                </>
              ) : (
                <>
                  {isRegisterMode ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{t.login.createAccountBtn}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{t.login.loginBtn}</span>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-500">
              {t.login.orDivider}
            </span>
          </div>

          {/* Google Login Option */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{t.login.googleLogin}</span>
          </button>

          {/* Guest / Test Mode Login Option */}
          <GuestLoginButton
            language={language}
            disabled={isSubmitting}
            onSuccess={(guestUser) => {
              onLoginSuccess(guestUser);
            }}
            onError={(msg) => setErrorMessage(msg)}
          />

          {/* Toggle between Login and Registration */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium underline"
            >
              {isRegisterMode ? t.login.haveAccount : t.login.createAccount}
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-[10px] text-slate-500">
          DukanKhata v1.2 • Offline-First & Cloud Firestore Encrypted • India 🇮🇳
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.login.forgotPasswordTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.login.forgotPasswordDesc}</p>
              </div>
            </div>

            {resetModalError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{resetModalError}</span>
              </div>
            )}

            {resetModalSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{resetModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendResetLink} className="space-y-3">
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  {t.login.loginIdOrEmail}
                </label>
                <input
                  type="text"
                  required
                  placeholder="name@email.com"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  disabled={isSendingReset}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingReset && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t.login.sendResetLink}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
