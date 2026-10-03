import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
  activatedKey?: string | null;
  daysRemaining: number;
  isValid: boolean;
}

export interface AdminLicenseKeyRecord {
  key: string;
  isUsed: boolean;
  usedByEmail?: string | null;
  usedAt?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface UserLogRecord {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  isSubscribed: boolean;
  subscriptionExpiresAt?: string | null;
  activatedKey?: string | null;
  lastUpdated?: string | null;
  joinedAt?: string | null;
}

export interface PaymentRequestRecord {
  id: string;
  uid: string;
  userEmail: string;
  userName: string;
  utrNumber: string;
  amount: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedKey?: string;
}

// Owner / Admin Email
export const ADMIN_EMAIL = 'lite59412@gmail.com';

// Official UPI ID specified by user
export const OFFICIAL_UPI_ID = 'rayb4121-1@okhdfcbank';

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Built-in fallback starter keys pool
const STARTER_KEYS = [
  'DKHA-2026-VIP-YEAR',
  'DKHA-9999-PASS-365D',
  'DUKAAN-PRO-KEY-2026',
  'DP-2026-PRO1',
  'DP-2026-PRO2',
];

/**
 * Checks if the user's subscription in Firestore is valid and unexpired
 * doc.isSubscribed === true AND doc.subscriptionExpiresAt > new Date()
 */
export async function checkUserSubscription(uid: string): Promise<SubscriptionStatus> {
  // If guest mode testing session, skip paywall immediately
  if (typeof sessionStorage !== 'undefined') {
    const guestSaved = sessionStorage.getItem('dukankhata_guest_session_user');
    if (guestSaved) {
      try {
        const parsed = JSON.parse(guestSaved);
        if (parsed?.isGuest && parsed?.uid === uid) {
          return {
            isSubscribed: true,
            subscriptionExpiresAt: '2099-12-31T23:59:59.000Z',
            activatedKey: 'GUEST-TEST-MODE',
            daysRemaining: 9999,
            isValid: true,
          };
        }
      } catch {}
    }
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const isSubscribed = data?.isSubscribed === true;
      const expiresAtStr = data?.subscriptionExpiresAt || null;

      if (isSubscribed && expiresAtStr) {
        const expiresAtTime = new Date(expiresAtStr).getTime();
        const now = Date.now();
        const isValid = !isNaN(expiresAtTime) && expiresAtTime > now;
        const daysRemaining = isValid
          ? Math.max(0, Math.ceil((expiresAtTime - now) / (1000 * 60 * 60 * 24)))
          : 0;

        return {
          isSubscribed,
          subscriptionExpiresAt: expiresAtStr,
          activatedKey: data?.activatedKey || null,
          daysRemaining,
          isValid,
        };
      }
    }
  } catch (error) {
    console.error('Error checking user subscription:', error);
  }

  return {
    isSubscribed: false,
    subscriptionExpiresAt: null,
    activatedKey: null,
    daysRemaining: 0,
    isValid: false,
  };
}

/**
 * Generates a clean random key formatted like DP-2026-XXXX (e.g. DP-2026-8942)
 */
export function generateRandomKeyString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DP-2026-${rand}`;
}

/**
 * Admin: Generate new 1-Year Key and persist into Firestore license_keys collection
 */
export async function createNewLicenseKey(adminEmail: string): Promise<string> {
  if (!isUserAdmin(adminEmail)) {
    throw new Error('Unauthorized: Sirf Owner Admin hi nayi key generate kar sakte hain.');
  }

  let uniqueKey = generateRandomKeyString();
  let keyRef = doc(db, 'license_keys', uniqueKey);
  let snap = await getDoc(keyRef);
  let attempts = 0;

  while (snap.exists() && attempts < 5) {
    uniqueKey = generateRandomKeyString();
    keyRef = doc(db, 'license_keys', uniqueKey);
    snap = await getDoc(keyRef);
    attempts++;
  }

  await setDoc(keyRef, {
    key: uniqueKey,
    isUsed: false,
    usedByEmail: null,
    usedByUid: null,
    usedAt: null,
    createdBy: adminEmail.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    plan: '1_YEAR',
    durationDays: 365,
  });

  return uniqueKey;
}

/**
 * Admin: Fetch all license keys from Firestore
 */
export async function fetchAllLicenseKeys(): Promise<AdminLicenseKeyRecord[]> {
  try {
    const q = query(collection(db, 'license_keys'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const list: AdminLicenseKeyRecord[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        key: d.key || docSnap.id,
        isUsed: !!d.isUsed,
        usedByEmail: d.usedByEmail || null,
        usedAt: d.usedAt || null,
        createdAt: d.createdAt || null,
        createdBy: d.createdBy || null,
      });
    });
    return list;
  } catch (err) {
    console.error('Error fetching license keys with orderBy, trying fallback:', err);
    try {
      const snapshot = await getDocs(collection(db, 'license_keys'));
      const list: AdminLicenseKeyRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          key: d.key || docSnap.id,
          isUsed: !!d.isUsed,
          usedByEmail: d.usedByEmail || null,
          usedAt: d.usedAt || null,
          createdAt: d.createdAt || null,
          createdBy: d.createdBy || null,
        });
      });
      return list.reverse();
    } catch {
      return [];
    }
  }
}

/**
 * Admin: Fetch live users log from Firestore 'users' collection
 */
export async function fetchAllUsersLog(): Promise<UserLogRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const list: UserLogRecord[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        uid: docSnap.id,
        name: d.userName || d.name || 'Dukandar',
        email: d.userEmail || d.email || 'No email',
        photoURL: d.photoURL || undefined,
        isSubscribed: d.isSubscribed === true,
        subscriptionExpiresAt: d.subscriptionExpiresAt || null,
        activatedKey: d.activatedKey || null,
        lastUpdated: d.lastUpdated || null,
        joinedAt: d.subscriptionStartedAt || d.lastUpdated || null,
      });
    });
    // Sort so most recent active/updated appears top
    return list.sort((a, b) => {
      const timeA = new Date(a.lastUpdated || a.subscriptionExpiresAt || 0).getTime();
      const timeB = new Date(b.lastUpdated || b.subscriptionExpiresAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Error fetching users log:', err);
    return [];
  }
}

/**
 * Admin Quick Action: Directly unlock 1-Year subscription for a user (cash/bank transfer)
 */
export async function unlockUserForOneYear(
  targetUid: string,
  adminEmail: string
): Promise<{ success: boolean; message: string; expiresAt: string }> {
  if (!isUserAdmin(adminEmail)) {
    throw new Error('Unauthorized');
  }

  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const userDocRef = doc(db, 'users', targetUid);

  await setDoc(
    userDocRef,
    {
      isSubscribed: true,
      subscriptionExpiresAt: oneYearFromNow,
      activatedKey: `DIRECT-ADMIN-UNLOCK-${Date.now().toString().slice(-4)}`,
      subscriptionStartedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return {
    success: true,
    message: 'User successfully unlocked for 1 Year!',
    expiresAt: oneYearFromNow,
  };
}

/**
 * User: Submit 12-digit UTR Payment Request
 */
export async function submitPaymentRequest(
  currentUser: { uid: string; email?: string | null; name?: string | null },
  utrNumber: string
): Promise<{ success: boolean; message: string }> {
  const cleanUtr = utrNumber.trim().toUpperCase();
  if (!cleanUtr || cleanUtr.length < 6) {
    return {
      success: false,
      message: 'Kripya sahi 12-digit UTR / Transaction No. darj karein.',
    };
  }

  try {
    await addDoc(collection(db, 'payment_requests'), {
      uid: currentUser.uid,
      userEmail: currentUser.email || 'anonymous',
      userName: currentUser.name || 'Store Owner',
      utrNumber: cleanUtr,
      amount: 999,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Payment request safalta se submit ho gayi hai! Verification ke baad key activate ho jayegi.',
    };
  } catch (error: any) {
    console.error('Failed to submit payment request:', error);
    return {
      success: false,
      message: error?.message || 'Payment submit karne me dikkat aayi. Kripya punah prayas karein.',
    };
  }
}

/**
 * Admin: Fetch all Payment Requests
 */
export async function fetchPaymentRequests(): Promise<PaymentRequestRecord[]> {
  try {
    const snapshot = await getDocs(collection(db, 'payment_requests'));
    const list: PaymentRequestRecord[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      list.push({
        id: docSnap.id,
        uid: d.uid || '',
        userEmail: d.userEmail || '',
        userName: d.userName || '',
        utrNumber: d.utrNumber || '',
        amount: d.amount || 999,
        createdAt: d.createdAt || '',
        status: d.status || 'pending',
        assignedKey: d.assignedKey || undefined,
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching payment requests:', err);
    return [];
  }
}

/**
 * Admin: Approve payment request & issue new key directly to user
 */
export async function approvePaymentRequest(
  requestId: string,
  targetUid: string,
  targetEmail: string,
  adminEmail: string
): Promise<{ success: boolean; key: string }> {
  if (!isUserAdmin(adminEmail)) throw new Error('Unauthorized');

  // 1. Generate new 1-year key
  const newKey = await createNewLicenseKey(adminEmail);

  // 2. Mark key used by target user
  const keyRef = doc(db, 'license_keys', newKey);
  await setDoc(
    keyRef,
    {
      isUsed: true,
      usedByEmail: targetEmail,
      usedByUid: targetUid,
      usedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // 3. Unlock target user's account for 1 year
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  await setDoc(
    doc(db, 'users', targetUid),
    {
      isSubscribed: true,
      subscriptionExpiresAt: oneYearFromNow,
      activatedKey: newKey,
      subscriptionStartedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // 4. Update payment request status
  await setDoc(
    doc(db, 'payment_requests', requestId),
    {
      status: 'approved',
      assignedKey: newKey,
      approvedAt: new Date().toISOString(),
      approvedBy: adminEmail,
    },
    { merge: true }
  );

  return { success: true, key: newKey };
}

/**
 * Admin: Reject payment request with reason
 */
export async function rejectPaymentRequest(
  requestId: string,
  adminEmail: string,
  reason?: string
): Promise<{ success: boolean }> {
  if (!isUserAdmin(adminEmail)) throw new Error('Unauthorized');

  await setDoc(
    doc(db, 'payment_requests', requestId),
    {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminEmail,
      rejectReason: reason || 'UTR Invalid ya Amount confirm nahi hua',
    },
    { merge: true }
  );

  return { success: true };
}

/**
 * Activates a 1-year license key with strict Single-Use and Duplicate Key Protection
 */
export async function activateLicenseKey(
  rawKey: string,
  currentUser: { uid: string; email?: string | null; name?: string | null }
): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  const cleanKey = rawKey.trim().toUpperCase();

  if (!cleanKey || cleanKey.length < 6) {
    return {
      success: false,
      message: 'Key already used or invalid.',
    };
  }

  try {
    const keyDocRef = doc(db, 'license_keys', cleanKey);
    const keyDocSnap = await getDoc(keyDocRef);

    // If key document exists in Firestore
    if (keyDocSnap.exists()) {
      const keyData = keyDocSnap.data();

      // Duplicate Key Protection
      if (keyData?.isUsed === true) {
        try {
          await addDoc(collection(db, 'security_alerts'), {
            attemptedEmail: currentUser.email || 'unknown',
            attemptedUid: currentUser.uid,
            keyUsed: cleanKey,
            originalUsedByEmail: keyData?.usedByEmail || 'unknown',
            originalUsedAt: keyData?.usedAt || null,
            date: new Date().toISOString(),
            alertType: 'DUPLICATE_KEY_ATTEMPT',
          });
        } catch (alertErr) {
          console.error('Failed to log security alert:', alertErr);
        }

        return {
          success: false,
          message: 'Key already used or invalid.',
        };
      }
    } else {
      // Check fallback starter keys or formatted pattern
      const isStarterKey = STARTER_KEYS.includes(cleanKey);
      const isCustomValidFormat =
        cleanKey.startsWith('DP-') ||
        cleanKey.startsWith('DKHA-') ||
        cleanKey.startsWith('DUKAAN-') ||
        cleanKey.length >= 10;

      if (!isStarterKey && !isCustomValidFormat) {
        try {
          await addDoc(collection(db, 'security_alerts'), {
            attemptedEmail: currentUser.email || 'unknown',
            attemptedUid: currentUser.uid,
            keyUsed: cleanKey,
            date: new Date().toISOString(),
            alertType: 'INVALID_KEY_ATTEMPT',
          });
        } catch (e) {
          console.error(e);
        }

        return {
          success: false,
          message: 'Key already used or invalid.',
        };
      }
    }

    // RULE 1: One-Time Key Activation
    const activationDate = new Date().toISOString();
    await setDoc(
      keyDocRef,
      {
        key: cleanKey,
        isUsed: true,
        usedByEmail: currentUser.email || '',
        usedByUid: currentUser.uid,
        usedAt: activationDate,
      },
      { merge: true }
    );

    // RULE 2: Permanent 1-Year User Subscription (365 days)
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(
      userDocRef,
      {
        isSubscribed: true,
        subscriptionExpiresAt: oneYearFromNow,
        activatedKey: cleanKey,
        subscriptionStartedAt: activationDate,
      },
      { merge: true }
    );

    return {
      success: true,
      message: '1-Year Pass unlocked successfully!',
      expiresAt: oneYearFromNow,
    };
  } catch (error: any) {
    console.error('License key activation error:', error);
    return {
      success: false,
      message: 'Key already used or invalid.',
    };
  }
}

/**
 * Log payment proof request to Firestore collection 'payment_requests'
 */
export async function logPaymentProofRequest(
  currentUser: { uid: string; email?: string | null; name?: string | null },
  notes: string = 'WhatsApp Payment Proof'
): Promise<void> {
  try {
    await addDoc(collection(db, 'payment_requests'), {
      uid: currentUser.uid,
      userEmail: currentUser.email || 'anonymous',
      userName: currentUser.name || 'Store Owner',
      utrNumber: notes,
      amount: 999,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log payment proof request:', err);
  }
}
