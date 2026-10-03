import { AppStateData } from '../types';
import { GoogleUserProfile } from './cloudBackupService';
import { getTodayDateString } from './formatters';

const GUEST_STORAGE_PREFIX = 'dukankhata_guest_';
const GUEST_USER_KEY = `${GUEST_STORAGE_PREFIX}session_user`;
const GUEST_STATE_KEY = `${GUEST_STORAGE_PREFIX}session_state`;

// In-memory cache for ultra-fast, zero-disk access
let inMemoryGuestState: AppStateData | null = null;
let inMemoryGuestUser: GoogleUserProfile | null = null;

/**
 * Checks if current user is in Guest/Test mode
 */
export function isGuestUser(user?: GoogleUserProfile | null): boolean {
  if (!user) return false;
  return Boolean(user.isGuest === true || user.authType === 'guest');
}

/**
 * Retrieves the current guest user profile from memory or sessionStorage
 */
export function getGuestSessionUser(): GoogleUserProfile | null {
  if (inMemoryGuestUser) return inMemoryGuestUser;

  try {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem(GUEST_USER_KEY);
      if (saved) {
        inMemoryGuestUser = JSON.parse(saved);
        return inMemoryGuestUser;
      }
    }
  } catch (err) {
    console.warn('Failed reading guest user from sessionStorage:', err);
  }

  return null;
}

/**
 * Saves guest user in memory and sessionStorage only
 * NEVER uses localStorage.
 */
export function saveGuestSessionUser(user: GoogleUserProfile | null): void {
  inMemoryGuestUser = user;

  try {
    if (typeof sessionStorage !== 'undefined') {
      if (user) {
        sessionStorage.setItem(GUEST_USER_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(GUEST_USER_KEY);
      }
    }
  } catch (err) {
    console.warn('Failed writing guest user to sessionStorage:', err);
  }
}

/**
 * Creates temporary initial guest app state pre-seeded with sample testing records
 * so the guest can immediately test Udhari, Staff, Supplier, Reports, and Galla.
 */
export function createInitialGuestAppState(): AppStateData {
  const today = getTodayDateString();

  return {
    settings: {
      shopName: 'Demo Kirana Store (Guest)',
      ownerName: 'Guest Dukandar',
      phone: '9876543210',
      upiId: 'guestdemo@okhdfcbank',
      address: 'Shop No. 12, Main Market',
      language: 'en',
      currency: '₹',
      autoBackupDaily: false,
      lastBackupDate: 'Temporary Test Mode',
      workingDaysPerMonth: 26,
      voiceAddUdhariEnabled: true,
    },
    staffList: [
      {
        id: 'guest-staff-1',
        name: 'Raju Verma',
        phone: '9876500001',
        role: 'Sales Helper',
        basicSalary: 12000,
        joinDate: '2026-01-15',
        avatarBg: 'bg-emerald-500',
        qrCodeId: 'STAFF_QR_RAJU_VERMA_TEST',
      },
      {
        id: 'guest-staff-2',
        name: 'Mohan Lal',
        phone: '9876500002',
        role: 'Delivery Boy',
        basicSalary: 10000,
        joinDate: '2026-03-01',
        avatarBg: 'bg-indigo-500',
        qrCodeId: 'STAFF_QR_MOHAN_LAL_TEST',
      },
    ],
    attendance: [
      {
        id: 'guest-att-1',
        staffId: 'guest-staff-1',
        date: today,
        status: 'present',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        overtimeHours: 1,
        lateMinutes: 0,
      },
      {
        id: 'guest-att-2',
        staffId: 'guest-staff-2',
        date: today,
        status: 'present',
        checkInTime: '09:15',
        checkOutTime: '18:00',
        overtimeHours: 0,
        lateMinutes: 15,
      },
    ],
    salaryAdjustments: {},
    salaryPayments: [],
    customerPayments: [],
    udhariList: [
      {
        id: 'guest-udhari-1',
        customerName: 'Ramesh Sharma',
        customerPhone: '9876511111',
        itemName: 'Arhar Dal, Basmati Rice',
        quantity: '2 items',
        items: [
          { id: 'item-1', itemName: 'Arhar Dal', quantity: 2, unit: 'kg', price: 140, totalAmount: 280 },
          { id: 'item-2', itemName: 'Basmati Rice', quantity: 1, unit: 'kg', price: 90, totalAmount: 90 },
        ],
        amount: 370,
        date: today,
        dueDate: today,
        isPaid: false,
        note: 'Sample test udhari entry',
      },
      {
        id: 'guest-udhari-2',
        customerName: 'Sunita Devi',
        customerPhone: '9876522222',
        itemName: 'Sugar',
        quantity: '2 kg',
        items: [
          { id: 'item-3', itemName: 'Sugar', quantity: 2, unit: 'kg', price: 45, totalAmount: 90 },
        ],
        amount: 90,
        date: today,
        dueDate: today,
        isPaid: false,
        note: 'Sample test entry',
      },
    ],
    supplierList: [
      {
        id: 'guest-sup-1',
        supplierName: 'Krishna Wholesale Trading',
        supplierPhone: '9876533333',
        itemPurchased: 'Dal & Spices Bulk Sack',
        quantity: '50 kg',
        amount: 5000,
        paidAmount: 2000,
        dueAmount: 3000,
        date: today,
        dueDate: today,
        status: 'partially_paid',
      },
    ],
    supplierPayments: [],
    gallaHistory: [
      {
        id: `galla-${today}`,
        date: today,
        openingCash: 5000,
        cashIn: 850,
        upiIn: 1200,
        cardIn: 0,
        expenseOut: 150,
        actualClosingCash: 5700,
        expectedClosingCash: 5700,
        cashDifference: 0,
        isClosed: false,
      },
    ],
    expenseList: [
      {
        id: 'guest-exp-1',
        title: 'Morning Tea & Biscuits for Staff',
        category: 'Tea & Snacks',
        amount: 150,
        paymentMode: 'cash',
        date: today,
        time: '10:30',
        note: 'Sample test expense',
      },
    ],
    popularUdhariItems: [
      { id: 'pop-1', itemName: 'Chawal (Rice)', defaultPrice: 50, unit: 'kg', createdAt: today, updatedAt: today },
      { id: 'pop-2', itemName: 'Sugar (Cheeni)', defaultPrice: 45, unit: 'kg', createdAt: today, updatedAt: today },
      { id: 'pop-3', itemName: 'Mustard Oil (Tel)', defaultPrice: 150, unit: 'litre', createdAt: today, updatedAt: today },
    ],
    popularSupplierItems: [],
  };
}

/**
 * Saves guest app state in memory and sessionStorage
 * Never saves to localStorage.
 */
export function saveGuestAppState(state: AppStateData): void {
  inMemoryGuestState = state;

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(GUEST_STATE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.warn('Failed saving guest state to sessionStorage:', err);
  }
}

/**
 * Loads guest app state from memory or sessionStorage
 */
export function loadGuestAppState(): AppStateData | null {
  if (inMemoryGuestState) return inMemoryGuestState;

  try {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem(GUEST_STATE_KEY);
      if (saved) {
        inMemoryGuestState = JSON.parse(saved);
        return inMemoryGuestState;
      }
    }
  } catch (err) {
    console.warn('Failed loading guest state from sessionStorage:', err);
  }

  return null;
}

/**
 * Deletes all guest keys from sessionStorage and clears memory
 */
export function clearGuestSessionStorage(): void {
  inMemoryGuestState = null;
  inMemoryGuestUser = null;

  try {
    if (typeof sessionStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(GUEST_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('Error clearing guest sessionStorage:', err);
  }
}
