import React, { useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight, FlaskConical } from 'lucide-react';
import { ENABLE_GUEST_MODE, startGuestLogin } from '../utils/guestAuth';
import { GoogleUserProfile } from '../utils/cloudBackupService';
import { Language } from '../types';

interface GuestLoginButtonProps {
  language: Language;
  onSuccess: (user: GoogleUserProfile) => void;
  onError: (errorMsg: string) => void;
  disabled?: boolean;
}

export const GuestLoginButton: React.FC<GuestLoginButtonProps> = ({
  language,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // If feature flag is disabled, do not render
  if (!ENABLE_GUEST_MODE) {
    return null;
  }

  const handleGuestClick = async () => {
    if (isLoading || disabled) return; // Prevent double taps

    setIsLoading(true);

    try {
      const result = await startGuestLogin();
      setIsLoading(false);

      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        onError(
          result.error ||
            (language === 'hi'
              ? 'गेस्ट मोड शुरू करने में असमर्थ। कृपया पुनः प्रयास करें।'
              : 'Unable to start guest test mode. Please try again.')
        );
      }
    } catch {
      setIsLoading(false);
      onError(
        language === 'hi'
          ? 'गेस्ट मोड शुरू करने में समस्या आई।'
          : 'Something went wrong while starting guest mode.'
      );
    }
  };

  return (
    <div className="w-full space-y-1.5 pt-1">
      <button
        type="button"
        id="btn-guest-login"
        onClick={handleGuestClick}
        disabled={isLoading || disabled}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 border border-amber-500/40 hover:border-amber-500/60 text-amber-300 font-bold text-xs flex items-center justify-between gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Continue as Guest (Test Mode)"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="text-left">
            <span className="block text-white font-bold leading-tight">
              {language === 'hi' ? 'गेस्ट मोड में जारी रखें (Continue as Guest)' : 'Continue as Guest'}
            </span>
            <span className="block text-[10px] text-amber-300/80 font-normal">
              {language === 'hi'
                ? 'बिना लॉगिन के ऐप की जांच करें • अस्थाई टेस्ट'
                : 'Test app without account • Temporary test data'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
          <span className="hidden sm:inline">Try Demo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
