import { AppStateData } from '../types';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getTodayDateString } from './formatters';

export type DataModuleKey =
  | 'udhari'
  | 'supplier'
  | 'staff'
  | 'expense'
  | 'galla'
  | 'attendance'
  | 'payments';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: DataModuleKey;
  moduleLabel: string;
  recordCount: number;
  deletedBy: string;
  deletionReason: string;
  backupCreated: boolean;
  status: 'success' | 'failed' | 'undone';
}

export interface SoftDeleteArchive {
  id: string;
  module: DataModuleKey;
  deletedAt: string;
  deletedBy: string;
  deletionReason: string;
  expiresAt: number; // epoch ms (e.g. 60 seconds)
  previousState: AppStateData;
}

const AUDIT_LOGS_KEY = 'dukankhata_deletion_audit_logs_v1';
const SOFT_DELETE_KEY = 'dukankhata_soft_deleted_archive_v1';
const PRE_DELETE_BACKUP_KEY = 'dukankhata_pre_delete_backup_v1';

export interface ModuleInfo {
  key: DataModuleKey;
  label: string;
  iconName: string;
  description: string;
  itemsWillBeDeleted: string[];
  getRecordCount: (state: AppStateData) => number;
}

export const DATA_MODULES: ModuleInfo[] = [
  {
    key: 'udhari',
    label: 'Clear Udhari Data',
    iconName: 'BookOpen',
    description: 'Deletes customer udhari balances and credit registers',
    itemsWillBeDeleted: [
      'All customer udhari records and credit ledgers',
      'Pending balance logs and due reminders',
      'Item-wise udhari breakdown logs',
      'Customer payment allocations linked to udhari',
    ],
    getRecordCount: (state: AppStateData) => state.udhariList?.length || 0,
  },
  {
    key: 'supplier',
    label: 'Clear Supplier Data',
    iconName: 'Truck',
    description: 'Deletes wholesale purchases, supplier bills, and supplier dues',
    itemsWillBeDeleted: [
      'All supplier purchase invoices and bills',
      'Supplier pending balances and due ledgers',
      'Supplier purchase history and items',
      'Supplier payment allocation records',
    ],
    getRecordCount: (state: AppStateData) =>
      (state.supplierList?.length || 0) + (state.supplierPayments?.length || 0),
  },
  {
    key: 'staff',
    label: 'Clear Staff Data',
    iconName: 'Users',
    description: 'Deletes staff member profiles, basic salaries, and salary rules',
    itemsWillBeDeleted: [
      'All staff member profiles and phone numbers',
      'Basic salary, hourly, and daily rate rules',
      'Advance salary and loan adjustment records',
      'Staff QR code identifiers and badge cards',
    ],
    getRecordCount: (state: AppStateData) => state.staffList?.length || 0,
  },
  {
    key: 'expense',
    label: 'Clear Expense Data',
    iconName: 'TrendingDown',
    description: 'Deletes daily shop overheads, utilities, and expense records',
    itemsWillBeDeleted: [
      'All recorded shop daily expenses (rent, electricity, tea, etc.)',
      'Expense categories and payment modes',
      'Expense notes, receipts, and timestamps',
    ],
    getRecordCount: (state: AppStateData) => state.expenseList?.length || 0,
  },
  {
    key: 'galla',
    label: 'Clear Galla Data',
    iconName: 'Coins',
    description: 'Resets daily cash register and clears historical closing logs',
    itemsWillBeDeleted: [
      'Historical daily cash counter register logs',
      'Opening and closing cash discrepancy history',
      'Cash in / cash out audit records (resets today to 0 balance)',
    ],
    getRecordCount: (state: AppStateData) => state.gallaHistory?.length || 0,
  },
  {
    key: 'attendance',
    label: 'Clear Attendance Data',
    iconName: 'Calendar',
    description: 'Deletes attendance logs, check-ins, late minutes, and overtime',
    itemsWillBeDeleted: [
      'All attendance records across all months',
      'Check-in and check-out timestamps',
      'Overtime hours and overtime payment logs',
      'Late arrival minutes and half-day records',
      '(Note: Staff profiles and salary rules are safely preserved)',
    ],
    getRecordCount: (state: AppStateData) => state.attendance?.length || 0,
  },
  {
    key: 'payments',
    label: 'Clear Payment History',
    iconName: 'CreditCard',
    description: 'Deletes salary disbursements and customer payment receipts',
    itemsWillBeDeleted: [
      'Historical staff salary payment vouchers and slips',
      'Customer udhari payment receipts and reference numbers',
      'Supplier payment transaction history',
      '(Note: Active balances remain preserved)',
    ],
    getRecordCount: (state: AppStateData) =>
      (state.salaryPayments?.length || 0) +
      (state.customerPayments?.length || 0) +
      (state.supplierPayments?.length || 0),
  },
];

/**
 * Re-authenticate with Google Popup if user has cloud login enabled
 */
export async function reauthenticateWithGoogle(): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      email: result.user.email || '',
    };
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Re-authentication was cancelled by user.' };
    }
    return {
      success: false,
      error: err?.message || 'Google re-authentication failed.',
    };
  }
}

/**
 * Create an exportable pre-deletion backup JSON file and trigger browser download
 */
export function exportPreDeletionBackup(
  state: AppStateData,
  moduleKey: DataModuleKey,
  userEmail?: string
): string {
  const timestamp = new Date().toISOString();
  const dateFormatted = getTodayDateString();
  const filename = `DukaanPro_${moduleKey}_pre_delete_backup_${dateFormatted}.json`;

  const backupPayload = {
    app: 'DukaanPro',
    exportType: 'pre_deletion_backup',
    targetModule: moduleKey,
    timestamp,
    userEmail: userEmail || 'Store Owner',
    fullStateSnapshot: state,
  };

  // 1. Save to local storage for quick in-app restore
  try {
    localStorage.setItem(PRE_DELETE_BACKUP_KEY, JSON.stringify(backupPayload));
  } catch (e) {
    console.error('Failed to store pre-delete backup in localStorage:', e);
  }

  // 2. Download JSON file to user's device
  try {
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download backup file failed:', err);
  }

  return filename;
}

/**
 * Retrieves the last pre-deletion backup if available
 */
export function getLastPreDeletionBackup(): {
  timestamp: string;
  targetModule: DataModuleKey;
  fullStateSnapshot: AppStateData;
} | null {
  try {
    const saved = localStorage.getItem(PRE_DELETE_BACKUP_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return null;
}

/**
 * Perform module-specific deletion with soft-delete metadata and return updated AppStateData
 */
export function executeModuleDeletion(
  currentState: AppStateData,
  moduleKey: DataModuleKey,
  userEmail: string,
  deletionReason: string
): {
  newState: AppStateData;
  deletedCount: number;
  archiveId: string;
} {
  const archiveId = `archive-${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Create deep clone of previous state for soft-delete & undo
  const previousState: AppStateData = JSON.parse(JSON.stringify(currentState));

  let deletedCount = 0;
  const newState: AppStateData = JSON.parse(JSON.stringify(currentState));

  switch (moduleKey) {
    case 'udhari':
      deletedCount = (currentState.udhariList || []).length;
      newState.udhariList = [];
      newState.popularUdhariItems = [];
      break;

    case 'supplier':
      deletedCount =
        (currentState.supplierList || []).length +
        (currentState.supplierPayments || []).length;
      newState.supplierList = [];
      newState.supplierPayments = [];
      newState.popularSupplierItems = [];
      break;

    case 'staff':
      deletedCount = (currentState.staffList || []).length;
      newState.staffList = [];
      newState.salaryAdjustments = {};
      newState.salaryPayments = [];
      break;

    case 'expense':
      deletedCount = (currentState.expenseList || []).length;
      newState.expenseList = [];
      break;

    case 'galla':
      deletedCount = (currentState.gallaHistory || []).length;
      const today = getTodayDateString();
      newState.gallaHistory = [
        {
          id: `galla-${today}`,
          date: today,
          openingCash: 0,
          cashIn: 0,
          upiIn: 0,
          cardIn: 0,
          expenseOut: 0,
          actualClosingCash: 0,
          expectedClosingCash: 0,
          cashDifference: 0,
          isClosed: false,
        },
      ];
      break;

    case 'attendance':
      deletedCount = (currentState.attendance || []).length;
      newState.attendance = [];
      break;

    case 'payments':
      deletedCount =
        (currentState.salaryPayments?.length || 0) +
        (currentState.customerPayments?.length || 0) +
        (currentState.supplierPayments?.length || 0);
      newState.salaryPayments = [];
      newState.customerPayments = [];
      newState.supplierPayments = [];
      break;
  }

  // Soft delete archive saved with 60-second expiration window
  const softArchive: SoftDeleteArchive = {
    id: archiveId,
    module: moduleKey,
    deletedAt: nowIso,
    deletedBy: userEmail,
    deletionReason: deletionReason || 'Manual module purge from Data Management',
    expiresAt: Date.now() + 60 * 1000, // 60 seconds
    previousState,
  };

  try {
    localStorage.setItem(SOFT_DELETE_KEY, JSON.stringify(softArchive));
  } catch (err) {
    console.error('Failed to save soft-delete archive:', err);
  }

  return { newState, deletedCount, archiveId };
}

/**
 * Undo module deletion within expiration window
 */
export function undoModuleDeletion(
  archiveId: string,
  currentState: AppStateData
): {
  success: boolean;
  restoredState?: AppStateData;
  module?: DataModuleKey;
  message: string;
} {
  try {
    const raw = localStorage.getItem(SOFT_DELETE_KEY);
    if (!raw) {
      return { success: false, message: 'No undo archive found or undo window expired.' };
    }

    const archive: SoftDeleteArchive = JSON.parse(raw);
    if (archive.id !== archiveId) {
      return { success: false, message: 'Archive ID mismatch.' };
    }

    if (Date.now() > archive.expiresAt) {
      localStorage.removeItem(SOFT_DELETE_KEY);
      return {
        success: false,
        message: 'Undo window (60s) has expired. Use Restore from Backup.',
      };
    }

    // Restore module data from previousState onto currentState
    const restored: AppStateData = JSON.parse(JSON.stringify(currentState));
    const prev = archive.previousState;

    switch (archive.module) {
      case 'udhari':
        restored.udhariList = prev.udhariList || [];
        restored.popularUdhariItems = prev.popularUdhariItems || [];
        break;
      case 'supplier':
        restored.supplierList = prev.supplierList || [];
        restored.supplierPayments = prev.supplierPayments || [];
        restored.popularSupplierItems = prev.popularSupplierItems || [];
        break;
      case 'staff':
        restored.staffList = prev.staffList || [];
        restored.salaryAdjustments = prev.salaryAdjustments || {};
        restored.salaryPayments = prev.salaryPayments || [];
        break;
      case 'expense':
        restored.expenseList = prev.expenseList || [];
        break;
      case 'galla':
        restored.gallaHistory = prev.gallaHistory || [];
        break;
      case 'attendance':
        restored.attendance = prev.attendance || [];
        break;
      case 'payments':
        restored.salaryPayments = prev.salaryPayments || [];
        restored.customerPayments = prev.customerPayments || [];
        restored.supplierPayments = prev.supplierPayments || [];
        break;
    }

    // Clear soft archive after successful undo
    localStorage.removeItem(SOFT_DELETE_KEY);

    return {
      success: true,
      restoredState: restored,
      module: archive.module,
      message: `${archive.module.toUpperCase()} data has been restored successfully!`,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Failed to undo deletion.' };
  }
}

/**
 * Audit log management
 */
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export async function recordAuditLog(
  entry: Omit<AuditLogEntry, 'id'>,
  userUid?: string
): Promise<AuditLogEntry> {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  try {
    const existing = getAuditLogs();
    const updated = [fullEntry, ...existing].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));

    // Also persist audit log to Cloud Firestore if userUid is available
    if (userUid) {
      await addDoc(collection(db, 'users', userUid, 'audit_logs'), {
        ...fullEntry,
        loggedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('Error recording audit log:', err);
  }

  return fullEntry;
}
