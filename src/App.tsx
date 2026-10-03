import React, { useState, useEffect, useRef } from 'react';
import {
  AppStateData,
  Staff,
  AttendanceStatus,
  AttendanceRecord,
  UdhariEntry,
  SupplierDueEntry,
  SupplierPayment,
  DailyGalla,
  ExpenseEntry,
  ShopSettings,
  SalaryAdjustment,
  SalaryRules,
  StaffSalaryPayment,
  CustomerPaymentRecord,
} from './types';
import { getInitialAppState, saveAppState, createEmptyAppState } from './mockData';
import { getTodayDateString } from './utils/formatters';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  GoogleUserProfile,
  getSavedGoogleUser,
  saveGoogleUser,
  getAutoSyncPreference,
  signInWithGooglePopup,
  signOutGoogle,
  saveUserDataToFirestore,
  loadUserDataFromFirestore,
} from './utils/cloudBackupService';
import { SubscriptionStatus, checkUserSubscription } from './utils/licenseService';
import { CheckCircle2, Cloud, AlertCircle, RefreshCw } from 'lucide-react';

// Components
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { StaffTab } from './components/StaffTab';
import { UdhariTab } from './components/UdhariTab';
import { SupplierTab } from './components/SupplierTab';
import { ReportsTab } from './components/ReportsTab';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminPanelModal } from './components/AdminPanelModal';
import { LoginScreen } from './components/LoginScreen';
import { GuestModeBanner } from './components/GuestModeBanner';
import { ENABLE_GUEST_MODE, exitGuestLogin } from './utils/guestAuth';
import {
  isGuestUser,
  getGuestSessionUser,
  saveGuestSessionUser,
  loadGuestAppState,
  saveGuestAppState,
  createInitialGuestAppState,
} from './utils/guestSession';
import {
  registerGuestUnloadHandlers,
  detectAndCleanupStaleGuestSession,
} from './utils/guestCleanup';

// Modals
import { DailyGallaModal } from './components/DailyGallaModal';
import { ExpensesModal } from './components/ExpensesModal';
import { SalarySlipModal } from './components/SalarySlipModal';
import { QRScannerModal } from './components/QRScannerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { SettingsModal } from './components/SettingsModal';
import { Language } from './types';

export default function App() {
  // Firebase Google Auth & Cloud Sync / Temporary Guest Session
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(() => {
    if (ENABLE_GUEST_MODE) {
      const guest = getGuestSessionUser();
      if (guest) return guest;
    }
    return getSavedGoogleUser();
  });

  const [state, setState] = useState<AppStateData>(() => {
    let initialLanguage: Language = 'en';
    try {
      const savedLang = localStorage.getItem('dukankhata_preferred_language') as Language | null;
      if (savedLang && ['en', 'hi', 'or', 'bn'].includes(savedLang)) {
        initialLanguage = savedLang;
      }
    } catch {}

    if (ENABLE_GUEST_MODE) {
      const guestUser = getGuestSessionUser();
      if (guestUser) {
        const guestData = loadGuestAppState() || createInitialGuestAppState();
        guestData.settings.language = initialLanguage;
        return guestData;
      }
    }
    const initialState = getInitialAppState(getSavedGoogleUser()?.uid, getSavedGoogleUser() || undefined);
    initialState.settings.language = initialLanguage;
    return initialState;
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(false);

  // 1-Year License & Subscription State
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isSubscribed: false,
    subscriptionExpiresAt: null,
    activatedKey: null,
    daysRemaining: 0,
    isValid: false,
  });
  const [checkingSubscription, setCheckingSubscription] = useState<boolean>(true);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-dismiss sync notification after 3.5 seconds
  useEffect(() => {
    if (syncNotification) {
      const timer = setTimeout(() => setSyncNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [syncNotification]);

  // Guest Mode Session Unload & Clean Startup Handlers
  useEffect(() => {
    if (ENABLE_GUEST_MODE) {
      const unregister = registerGuestUnloadHandlers();
      return () => {
        unregister();
      };
    }
  }, []);

  const hasLoadedCloudData = useRef(false);

  // Rule 2 & 3: Listen to Firebase Auth state, verify 1-Year license, and load/save Firestore data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          const guestUser: GoogleUserProfile = {
            uid: firebaseUser.uid,
            name: 'Guest Dukandar (Test Mode)',
            email: '',
            photoURL: undefined,
            isGuest: true,
            authType: 'guest',
            sessionMode: 'temporary',
          };
          setCurrentUser(guestUser);
          saveGuestSessionUser(guestUser);
          setSubscription({
            isSubscribed: true,
            subscriptionExpiresAt: '2099-12-31T23:59:59.000Z',
            activatedKey: 'GUEST-TEST-MODE',
            daysRemaining: 9999,
            isValid: true,
          });
          setCheckingSubscription(false);
          const guestData = loadGuestAppState() || createInitialGuestAppState();
          setState(guestData);
          saveGuestAppState(guestData);
          return;
        }

        const userProfile: GoogleUserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Dukandar',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
        };
        setCurrentUser(userProfile);
        saveGoogleUser(userProfile);

        // RULE 3: Auto-Login check (isSubscribed === true AND subscriptionExpiresAt > new Date())
        try {
          const subStatus = await checkUserSubscription(firebaseUser.uid);
          setSubscription(subStatus);
        } catch (subErr) {
          console.error('Subscription verification failed:', subErr);
        } finally {
          setCheckingSubscription(false);
        }

        if (!hasLoadedCloudData.current) {
          hasLoadedCloudData.current = true;
          try {
            setIsSyncing(true);
            const cloudData = await loadUserDataFromFirestore(firebaseUser.uid);
            if (cloudData) {
              // Existing user - load saved data from Cloud Firestore
              setState(cloudData);
              saveAppState(cloudData, firebaseUser.uid);
              setSyncNotification({
                type: 'success',
                message: `Firestore se data load ho gaya (${userProfile.name})`,
              });
            } else {
              // New user without existing Firestore doc - initialize blank profile structure
              const blankState = createEmptyAppState({
                name: userProfile.name,
                email: userProfile.email,
              });
              await saveUserDataToFirestore(firebaseUser.uid, userProfile, blankState);
              setState(blankState);
              saveAppState(blankState, firebaseUser.uid);
            }
          } catch (err: any) {
            console.error('Firestore init error:', err);
          } finally {
            setIsSyncing(false);
          }
        }
      } else {
        setCurrentUser(null);
        saveGoogleUser(null);
        hasLoadedCloudData.current = false;
        setSubscription({
          isSubscribed: false,
          subscriptionExpiresAt: null,
          activatedKey: null,
          daysRemaining: 0,
          isValid: false,
        });
        setCheckingSubscription(false);
        // Reset to clean empty state when not authenticated
        const empty = createEmptyAppState();
        setState(empty);
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In button handler
  const handleLoginWithGoogle = async () => {
    try {
      setIsSyncing(true);
      const userProfile = await signInWithGooglePopup();
      setCurrentUser(userProfile);

      // Verify 1-Year subscription for logged in user
      const subStatus = await checkUserSubscription(userProfile.uid);
      setSubscription(subStatus);

      // Check Firestore doc for existing data or create blank structure
      const cloudData = await loadUserDataFromFirestore(userProfile.uid);
      if (cloudData) {
        setState(cloudData);
        saveAppState(cloudData, userProfile.uid);
        setSyncNotification({
          type: 'success',
          message: `Firestore se purana data load ho gaya!`,
        });
      } else {
        const blankState = createEmptyAppState({
          name: userProfile.name,
          email: userProfile.email,
        });
        await saveUserDataToFirestore(userProfile.uid, userProfile, blankState);
        setState(blankState);
        saveAppState(blankState, userProfile.uid);
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setSyncNotification({
          type: 'error',
          message: err?.message || 'Google Login failed',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sign-Out handler
  const handleLogout = async () => {
    try {
      await signOutGoogle();
      setCurrentUser(null);
      setSubscription({
        isSubscribed: false,
        subscriptionExpiresAt: null,
        activatedKey: null,
        daysRemaining: 0,
        isValid: false,
      });
      const empty = createEmptyAppState();
      setState(empty);
      setSyncNotification({
        type: 'success',
        message: 'Aap safalta se sign out ho gaye hain',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Manual Sync Now handler
  const handleSyncNow = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    try {
      await saveUserDataToFirestore(currentUser.uid, currentUser, state);
      setSyncNotification({
        type: 'success',
        message: 'Cloud Firestore par data safalta se sync ho gaya!',
      });
    } catch (err) {
      setSyncNotification({
        type: 'error',
        message: 'Firestore par save karne me dikkat aayi',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Rule 3: Fast debounced auto-save to Cloud Firestore whenever state updates while logged in
  const isInitialMount = useRef(true);
  useEffect(() => {
    saveAppState(state, currentUser?.uid);

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (currentUser?.uid && !currentUser.isGuest && getAutoSyncPreference()) {
      // Ensure user has an active authenticated Firebase session before firing background cloud sync
      if (!auth.currentUser || auth.currentUser.uid !== currentUser.uid) {
        return;
      }

      const timer = setTimeout(async () => {
        try {
          await saveUserDataToFirestore(currentUser.uid, currentUser, state);
        } catch (e: any) {
          console.warn('Auto sync to Firestore skipped (cloud permissions or session):', e?.message || e);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [state, currentUser]);

  // Modal controls
  const [showGallaModal, setShowGallaModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Staff Sub-modals
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<Staff | null>(null);
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    mode: 'scan' | 'view_badge';
    selectedStaff?: Staff | null;
  }>({
    isOpen: false,
    mode: 'scan',
  });

  // Udhari initial open flag
  const [openAddUdhariImmediately, setOpenAddUdhariImmediately] = useState(false);

  // Persist state whenever it changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const todayStr = getTodayDateString();

  // Find or initialize today's galla
  const todayGalla = state.gallaHistory.find((g) => g.date === todayStr) || {
    id: `galla-${todayStr}`,
    date: todayStr,
    openingCash: 5200,
    cashIn: 0,
    upiIn: 0,
    cardIn: 0,
    expenseOut: 0,
    actualClosingCash: 5200,
    expectedClosingCash: 5200,
    cashDifference: 0,
    isClosed: false,
  };

  const currentCashInGalla =
    todayGalla.openingCash + todayGalla.cashIn - todayGalla.expenseOut;

  // Set specific language handler with localStorage & profile sync
  const handleSetLanguage = (nextLang: Language) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        language: nextLang,
      },
    }));
    try {
      localStorage.setItem('dukankhata_preferred_language', nextLang);
    } catch {}
    if (currentUser?.uid && !currentUser.isGuest) {
      saveUserDataToFirestore(currentUser.uid, currentUser, {
        ...state,
        settings: { ...state.settings, language: nextLang },
      }).catch(() => {});
    }
  };

  // Language toggle handler across 4 languages
  const handleToggleLanguage = () => {
    const cycle: Record<Language, Language> = {
      en: 'hi',
      hi: 'or',
      or: 'bn',
      bn: 'en',
    };
    const nextLang = cycle[state.settings.language] || 'en';
    handleSetLanguage(nextLang);
  };

  // Staff Attendance Updates
  const handleUpdateAttendance = (
    staffId: string,
    status: AttendanceStatus,
    overtimeHours: number = 0,
    lateMinutes: number = 0
  ) => {
    const timeNow = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setState((prev) => {
      const existingIdx = prev.attendance.findIndex(
        (a) => a.staffId === staffId && a.date === todayStr
      );

      let updatedList = [...prev.attendance];
      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status,
          overtimeHours: overtimeHours || updatedList[existingIdx].overtimeHours || 0,
          lateMinutes: lateMinutes || updatedList[existingIdx].lateMinutes || 0,
          checkOutTime: status === 'present' ? timeNow : updatedList[existingIdx].checkOutTime,
        };
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${staffId}`,
          staffId,
          date: todayStr,
          status,
          checkInTime: timeNow,
          overtimeHours,
          lateMinutes,
        };
        updatedList.push(newRecord);
      }

      return {
        ...prev,
        attendance: updatedList,
      };
    });
  };

  // Add new staff
  const handleAddNewStaff = (newStaff: Omit<Staff, 'id' | 'qrCodeId'>) => {
    const id = `staff-${Date.now()}`;
    const qrCodeId = `STAFF_QR_${newStaff.name.toUpperCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;

    const fullStaff: Staff = {
      ...newStaff,
      id,
      qrCodeId,
    };

    setState((prev) => ({
      ...prev,
      staffList: [...prev.staffList, fullStaff],
    }));
  };

  // Update staff salary adjustment (advance, loan, incentive)
  const handleUpdateAdjustment = (staffId: string, adjustment: SalaryAdjustment) => {
    const key = `${staffId}_2026-09`;
    setState((prev) => ({
      ...prev,
      salaryAdjustments: {
        ...prev.salaryAdjustments,
        [key]: adjustment,
      },
    }));
  };

  // Update staff attendance record (with overtime, notes, check-in/out)
  const handleUpdateAttendanceRecord = (record: AttendanceRecord) => {
    setState((prev) => {
      const idx = prev.attendance.findIndex((a) => a.id === record.id);
      const updatedList = [...prev.attendance];
      if (idx >= 0) {
        updatedList[idx] = record;
      } else {
        updatedList.push(record);
      }
      return {
        ...prev,
        attendance: updatedList,
      };
    });
  };

  // Update staff salary rules (monthly/daily/hourly, overtime rate, deductions)
  const handleUpdateSalaryRules = (staffId: string, rules: SalaryRules) => {
    setState((prev) => ({
      ...prev,
      staffList: prev.staffList.map((s) => (s.id === staffId ? { ...s, salaryRules: rules } : s)),
    }));
  };

  // Update staff profile details (name, phone, role, basic salary)
  const handleUpdateStaff = (updatedStaff: Staff) => {
    setState((prev) => ({
      ...prev,
      staffList: prev.staffList.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)),
    }));
  };

  // Udhari Operations
  const handleAddUdhari = (entry: Omit<UdhariEntry, 'id' | 'isPaid'>) => {
    const txId = `udh-${Date.now()}`;
    const cleanPhone = (entry.customerPhone || '').replace(/[^0-9]/g, '');
    const defaultCustId = cleanPhone ? `cust-${cleanPhone}` : `cust-${entry.customerName.trim().toLowerCase().replace(/\s+/g, '_')}`;

    const newEntry: UdhariEntry = {
      ...entry,
      id: txId,
      transaction_id: txId,
      customer_id: entry.customer_id || defaultCustId,
      amount: entry.amount,
      total_amount: entry.total_amount ?? entry.amount,
      paidAmount: entry.paidAmount ?? 0,
      paid_amount: entry.paid_amount ?? (entry.paidAmount ?? 0),
      remainingAmount: entry.remainingAmount ?? entry.amount,
      remaining_amount: entry.remaining_amount ?? (entry.remainingAmount ?? entry.amount),
      date: entry.date || todayStr,
      transaction_date: entry.transaction_date || (entry.date || todayStr),
      dueDate: entry.dueDate || todayStr,
      due_date: entry.due_date || (entry.dueDate || todayStr),
      isPaid: false,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      udhariList: [newEntry, ...prev.udhariList],
    }));
  };

  const handleMarkUdhariPaid = (id: string, paymentMethod: 'cash' | 'upi') => {
    setState((prev) => {
      const target = prev.udhariList.find((u) => u.id === id);
      if (!target) return prev;

      const updatedUdhari = prev.udhariList.map((u) =>
        u.id === id
          ? {
              ...u,
              isPaid: true,
              paidDate: todayStr,
              paidAmount: u.amount,
              paymentMethod,
            }
          : u
      );

      // Auto-update Galla: Add collected amount to today's Galla cashIn or upiIn
      const updatedGalla = prev.gallaHistory.map((g) => {
        if (g.date === todayStr) {
          return {
            ...g,
            cashIn: paymentMethod === 'cash' ? g.cashIn + target.amount : g.cashIn,
            upiIn: paymentMethod === 'upi' ? g.upiIn + target.amount : g.upiIn,
          };
        }
        return g;
      });

      return {
        ...prev,
        udhariList: updatedUdhari,
        gallaHistory: updatedGalla,
      };
    });
  };

  const handleDeleteUdhari = (id: string) => {
    setState((prev) => ({
      ...prev,
      udhariList: prev.udhariList.filter((u) => u.id !== id),
    }));
  };

  // Staff Salary Payment Ledger Operations (Requirements 1, 2, 3, 4)
  const handleAddSalaryPayment = (
    payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>
  ) => {
    const newPayment: StaffSalaryPayment = {
      ...payment,
      id: `spay-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      salaryPayments: [newPayment, ...(prev.salaryPayments || [])],
    }));
  };

  const handleEditSalaryPayment = (payment: StaffSalaryPayment) => {
    setState((prev) => ({
      ...prev,
      salaryPayments: (prev.salaryPayments || []).map((p) =>
        p.id === payment.id ? { ...payment, updated_at: new Date().toISOString() } : p
      ),
    }));
  };

  const handleDeleteSalaryPayment = (paymentId: string) => {
    setState((prev) => ({
      ...prev,
      salaryPayments: (prev.salaryPayments || []).filter((p) => p.id !== paymentId),
    }));
  };

  // Customer Payment Operations (Requirements 7, 8, 10)
  const handleRecordCustomerPayment = (
    payment: Omit<CustomerPaymentRecord, 'id' | 'created_at' | 'updated_at'>,
    allocatedItems: { itemId: string; amountPaid: number; isFullyPaid: boolean; newRemaining: number }[]
  ) => {
    const newPayment: CustomerPaymentRecord = {
      ...payment,
      id: `cpay-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setState((prev) => {
      // 1. Update items in udhariList according to allocated amounts
      const allocatedMap = new Map(allocatedItems.map((a) => [a.itemId, a]));

      const updatedUdhari = prev.udhariList.map((item) => {
        const alloc = allocatedMap.get(item.id);
        if (!alloc) return item;

        const currentPaid = item.paidAmount || 0;
        const newPaidAmount = currentPaid + alloc.amountPaid;
        const isFullyPaid = alloc.isFullyPaid || alloc.newRemaining === 0;

        return {
          ...item,
          paidAmount: newPaidAmount,
          remainingAmount: alloc.newRemaining,
          isPaid: isFullyPaid,
          paidDate: isFullyPaid ? payment.payment_date || todayStr : item.paidDate,
          paymentMethod: (payment.payment_method.toLowerCase() === 'upi' ? 'upi' : 'cash') as 'cash' | 'upi',
        };
      });

      // 2. Add payment record to customerPayments (immutable audit log)
      const updatedPayments = [newPayment, ...(prev.customerPayments || [])];

      // 3. Auto-update Galla if cash/upi
      const paymentMode = payment.payment_method.toLowerCase();
      const updatedGalla = prev.gallaHistory.map((g) => {
        if (g.date === todayStr) {
          return {
            ...g,
            cashIn: paymentMode === 'cash' ? g.cashIn + payment.payment_amount : g.cashIn,
            upiIn: paymentMode === 'upi' ? g.upiIn + payment.payment_amount : g.upiIn,
          };
        }
        return g;
      });

      return {
        ...prev,
        udhariList: updatedUdhari,
        customerPayments: updatedPayments,
        gallaHistory: updatedGalla,
      };
    });
  };

  // Supplier Dues Operations
  const handleAddSupplierDue = (
    entry: Omit<SupplierDueEntry, 'id' | 'dueAmount' | 'status'>
  ) => {
    const dueAmount = entry.amount - entry.paidAmount;
    const status: SupplierDueEntry['status'] =
      dueAmount <= 0 ? 'paid' : entry.paidAmount > 0 ? 'partially_paid' : 'pending';

    const txId = `sup-${Date.now()}`;
    const cleanPhone = (entry.supplierPhone || '').replace(/[^0-9]/g, '');
    const supplierId =
      entry.supplier_id ||
      (cleanPhone ? `sup-${cleanPhone}` : `sup-${entry.supplierName.trim().toLowerCase().replace(/\s+/g, '_')}`);

    const newSupplierEntry: SupplierDueEntry = {
      ...entry,
      id: txId,
      purchase_id: txId,
      supplier_id: supplierId,
      dueAmount,
      remaining_amount: dueAmount,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let initialPaymentRecord: SupplierPayment | null = null;
    if (entry.paidAmount > 0) {
      const pId = `spay-${Date.now()}`;
      initialPaymentRecord = {
        id: pId,
        payment_id: pId,
        supplier_id: supplierId,
        supplierPhone: entry.supplierPhone,
        supplierName: entry.supplierName,
        linked_purchase_id: txId,
        amount: entry.paidAmount,
        date: entry.date || todayStr,
        payment_date: entry.date || todayStr,
        payment_method: 'UPI',
        paymentMode: 'upi',
        remaining_balance_after: dueAmount,
        note: 'Paid at the time of purchase',
        created_at: new Date().toISOString(),
      };
      newSupplierEntry.paymentHistory = [initialPaymentRecord];
      newSupplierEntry.payments = [initialPaymentRecord];
    }

    setState((prev) => ({
      ...prev,
      supplierList: [newSupplierEntry, ...prev.supplierList],
      supplierPayments: initialPaymentRecord
        ? [initialPaymentRecord, ...(prev.supplierPayments || [])]
        : prev.supplierPayments,
    }));
  };

  const handleRecordSupplierPayment = (
    paymentOrId: string | Omit<SupplierPayment, 'id' | 'created_at' | 'updated_at'>,
    paymentAmountArg?: number,
    paymentModeArg?: 'cash' | 'upi'
  ) => {
    setState((prev) => {
      let newPayment: SupplierPayment;
      let targetSupplierPhone = '';
      let targetSupplierName = '';
      let targetBillId = '';
      let payAmt = 0;
      let mode: 'cash' | 'upi' = 'upi';

      if (typeof paymentOrId === 'string') {
        const bill = prev.supplierList.find((b) => b.id === paymentOrId);
        targetSupplierPhone = bill ? bill.supplierPhone : '';
        targetSupplierName = bill ? bill.supplierName : '';
        targetBillId = paymentOrId;
        payAmt = paymentAmountArg || 0;
        mode = paymentModeArg || 'upi';

        newPayment = {
          id: `spay-${Date.now()}`,
          payment_id: `spay-${Date.now()}`,
          supplier_id: bill?.supplier_id || targetSupplierPhone,
          supplierPhone: targetSupplierPhone,
          supplierName: targetSupplierName,
          linked_purchase_id: targetBillId,
          amount: payAmt,
          date: todayStr,
          payment_date: todayStr,
          payment_method: mode === 'cash' ? 'Cash' : 'UPI',
          paymentMode: mode,
          created_at: new Date().toISOString(),
        };
      } else {
        const pObj = paymentOrId;
        payAmt = pObj.amount;
        targetSupplierPhone = pObj.supplierPhone || '';
        targetSupplierName = pObj.supplierName || '';
        targetBillId = pObj.linked_purchase_id || '';
        const rawMethod = (pObj.payment_method || pObj.paymentMode || 'UPI').toUpperCase();
        mode = rawMethod.includes('CASH') ? 'cash' : 'upi';

        newPayment = {
          ...pObj,
          id: `spay-${Date.now()}`,
          payment_id: `spay-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
      }

      if (payAmt <= 0) return prev;

      let remainingToApply = payAmt;
      const updatedSupplierList = prev.supplierList.map((bill) => {
        const matchesSupplier =
          (targetSupplierPhone && bill.supplierPhone === targetSupplierPhone) ||
          (targetSupplierName && bill.supplierName.toLowerCase() === targetSupplierName.toLowerCase()) ||
          (targetBillId && bill.id === targetBillId);

        if (!matchesSupplier || remainingToApply <= 0 || bill.dueAmount <= 0) {
          return bill;
        }

        const canPay = Math.min(bill.dueAmount, remainingToApply);
        remainingToApply -= canPay;
        const newPaid = bill.paidAmount + canPay;
        const newDue = Math.max(0, bill.amount - newPaid);
        const newStatus: SupplierDueEntry['status'] = newDue <= 0 ? 'paid' : 'partially_paid';
        const existingHistory = bill.paymentHistory || bill.payments || [];

        return {
          ...bill,
          paidAmount: newPaid,
          paid_amount: newPaid,
          dueAmount: newDue,
          remaining_amount: newDue,
          status: newStatus,
          paymentHistory: [newPayment, ...existingHistory],
          payments: [newPayment, ...existingHistory],
        };
      });

      const totalDueAfter = updatedSupplierList
        .filter(
          (b) =>
            (targetSupplierPhone && b.supplierPhone === targetSupplierPhone) ||
            (targetSupplierName && b.supplierName.toLowerCase() === targetSupplierName.toLowerCase())
        )
        .reduce((sum, b) => sum + b.dueAmount, 0);

      newPayment.remaining_balance_after = totalDueAfter;

      const updatedPayments = [newPayment, ...(prev.supplierPayments || [])];

      // If paid in cash from Galla, record as expenseOut
      const updatedGalla = prev.gallaHistory.map((g) => {
        if (g.date === todayStr && mode === 'cash') {
          return {
            ...g,
            expenseOut: g.expenseOut + payAmt,
          };
        }
        return g;
      });

      return {
        ...prev,
        supplierList: updatedSupplierList,
        supplierPayments: updatedPayments,
        gallaHistory: updatedGalla,
      };
    });
  };

  // Expense Operations
  const handleAddExpense = (expense: Omit<ExpenseEntry, 'id'>) => {
    const newExpense: ExpenseEntry = {
      ...expense,
      id: `exp-${Date.now()}`,
    };

    setState((prev) => {
      // If paid via cash, reflect in Galla's expenseOut
      const updatedGalla = prev.gallaHistory.map((g) => {
        if (g.date === todayStr && expense.paymentMode === 'cash') {
          return {
            ...g,
            expenseOut: g.expenseOut + expense.amount,
          };
        }
        return g;
      });

      return {
        ...prev,
        expenseList: [newExpense, ...prev.expenseList],
        gallaHistory: updatedGalla,
      };
    });
  };

  const handleDeleteExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenseList: prev.expenseList.filter((e) => e.id !== id),
    }));
  };

  // Galla Save
  const handleSaveGalla = (updated: DailyGalla) => {
    setState((prev) => {
      const exists = prev.gallaHistory.some((g) => g.date === updated.date);
      let list = [];
      if (exists) {
        list = prev.gallaHistory.map((g) => (g.date === updated.date ? updated : g));
      } else {
        list = [updated, ...prev.gallaHistory];
      }
      return {
        ...prev,
        gallaHistory: list,
      };
    });
  };

  // Badge Counts
  const pendingUdhariCount = state.udhariList.filter((u) => !u.isPaid).length;
  const pendingSupplierCount = state.supplierList.filter((s) => s.status !== 'paid').length;

  // 1. Unauthenticated State: Show simple, clean LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        language={state.settings.language}
        onLanguageChange={handleSetLanguage}
        onLoginSuccess={async (profile) => {
          setCurrentUser(profile);
          if (profile.isGuest) {
            saveGuestSessionUser(profile);
            const guestData = loadGuestAppState() || createInitialGuestAppState();
            let userLang: Language = 'en';
            try {
              const savedLang = localStorage.getItem('dukankhata_preferred_language') as Language | null;
              if (savedLang && ['en', 'hi', 'or', 'bn'].includes(savedLang)) {
                userLang = savedLang;
              }
            } catch {}
            guestData.settings.language = userLang;
            setState(guestData);
            saveGuestAppState(guestData);
            setSubscription({
              isSubscribed: true,
              subscriptionExpiresAt: '2099-12-31T23:59:59.000Z',
              activatedKey: 'GUEST-TEST-MODE',
              daysRemaining: 9999,
              isValid: true,
            });
            setCheckingSubscription(false);
            return;
          }
          saveGoogleUser(profile);
          try {
            setCheckingSubscription(true);
            const sub = await checkUserSubscription(profile.uid);
            setSubscription(sub);
          } catch (e) {
            console.error(e);
          } finally {
            setCheckingSubscription(false);
          }
        }}
        onLoginWithGoogle={handleLoginWithGoogle}
      />
    );
  }

  // Loading state while checking subscription
  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-xs font-semibold">1-Year License status check ho raha hai...</p>
      </div>
    );
  }

  // RULE 3: Auto-Login & No Key Needed Again
  // Check: doc.isSubscribed === true AND doc.subscriptionExpiresAt > new Date()
  // Agar condition TRUE hai: Seedha full App Dashboard open karo. User se koi key ya payment MAT pucho.
  // Agar condition FALSE hai (1 saal pura ho gaya ya naya user hai): Tabhi Paywall screen show karo.
  if (!subscription.isValid) {
    return (
      <>
        <PaywallScreen
          currentUser={currentUser}
          subscription={subscription}
          onLoginWithGoogle={handleLoginWithGoogle}
          onLogout={handleLogout}
          onOpenAdminPanel={() => setShowAdminPanel(true)}
          onActivationSuccess={(expiresAt) => {
            const days = Math.max(
              0,
              Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );
            setSubscription({
              isSubscribed: true,
              subscriptionExpiresAt: expiresAt,
              daysRemaining: days,
              isValid: true,
            });
            setSyncNotification({
              type: 'success',
              message: 'Badhaai ho! 1-Year Pro License activate ho gaya.',
            });
          }}
        />
        {showAdminPanel && (
          <AdminPanelModal
            currentUser={currentUser}
            onClose={() => setShowAdminPanel(false)}
            onKeyGenerated={(key) => {
              setSyncNotification({
                type: 'success',
                message: `Naya 1-Year Key (${key}) Firestore me save ho gaya!`,
              });
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Container with optional Mobile Frame simulation */}
      <div
        className={`w-full transition-all duration-300 ${
          deviceFrameMode
            ? 'max-w-[420px] my-4 rounded-[40px] border-[10px] border-slate-800 shadow-2xl overflow-hidden bg-slate-950 min-h-[860px] relative'
            : 'max-w-2xl bg-slate-950 min-h-screen'
        }`}
      >
        {/* Device Frame Top Notch (only when framed) */}
        {deviceFrameMode && (
          <div className="w-full flex justify-center pt-2 pb-1 bg-slate-900 border-b border-slate-800">
            <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
          </div>
        )}

        {/* Global Header */}
        <Header
          settings={state.settings}
          currentCash={currentCashInGalla}
          onLanguageToggle={handleToggleLanguage}
          onOpenGalla={() => setShowGallaModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenBackup={() => setShowBackupModal(true)}
          onOpenAdminPanel={() => setShowAdminPanel(true)}
          currentUser={currentUser}
          subscription={subscription}
          onLoginWithGoogle={handleLoginWithGoogle}
          onLogout={handleLogout}
          onSyncNow={handleSyncNow}
          isSyncing={isSyncing}
        />

        {/* Temporary Guest Mode Banner */}
        {ENABLE_GUEST_MODE && isGuestUser(currentUser) && (
          <GuestModeBanner
            language={state.settings.language}
            onExitGuest={() => {
              setCurrentUser(null);
              setState(createEmptyAppState());
            }}
            onResetGuestData={(freshState) => {
              setState(freshState);
            }}
          />
        )}

        {/* Main App Content Body */}
        <main className="px-3.5 sm:px-4 pt-3.5">
          {activeTab === 'home' && (
            <HomeTab
              state={state}
              language={state.settings.language}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddUdhari={() => {
                setActiveTab('udhari');
                setOpenAddUdhariImmediately(true);
              }}
              onOpenMarkAttendance={() => setActiveTab('staff')}
              onOpenAddExpense={() => setShowExpensesModal(true)}
              onOpenSalaryGen={() => {
                setActiveTab('staff');
                if (state.staffList[0]) {
                  setSelectedStaffForSlip(state.staffList[0]);
                }
              }}
              onOpenGalla={() => setShowGallaModal(true)}
            />
          )}

          {activeTab === 'staff' && (
            <StaffTab
              staffList={state.staffList}
              attendanceList={state.attendance}
              salaryAdjustments={state.salaryAdjustments}
              salaryPayments={state.salaryPayments || []}
              settings={state.settings}
              language={state.settings.language}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
              onUpdateSalaryRules={handleUpdateSalaryRules}
              onOpenQrScanner={() =>
                setQrModalState({ isOpen: true, mode: 'scan' })
              }
              onViewStaffQr={(staff) =>
                setQrModalState({
                  isOpen: true,
                  mode: 'view_badge',
                  selectedStaff: staff,
                })
              }
              onGenerateSalarySlip={(staff) => setSelectedStaffForSlip(staff)}
              onAddNewStaff={handleAddNewStaff}
              onUpdateStaff={handleUpdateStaff}
              onUpdateAdjustment={handleUpdateAdjustment}
              onAddSalaryPayment={handleAddSalaryPayment}
              onEditSalaryPayment={handleEditSalaryPayment}
              onDeleteSalaryPayment={handleDeleteSalaryPayment}
            />
          )}

          {activeTab === 'udhari' && (
            <UdhariTab
              udhariList={state.udhariList}
              customerPayments={state.customerPayments || []}
              settings={state.settings}
              language={state.settings.language}
              onAddUdhari={handleAddUdhari}
              onMarkPaid={handleMarkUdhariPaid}
              onDeleteUdhari={handleDeleteUdhari}
              onRecordCustomerPayment={handleRecordCustomerPayment}
              initialOpenModal={openAddUdhariImmediately}
            />
          )}

          {activeTab === 'supplier' && (
            <SupplierTab
              supplierList={state.supplierList}
              supplierPayments={state.supplierPayments || []}
              settings={state.settings}
              language={state.settings.language}
              onAddSupplierDue={handleAddSupplierDue}
              onRecordSupplierPayment={handleRecordSupplierPayment}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab state={state} language={state.settings.language} />
          )}
        </main>

        {/* Global Bottom Navigation Bar (5 tabs) */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setOpenAddUdhariImmediately(false);
          }}
          language={state.settings.language}
          counts={{
            pendingUdhari: pendingUdhariCount,
            pendingSupplier: pendingSupplierCount,
            staffCount: state.staffList.length,
          }}
        />
      </div>

      {/* MODALS LAYER */}
      {/* 1. Daily Galla Cash Register Modal */}
      {showGallaModal && (
        <DailyGallaModal
          currentGalla={todayGalla}
          settings={state.settings}
          language={state.settings.language}
          onSaveGalla={handleSaveGalla}
          onClose={() => setShowGallaModal(false)}
        />
      )}

      {/* 2. Expenses Logger Modal */}
      {showExpensesModal && (
        <ExpensesModal
          expenses={state.expenseList}
          settings={state.settings}
          language={state.settings.language}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onClose={() => setShowExpensesModal(false)}
        />
      )}

      {/* 3. Month-end Salary Slip Modal */}
      {selectedStaffForSlip && (
        <SalarySlipModal
          staff={selectedStaffForSlip}
          attendanceList={state.attendance}
          adjustment={
            state.salaryAdjustments[`${selectedStaffForSlip.id}_2026-09`]
          }
          salaryPayments={state.salaryPayments || []}
          settings={state.settings}
          language={state.settings.language}
          onClose={() => setSelectedStaffForSlip(null)}
        />
      )}

      {/* 4. QR Scanner & ID Badge Modal */}
      {qrModalState.isOpen && (
        <QRScannerModal
          mode={qrModalState.mode}
          staffList={state.staffList}
          selectedStaff={qrModalState.selectedStaff}
          shopName={state.settings.shopName}
          language={state.settings.language}
          onScanSuccess={(staff, status) => {
            handleUpdateAttendance(staff.id, status);
          }}
          onClose={() => setQrModalState({ isOpen: false, mode: 'scan' })}
        />
      )}

      {/* 5. Backup & Restore Modal */}
      {showBackupModal && (
        <BackupRestoreModal
          state={state}
          language={state.settings.language}
          onRestoreState={(restored) => setState(restored)}
          onToggleAutoBackup={(enabled) =>
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, autoBackupDaily: enabled },
            }))
          }
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* 6. Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={state.settings}
          language={state.settings.language}
          appState={state}
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateAppState={(newState) => setState(newState)}
          onUpdateSettings={(updated) => {
            if (updated.language) {
              handleSetLanguage(updated.language);
            }
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...updated },
            }));
          }}
          onOpenBackup={() => {
            setShowSettingsModal(false);
            setShowBackupModal(true);
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* 7. Super Admin Panel Modal (lite59412@gmail.com only) */}
      {showAdminPanel && (
        <AdminPanelModal
          currentUser={currentUser}
          onClose={() => setShowAdminPanel(false)}
          onKeyGenerated={(key) => {
            setSyncNotification({
              type: 'success',
              message: `Naya 1-Year Key (${key}) Firestore me save ho gaya!`,
            });
          }}
        />
      )}

      {/* Floating Cloud Sync Toast */}
      {syncNotification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur animate-in fade-in slide-in-from-bottom-2">
          {syncNotification.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span>{syncNotification.message}</span>
        </div>
      )}
    </div>
  );
}
