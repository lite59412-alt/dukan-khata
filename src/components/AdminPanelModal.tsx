import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  X,
  Users,
  CreditCard,
  Unlock,
  CheckCircle2,
  ShieldAlert,
  Rocket,
  Download,
  Sparkles,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { GoogleUserProfile } from '../utils/cloudBackupService';
import {
  CURRENT_APP_VERSION,
  getRemoteVersionConfig,
  saveRemoteVersionConfig,
  VersionControlConfig,
} from '../utils/versionService';
import { UpdateAvailableModal } from './UpdateAvailableModal';
import {
  isUserAdmin,
  createNewLicenseKey,
  fetchAllLicenseKeys,
  fetchAllUsersLog,
  unlockUserForOneYear,
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  AdminLicenseKeyRecord,
  UserLogRecord,
  PaymentRequestRecord,
  ADMIN_EMAIL,
} from '../utils/licenseService';

interface AdminPanelModalProps {
  currentUser: GoogleUserProfile | null;
  onClose: () => void;
  onKeyGenerated?: (key: string) => void;
}

type TabType = 'keys' | 'users' | 'proofs' | 'version';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  currentUser,
  onClose,
  onKeyGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('keys');

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestKey, setLatestKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keysList, setKeysList] = useState<AdminLicenseKeyRecord[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);

  // Registered Users State
  const [usersList, setUsersList] = useState<UserLogRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [unlockingUid, setUnlockingUid] = useState<string | null>(null);

  // Payment Proof Requests State
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestRecord[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(false);
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  // App Version Control State (app_config/version_control)
  const [targetVersion, setTargetVersion] = useState('1.1.0');
  const [updateUrl, setUpdateUrl] = useState('https://dukaankhata.web.app/download');
  const [releaseNotesText, setReleaseNotesText] = useState(
    'New quick 1-tap staff attendance sheet\nRolling balance & salary enhancements\nPerformance improvements and bug fixes'
  );
  const [isMandatoryUpdate, setIsMandatoryUpdate] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [versionSaveSuccess, setVersionSaveSuccess] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const isAdmin = isUserAdmin(currentUser?.email);

  const loadVersionConfig = async () => {
    setIsLoadingVersion(true);
    try {
      const cfg = await getRemoteVersionConfig();
      if (cfg) {
        if (cfg.version) setTargetVersion(cfg.version);
        if (cfg.update_url) setUpdateUrl(cfg.update_url);
        if (cfg.release_notes) {
          if (Array.isArray(cfg.release_notes)) {
            setReleaseNotesText(cfg.release_notes.join('\n'));
          } else {
            setReleaseNotesText(String(cfg.release_notes));
          }
        }
        setIsMandatoryUpdate(Boolean(cfg.is_mandatory));
      }
    } finally {
      setIsLoadingVersion(false);
    }
  };

  const loadKeys = async () => {
    if (!isAdmin) return;
    setIsLoadingKeys(true);
    try {
      const records = await fetchAllLicenseKeys();
      setKeysList(records);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const records = await fetchAllUsersLog();
      setUsersList(records);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadProofs = async () => {
    if (!isAdmin) return;
    setIsLoadingProofs(true);
    try {
      const records = await fetchPaymentRequests();
      setPaymentRequests(records);
    } finally {
      setIsLoadingProofs(false);
    }
  };

  const handleSaveVersion = async () => {
    setIsSavingVersion(true);
    setVersionSaveSuccess(null);
    try {
      await saveRemoteVersionConfig({
        version: targetVersion.trim(),
        update_url: updateUrl.trim(),
        release_notes: releaseNotesText.split('\n').filter(Boolean),
        is_mandatory: isMandatoryUpdate,
      });
      setVersionSaveSuccess(`Version v${targetVersion.trim()} published to Firestore (app_config/version_control)!`);
      setTimeout(() => setVersionSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err?.message || 'Error'}`);
    } finally {
      setIsSavingVersion(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadKeys();
      loadUsers();
      loadProofs();
    }
  }, [isAdmin]);

  // 1. Generate 1-Year Key
  const handleGenerateKey = async () => {
    if (!currentUser?.email) return;
    setIsGenerating(true);
    try {
      const newKey = await createNewLicenseKey(currentUser.email);
      setLatestKey(newKey);
      setCopiedKey(false);
      onKeyGenerated?.(newKey);
      await loadKeys();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = (key: string, isRow: boolean = false) => {
    navigator.clipboard.writeText(key);
    if (isRow) {
      setCopiedRowKey(key);
      setTimeout(() => setCopiedRowKey(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // 2. 1-Tap Unlock 1 Year
  const handleUnlockUser = async (targetUser: UserLogRecord) => {
    if (!currentUser?.email) return;
    setUnlockingUid(targetUser.uid);
    try {
      await unlockUserForOneYear(targetUser.uid, currentUser.email);
      await loadUsers();
    } catch (e: any) {
      alert(`Unlock failed: ${e?.message || 'Error'}`);
    } finally {
      setUnlockingUid(null);
    }
  };

  // 3. Approve Payment Proof Request
  const handleApproveProof = async (req: PaymentRequestRecord) => {
    if (!currentUser?.email) return;
    setProcessingReqId(req.id);
    try {
      await approvePaymentRequest(req.id, req.uid, req.userEmail, currentUser.email);
      await loadProofs();
      await loadUsers();
      await loadKeys();
    } catch (e: any) {
      alert(`Approval failed: ${e?.message || 'Error'}`);
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleRejectProof = async (req: PaymentRequestRecord) => {
    if (!currentUser?.email) return;
    setProcessingReqId(req.id);
    try {
      await rejectPaymentRequest(req.id, currentUser.email);
      await loadProofs();
    } finally {
      setProcessingReqId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-xs w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-5 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Access Denied</h3>
          <p className="text-xs text-slate-400">Owner email required: {ADMIN_EMAIL}</p>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const pendingProofsCount = paymentRequests.filter((p) => p.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Owner Admin Panel</h3>
              <p className="text-[10px] text-slate-400 font-mono">{ADMIN_EMAIL}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'keys'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Generate Key
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Registered Users</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {usersList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('proofs')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'proofs'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Payment Proof Requests</span>
            {pendingProofsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold">
                {pendingProofsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('version');
              loadVersionConfig();
            }}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'version'
                ? 'border-violet-400 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>App Versions</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: GENERATE KEY */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <button
                  id="btn-admin-generate-key"
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Generate 1-Year Key</span>
                    </>
                  )}
                </button>

                {latestKey && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                    <span className="font-mono text-base font-bold text-emerald-400 tracking-wider select-all">
                      {latestKey}
                    </span>
                    <button
                      onClick={() => handleCopyKey(latestKey)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Created Keys List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Generated Keys ({keysList.length})</span>
                  <button onClick={loadKeys} className="hover:text-white">
                    <RefreshCw className={`w-3 h-3 ${isLoadingKeys ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-850 max-h-56 overflow-y-auto">
                  {keysList.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-500">No keys generated yet.</p>
                  ) : (
                    keysList.map((k) => (
                      <div key={k.key} className="p-2.5 px-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{k.key}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                k.isUsed
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {k.isUsed ? 'Used' : 'Ready'}
                            </span>
                          </div>
                          {k.usedByEmail && (
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                              Used by: {k.usedByEmail}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleCopyKey(k.key, true)}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Copy"
                        >
                          {copiedRowKey === k.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTERED USERS */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Registered Users ({usersList.length})</span>
                <button onClick={loadUsers} className="hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-850 max-h-72 overflow-y-auto">
                {usersList.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">No registered users yet.</p>
                ) : (
                  usersList.map((u) => {
                    const isActive =
                      u.isSubscribed &&
                      u.subscriptionExpiresAt &&
                      new Date(u.subscriptionExpiresAt).getTime() > Date.now();

                    return (
                      <div
                        key={u.uid}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{u.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isActive ? 'Active' : 'Locked'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>

                        <button
                          onClick={() => handleUnlockUser(u)}
                          disabled={unlockingUid === u.uid}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                            isActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {unlockingUid === u.uid ? 'Unlocking...' : 'Unlock 1 Year'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT PROOF REQUESTS */}
          {activeTab === 'proofs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Payment Proof Requests ({paymentRequests.length})</span>
                <button onClick={loadProofs} className="hover:text-white">
                  <RefreshCw className={`w-3 h-3 ${isLoadingProofs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-850 max-h-72 overflow-y-auto">
                {paymentRequests.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">No payment requests found.</p>
                ) : (
                  paymentRequests.map((req) => (
                    <div key={req.id} className="p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{req.userName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{req.userEmail}</p>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleRejectProof(req)}
                            disabled={processingReqId === req.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveProof(req)}
                            disabled={processingReqId === req.id}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          >
                            {processingReqId === req.id ? 'Approving...' : 'Approve & Send Key'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APP VERSION CONTROL */}
          {activeTab === 'version' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-violet-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Firestore Version Control</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Collection: app_config / Document: version_control</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadVersionConfig}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Reload from Firestore"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVersion ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400">Current App Code Version:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    v{CURRENT_APP_VERSION}
                  </span>
                </div>

                {versionSaveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{versionSaveSuccess}</span>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Target Version in Firestore (e.g., 1.1.0)
                    </label>
                    <input
                      type="text"
                      value={targetVersion}
                      onChange={(e) => setTargetVersion(e.target.value)}
                      placeholder="1.1.0"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Download Update URL (update_url)
                    </label>
                    <input
                      type="url"
                      value={updateUrl}
                      onChange={(e) => setUpdateUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Release Notes (One item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={releaseNotesText}
                      onChange={(e) => setReleaseNotesText(e.target.value)}
                      placeholder="Enter release notes..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-900 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={isMandatoryUpdate}
                      onChange={(e) => setIsMandatoryUpdate(e.target.checked)}
                      className="rounded border-slate-700 text-violet-600 focus:ring-0"
                    />
                    <span>Mark as Mandatory Update (User cannot dismiss)</span>
                  </label>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveVersion}
                      disabled={isSavingVersion}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSavingVersion ? 'Saving to Firestore...' : 'Publish Version to Firestore'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(true)}
                      className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Preview how users see the update popup"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Preview Popup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && (
        <UpdateAvailableModal
          isOpen={previewModalOpen}
          currentVersion={CURRENT_APP_VERSION}
          config={{
            version: targetVersion,
            update_url: updateUrl,
            release_notes: releaseNotesText.split('\n').filter(Boolean),
            is_mandatory: isMandatoryUpdate,
          }}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </div>
  );
};
