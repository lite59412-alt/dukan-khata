import React, { useState } from 'react';
import {
  FlaskConical,
  LogOut,
  Trash2,
  LogIn,
  AlertTriangle,
  X,
  MessageCircleOff,
  CheckCircle2,
} from 'lucide-react';
import { ENABLE_GUEST_MODE, exitGuestLogin } from '../utils/guestAuth';
import { clearGuestSessionStorage, createInitialGuestAppState, saveGuestAppState } from '../utils/guestSession';
import { Language, AppStateData } from '../types';

interface GuestModeBannerProps {
  language: Language;
  onExitGuest: () => void;
  onResetGuestData?: (freshState: AppStateData) => void;
}

export const GuestModeBanner: React.FC<GuestModeBannerProps> = ({
  language,
  onExitGuest,
  onResetGuestData,
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'exit' | 'real_login' | 'clear'>('exit');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!ENABLE_GUEST_MODE) {
    return null;
  }

  // Handle confirmed action
  const handleExecuteConfirmedAction = async () => {
    setIsProcessing(true);

    try {
      if (confirmAction === 'clear') {
        clearGuestSessionStorage();
        const fresh = createInitialGuestAppState();
        saveGuestAppState(fresh);
        if (onResetGuestData) {
          onResetGuestData(fresh);
        }
        setShowExitConfirm(false);
      } else {
        // 'exit' or 'real_login'
        await exitGuestLogin();
        setShowExitConfirm(false);
        onExitGuest();
      }
    } catch (e) {
      console.error('Error executing guest action:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Top Floating Guest Mode Warning Banner */}
      <div className="w-full bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-amber-200 px-3 py-2 text-xs shadow-md animate-in slide-in-from-top-2">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left badge & warning */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              <span>Guest/Test Mode</span>
            </span>
            <p className="text-[11px] text-amber-200/90 truncate leading-tight font-medium">
              {language === 'hi'
                ? 'आप अस्थायी गेस्ट मोड में हैं। सत्र समाप्त होने पर सभी टेस्ट डेटा हटा दिया जाएगा।'
                : 'You are using temporary Guest Mode. Your data will be deleted when this session ends.'}
            </p>
          </div>

          {/* Right action pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Clear Data */}
            <button
              type="button"
              onClick={() => {
                setConfirmAction('clear');
                setShowExitConfirm(true);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition-colors flex items-center gap-1"
              title="Reset sample guest test data"
            >
              <Trash2 className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Clear Data</span>
            </button>

            {/* Login with Real Account */}
            <button
              type="button"
              onClick={() => {
                setConfirmAction('real_login');
                setShowExitConfirm(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Switch to Real Account"
            >
              <LogIn className="w-3 h-3" />
              <span>Login Real</span>
            </button>

            {/* Exit Guest Mode */}
            <button
              type="button"
              onClick={() => {
                setConfirmAction('exit');
                setShowExitConfirm(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
              title="Exit Guest Mode"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Small Notice: WhatsApp Sending Disabled in Guest Mode */}
        <div className="max-w-2xl mx-auto pt-1 flex items-center gap-1.5 text-[10px] text-amber-300/70">
          <MessageCircleOff className="w-3 h-3 text-amber-400/80 shrink-0" />
          <span>
            {language === 'hi'
              ? 'टेस्ट मोड: सुरक्षा के लिए वास्तविक व्हाट्सएप संदेश भेजना अक्षम (disabled) है।'
              : 'Test mode: Automatic WhatsApp sending is disabled in guest mode.'}
          </span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-amber-500/30 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {confirmAction === 'clear'
                    ? 'Clear Guest Test Data?'
                    : confirmAction === 'real_login'
                    ? 'Login with Real Account?'
                    : 'Exit Guest Mode?'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {confirmAction === 'clear'
                    ? 'This will reset your temporary guest test data to initial clean sample records.'
                    : 'All guest test data will be deleted. Continue?'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p>• In-memory temporary entries will be purged.</p>
              <p>• Real shop accounts and permanent data will not be affected.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                  confirmAction === 'real_login'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/40'
                }`}
              >
                {isProcessing
                  ? 'Processing...'
                  : confirmAction === 'real_login'
                  ? 'Yes, Open Login'
                  : confirmAction === 'clear'
                  ? 'Yes, Clear Data'
                  : 'Yes, Exit Guest Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
