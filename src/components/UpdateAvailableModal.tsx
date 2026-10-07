import React from 'react';
import {
  Download,
  Rocket,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { VersionControlConfig } from '../utils/versionService';

interface UpdateAvailableModalProps {
  isOpen: boolean;
  currentVersion: string;
  config: VersionControlConfig;
  onClose: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  isOpen,
  currentVersion,
  config,
  onClose,
}) => {
  if (!isOpen) return null;

  // Format release notes if present
  const releaseNotesList: string[] = (() => {
    if (!config.release_notes) return [];
    if (Array.isArray(config.release_notes)) return config.release_notes;
    if (typeof config.release_notes === 'string') {
      return config.release_notes
        .split('\n')
        .map((s) => s.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
    }
    return [];
  })();

  const isMandatory = Boolean(config.is_mandatory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="relative w-full max-w-md bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden text-[var(--color-text-primary)] animate-scale-up">
        {/* Glow Accent Header Gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500" />

        {/* Close Button (if not strictly mandatory) */}
        {!isMandatory && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss for now"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 sm:p-7 space-y-5">
          {/* Hero Icon with Pulsing Effect */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Rocket className="w-7 h-7 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Update Ready</span>
              </div>
              <h2
                id="update-modal-title"
                className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight leading-tight"
              >
                New Update Available!
              </h2>
            </div>
          </div>

          {/* Version Transition Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-[var(--color-border)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] block">
                  Current
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  v{currentVersion}
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mx-1" />

              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  New Version
                </span>
                <span className="text-sm font-mono font-black text-emerald-300">
                  v{config.version}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500 text-slate-950 shadow-sm shrink-0">
              Latest
            </span>
          </div>

          {/* Mandatory Alert Banner (if applicable) */}
          {isMandatory && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important update:</strong> This version includes essential data compatibility and security improvements.
              </span>
            </div>
          )}

          {/* Release Notes / Highlights */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              What&apos;s New in this update:
            </h3>

            {releaseNotesList.length > 0 ? (
              <div className="p-3 rounded-2xl bg-slate-950/50 border border-[var(--color-border)] max-h-44 overflow-y-auto space-y-2 text-xs">
                {releaseNotesList.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[var(--color-text-primary)] leading-relaxed">
                      {note}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-[var(--color-border)]">
                Includes overall performance enhancements, staff attendance optimizations, and rolling ledger improvements.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Primary Download Update Button */}
            <a
              href={config.update_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40"
            >
              <Download className="w-4 h-4" />
              <span>Download Update</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* Later / Dismiss Button (if not strictly mandatory) */}
            {!isMandatory ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs rounded-xl transition-colors cursor-pointer border border-[var(--color-border)]"
              >
                Remind Me Later
              </button>
            ) : (
              <p className="text-center text-[11px] text-[var(--color-text-secondary)] pt-1">
                Please update to continue using the latest features.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
