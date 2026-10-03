import { AppStateData } from './types';
import { getTodayDateString } from './utils/formatters';

const STORAGE_KEY_PREFIX = 'dukankhata_user_state_';
const LEGACY_STORAGE_KEY = 'dukankhata_state_v1';

/**
 * Creates a completely clean and empty initial application state.
 * No mock/dummy data is included. All balances, sales, dues, and lists start at zero/empty.
 */
export function createEmptyAppState(profile?: { name?: string; email?: string }): AppStateData {
  const today = getTodayDateString();
  const ownerName = profile?.name?.trim() || 'Dukandar';
  const shopName = profile?.name ? `${profile.name.trim()} ki Dukan` : 'Meri Dukan';

  return {
    settings: {
      shopName,
      ownerName,
      phone: '',
      upiId: '',
      address: '',
      language: 'en',
      currency: '₹',
      autoBackupDaily: true,
      lastBackupDate: '',
      workingDaysPerMonth: 26,
    },
    staffList: [],
    attendance: [],
    salaryAdjustments: {},
    salaryPayments: [],
    customerPayments: [],
    udhariList: [],
    supplierList: [],
    supplierPayments: [],
    gallaHistory: [
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
    ],
    expenseList: [],
    popularUdhariItems: [],
    popularSupplierItems: [],
  };
}

/**
 * Detects if any saved state or record contains the old hardcoded mock data
 * (e.g., 'Rajesh Kumar Gupta', 'Ramesh Sharma', demo staff, etc.)
 */
export function isLegacyMockState(data: any): boolean {
  if (!data) return false;
  if (data.settings?.ownerName === 'Rajesh Kumar Gupta') return true;
  if (data.settings?.shopName?.includes('Shree Ganesh Kirana')) return true;
  if (Array.isArray(data.staffList) && data.staffList.some((s: any) => s.name === 'Sonu Sharma' || s.id === 'staff-1')) return true;
  if (Array.isArray(data.udhariList) && data.udhariList.some((u: any) => u.customerName === 'Ramesh Sharma')) return true;
  if (Array.isArray(data.supplierList) && data.supplierList.some((s: any) => s.supplierName === 'Agrawal Grain Wholesalers')) return true;
  return false;
}

/**
 * Loads the initial state for the app or specific user.
 * Automatically discards legacy hardcoded demo data from local storage.
 */
export function getInitialAppState(userUid?: string, profile?: { name?: string; email?: string }): AppStateData {
  try {
    const key = userUid ? `${STORAGE_KEY_PREFIX}${userUid}` : LEGACY_STORAGE_KEY;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && !isLegacyMockState(parsed)) {
        const empty = createEmptyAppState(profile);
        return {
          ...empty,
          ...parsed,
          settings: {
            ...empty.settings,
            ...(parsed.settings || {}),
            ...(profile?.name ? { ownerName: profile.name } : {}),
          },
          staffList: parsed.staffList || [],
          attendance: parsed.attendance || [],
          salaryAdjustments: parsed.salaryAdjustments || {},
          salaryPayments: parsed.salaryPayments || [],
          customerPayments: parsed.customerPayments || [],
          udhariList: parsed.udhariList || [],
          supplierList: parsed.supplierList || [],
          supplierPayments: parsed.supplierPayments || [],
          gallaHistory: parsed.gallaHistory && parsed.gallaHistory.length > 0 ? parsed.gallaHistory : empty.gallaHistory,
          expenseList: parsed.expenseList || [],
        };
      }
    }
  } catch (e) {
    console.error('Failed to load saved state from localStorage:', e);
  }

  // Purge legacy mock data cache if detected
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && isLegacyMockState(JSON.parse(legacy))) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {}

  return createEmptyAppState(profile);
}

/**
 * Saves state to local storage scoped to user UID
 */
export function saveAppState(state: AppStateData, userUid?: string): void {
  try {
    if (isLegacyMockState(state)) return; // Do not save mock data
    // Guest isolation: never persist guest data to permanent localStorage
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dukankhata_guest_session_user')) {
      try {
        const guestUser = JSON.parse(sessionStorage.getItem('dukankhata_guest_session_user') || '{}');
        if (guestUser?.isGuest && (!userUid || userUid === guestUser.uid)) {
          sessionStorage.setItem('dukankhata_guest_session_state', JSON.stringify(state));
          return;
        }
      } catch {}
    }
    const key = userUid ? `${STORAGE_KEY_PREFIX}${userUid}` : LEGACY_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state in localStorage:', e);
  }
}

/**
 * Reset to fresh, clean initial state
 */
export function resetToDemoData(profile?: { name?: string; email?: string }): AppStateData {
  const fresh = createEmptyAppState(profile);
  saveAppState(fresh);
  return fresh;
}
