import { AppStateData } from '../types';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isLegacyMockState } from '../mockData';

export interface GoogleUserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  isGuest?: boolean;
  authType?: 'google' | 'email' | 'guest';
  sessionMode?: 'temporary' | 'permanent';
  guestSessionId?: string;
}

export interface CloudBackupRecord {
  userId: string;
  userEmail: string;
  backupTimestamp: string;
  appVersion: string;
  data: AppStateData;
}

const AUTH_USER_KEY = 'dukankhata_google_user_v1';
const AUTO_SYNC_KEY = 'dukankhata_auto_sync_enabled_v1';
const LAST_BACKUP_TIME_KEY = 'dukankhata_last_cloud_backup_time_v1';

export function getSavedGoogleUser(): GoogleUserProfile | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading saved user:', e);
  }
  return null;
}

export function saveGoogleUser(user: GoogleUserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('Error saving user:', e);
  }
}

export function getAutoSyncPreference(): boolean {
  try {
    const saved = localStorage.getItem(AUTO_SYNC_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
}

export function saveAutoSyncPreference(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_SYNC_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error('Error saving auto sync pref:', e);
  }
}

export function getLastCloudBackupTime(uid: string): string | null {
  try {
    return localStorage.getItem(`${LAST_BACKUP_TIME_KEY}_${uid}`);
  } catch {
    return null;
  }
}

export function saveLastCloudBackupTime(uid: string, timestamp: string): void {
  try {
    localStorage.setItem(`${LAST_BACKUP_TIME_KEY}_${uid}`, timestamp);
  } catch (e) {
    console.error('Error saving last backup time:', e);
  }
}

/**
 * Sign In with Google Popup via Firebase Authentication
 */
export async function signInWithGooglePopup(): Promise<GoogleUserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user: FirebaseUser = result.user;
  const profile: GoogleUserProfile = {
    uid: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Store Owner',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
  };
  saveGoogleUser(profile);
  return profile;
}

/**
 * Sign Out Google User from Firebase Auth
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  saveGoogleUser(null);
}

/**
 * Save user app business & customer state directly to Cloud Firestore under users/{uid}
 */
export async function saveUserDataToFirestore(
  uid: string,
  userProfile: { email?: string | null; name?: string | null; photoURL?: string | null; isGuest?: boolean },
  state: AppStateData
): Promise<string> {
  const timestamp = new Date().toISOString();
  // Strip any circular or undefined values for Firestore compatibility
  const sanitizedData = JSON.parse(JSON.stringify(state));

  // If this is a temporary guest session, store exclusively under guestSessions/{uid} or in-memory
  if (userProfile?.isGuest || auth.currentUser?.isAnonymous) {
    if (!auth.currentUser) {
      // In-memory / sessionStorage guest session without cloud account
      return timestamp;
    }
    try {
      const guestDocRef = doc(db, 'guestSessions', uid);
      await setDoc(
        guestDocRef,
        {
          userId: uid,
          isGuest: true,
          sessionMode: 'temporary',
          userName: userProfile.name || 'Guest Dukandar',
          lastUpdated: timestamp,
          data: sanitizedData,
        },
        { merge: true }
      );
    } catch (guestErr: any) {
      console.warn('Guest Firestore write notice (relying on in-memory/sessionStorage):', guestErr?.message || guestErr);
    }
    return timestamp;
  }

  // Verify that an active Firebase Auth session is present for this uid before sending network request
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    // If auth session has not yet initialized or token is pending, skip cloud write.
    // Local persistence (localStorage) already stores the data securely.
    saveLastCloudBackupTime(uid, timestamp);
    return timestamp;
  }

  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(
      docRef,
      {
        userId: uid,
        userEmail: userProfile.email || '',
        userName: userProfile.name || '',
        photoURL: userProfile.photoURL || '',
        lastUpdated: timestamp,
        appVersion: '2.0.0',
        data: sanitizedData,
      },
      { merge: true }
    );

    saveLastCloudBackupTime(uid, timestamp);
    return timestamp;
  } catch (err: any) {
    console.warn('Firestore sync notice (permissions or network):', err?.message || err);
    throw err;
  }
}

/**
 * Check if a user document exists in Cloud Firestore
 */
export async function checkUserDocExists(uid: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;
    const data = docSnap.data();
    if (!data || !data.data) return false;
    // If it contains legacy mock data, treat as nonexistent so fresh blank profile is created
    if (isLegacyMockState(data.data)) return false;
    return true;
  } catch (err) {
    console.warn('Notice checking user doc exists:', err);
    return false;
  }
}

/**
 * Fetch user app business & customer data from Cloud Firestore under users/{uid}
 */
export async function loadUserDataFromFirestore(uid: string): Promise<AppStateData | null> {
  if (!auth.currentUser) {
    return null;
  }
  try {
    const collectionName = auth.currentUser.isAnonymous ? 'guestSessions' : 'users';
    const docRef = doc(db, collectionName, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        // Discard legacy hardcoded demo data if it was previously saved
        if (isLegacyMockState(docData.data)) {
          return null;
        }
        if (docData.lastUpdated) {
          saveLastCloudBackupTime(uid, docData.lastUpdated);
        }
        return docData.data as AppStateData;
      }
    }
  } catch (err: any) {
    console.warn('Notice loading user data from Firestore:', err?.message || err);
  }
  return null;
}

/**
 * Manual backup helper for BackupRestoreModal
 */
export async function uploadBackupToCloud(
  user: GoogleUserProfile,
  state: AppStateData
): Promise<string> {
  return await saveUserDataToFirestore(user.uid, user, state);
}

/**
 * Manual restore fetcher for BackupRestoreModal
 */
export async function fetchBackupFromCloud(
  user: GoogleUserProfile
): Promise<CloudBackupRecord | null> {
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  const docData = docSnap.data();
  if (!docData || !docData.data) return null;

  return {
    userId: user.uid,
    userEmail: docData.userEmail || user.email,
    backupTimestamp: docData.lastUpdated || new Date().toISOString(),
    appVersion: docData.appVersion || '2.0.0',
    data: docData.data as AppStateData,
  };
}
