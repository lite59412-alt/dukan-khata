import React, { useState } from 'react';
import {
  Key,
  Copy,
  Check,
  Store,
  QrCode,
  MessageCircle,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleUserProfile } from '../utils/cloudBackupService';
import {
  activateLicenseKey,
  SubscriptionStatus,
  isUserAdmin,
  logPaymentProofRequest,
  OFFICIAL_UPI_ID,
} from '../utils/licenseService';

interface PaywallScreenProps {
  currentUser: GoogleUserProfile | null;
  subscription: SubscriptionStatus;
  onLoginWithGoogle: () => void;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
  onActivationSuccess: (expiresAt: string) => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  currentUser,
  subscription,
  onLoginWithGoogle,
  onLogout,
  onOpenAdminPanel,
  onActivationSuccess,
}) => {
  // Step 2: Key Activation State
  const [enteredKey, setEnteredKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  // Step 3: Payment & Copy State
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSendingProof, setIsSendingProof] = useState(false);
  const [proofSent, setProofSent] = useState(false);

  // Copy UPI ID
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(OFFICIAL_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#38BDF8', '#F59E0B'],
    });
  };

  // Step 2: Unlock App Handler
  const handleUnlockApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanKey = enteredKey.trim();
    if (!cleanKey) {
      setActivationError('Key already used or invalid.');
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      const result = await activateLicenseKey(cleanKey, currentUser);
      setIsActivating(false);

      if (result.success && result.expiresAt) {
        triggerConfetti();
        onActivationSuccess(result.expiresAt);
      } else {
        setActivationError(result.message || 'Key already used or invalid.');
      }
    } catch {
      setIsActivating(false);
      setActivationError('Key already used or invalid.');
    }
  };

  // Step 3: Send Payment Proof for Key Handler
  const handleSendPaymentProof = async () => {
    if (!currentUser) return;
    setIsSendingProof(true);

    try {
      // 1. Simultaneously log record in Firestore 'payment_requests'
      await logPaymentProofRequest(
        currentUser,
        'WhatsApp Payment Proof (9040425743)'
      );
      setProofSent(true);
      setTimeout(() => setProofSent(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingProof(false);
    }

    // 2. Open WhatsApp to 9040425743 with exact prefilled text
    const message = `Hello Admin, I have paid ₹999 for DukaanPro 1-Year Pass. My Login Email: ${currentUser.email || ''}. Please send my activation key.`;
    const whatsappUrl = `https://wa.me/919040425743?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // UPI QR Code Image (UPI Intent)
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(
    OFFICIAL_UPI_ID
  )}&pn=DukaanPro&am=999&cu=INR&tn=DukaanPro%201%20Year%20Pass`;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 pb-20 selection:bg-emerald-500/30">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between py-3 px-4 mb-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
            <Store className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">DukaanPro</h1>
            <p className="text-[11px] text-slate-400">Digital Shop Manager</p>
          </div>
        </div>

        {/* User Info & Admin Controls */}
        <div className="flex items-center gap-2">
          {currentUser && isUserAdmin(currentUser.email) && (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
            >
              Admin Panel
            </button>
          )}

          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* ========================================================================= */}
        {/* STEP 1: GOOGLE LOGIN */}
        {/* ========================================================================= */}
        {!currentUser ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Welcome</h2>
              <p className="text-xs text-slate-400">
                Sign in to access your shop khata and staff attendance.
              </p>
            </div>

            <button
              id="btn-google-login"
              onClick={onLoginWithGoogle}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <>
            {/* Signed-in user badge */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                1-Year Pass Inactive
              </span>
            </div>

            {/* ========================================================================= */}
            {/* STEP 2: HAVE A KEY? (ACTIVATION) */}
            {/* ========================================================================= */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
              <div>
                <h2 className="text-sm font-bold text-white">Enter License Key</h2>
                <p className="text-[11px] text-slate-400">Have an activation key? Enter it below.</p>
              </div>

              <form onSubmit={handleUnlockApp} className="space-y-3">
                <input
                  type="text"
                  value={enteredKey}
                  onChange={(e) => {
                    setEnteredKey(e.target.value.toUpperCase());
                    setActivationError(null);
                  }}
                  placeholder="Paste your key here"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm tracking-wide uppercase placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  disabled={isActivating}
                />

                {activationError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{activationError}</span>
                  </div>
                )}

                <button
                  id="btn-unlock-app"
                  type="submit"
                  disabled={isActivating || !enteredKey.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActivating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Unlock App</span>
                  )}
                </button>
              </form>
            </div>

            {/* ========================================================================= */}
            {/* STEP 3: GET KEY (PAYMENT & PROOF) */}
            {/* ========================================================================= */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Buy 1-Year Pass (₹999)</h2>
                  <p className="text-[11px] text-slate-400">Scan QR or use UPI ID to pay</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ₹999 / Year
                </span>
              </div>

              {/* QR Code and UPI ID */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-white shrink-0">
                  <img
                    src={qrCodeImgSrc}
                    alt="UPI QR Code"
                    className="w-24 h-24 object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">UPI ID:</span>
                  <div className="flex items-center justify-between gap-1 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-xs font-mono font-bold text-white truncate select-all">
                      {OFFICIAL_UPI_ID}
                    </span>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy UPI"
                    >
                      {copiedUpi ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Pay via Google Pay, PhonePe, or Paytm</p>
                </div>
              </div>

              {/* Send Payment Proof Action Button */}
              <button
                id="btn-send-payment-proof"
                onClick={handleSendPaymentProof}
                disabled={isSendingProof}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSendingProof ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Proof...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Payment Proof for Key</span>
                  </>
                )}
              </button>

              {proofSent && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Request logged. Opening WhatsApp to 9040425743...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
