import {
  signInAnonymously,
  setPersistence,
  inMemoryPersistence,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import { GoogleUserProfile } from './cloudBackupService';
import {
  saveGuestSessionUser,
  clearGuestSessionStorage,
  createInitialGuestAppState,
  saveGuestAppState,
} from './guestSession';
import { cleanupGuestSession } from './guestCleanup';

/**
 * Feature Flag: Temporary Guest Login for Testing
 * Set this to false to completely remove/disable all Guest Mode behavior.
 */
export const ENABLE_GUEST_MODE = true;

/**
 * Initiates temporary Guest Login:
 * 1. Sets Firebase Auth persistence to inMemoryPersistence (NO local/cookie persistence)
 * 2. Authenticates anonymously via Firebase Auth (signInAnonymously)
 * 3. Creates isolated in-memory/sessionStorage guest profile & data
 * 4. Bypasses subscription & shop setup screens for rapid testing
 */
export async function startGuestLogin(): Promise<{
  success: boolean;
  user?: GoogleUserProfile;
  error?: string;
}> {
  if (!ENABLE_GUEST_MODE) {
    return {
      success: false,
      error: 'Guest Mode is currently disabled.',
    };
  }

  // Network connectivity check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: 'No internet connection. Please check your network to start guest test mode.',
    };
  }

  // Attempt Firebase Anonymous Authentication with in-memory persistence
  let guestUid = '';
  try {
    // RULE 2: Set Firebase Auth persistence to NONE / inMemoryPersistence
    // Do NOT store guest auth tokens in localStorage or cookies
    await setPersistence(auth, inMemoryPersistence);

    // Sign in anonymously via Firebase Auth
    const credential = await signInAnonymously(auth);
    guestUid = credential.user.uid;
  } catch (err: any) {
    // Graceful fallback: If Anonymous sign-in is disabled in Firebase Console
    // (auth/admin-restricted-operation) or offline (auth/network-request-failed),
    // proceed safely with an isolated temporary in-memory guest session.
    console.warn(
      'Firebase anonymous auth notice (using temporary in-memory session):',
      err?.code || err?.message || err
    );
    guestUid = `guest_anon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  const guestSessionId = `guest_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Build dedicated guest user profile
  const guestUser: GoogleUserProfile = {
    uid: guestUid,
    name: 'Guest Dukandar (Test Mode)',
    email: '',
    photoURL: undefined,
    isGuest: true,
    authType: 'guest',
    sessionMode: 'temporary',
    guestSessionId,
  };

  // Save only in sessionStorage & in-memory (never localStorage)
  saveGuestSessionUser(guestUser);

  // Initialize temporary in-memory test state
  const initialGuestState = createInitialGuestAppState();
  saveGuestAppState(initialGuestState);

  return {
    success: true,
    user: guestUser,
  };
}

/**
 * Exits guest login:
 * 1. Cleans up all temporary in-memory & sessionStorage data
 * 2. Signs out the anonymous Firebase user
 */
export async function exitGuestLogin(): Promise<void> {
  try {
    cleanupGuestSession();
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn('Notice signing out guest user:', err);
  } finally {
    clearGuestSessionStorage();
  }
}
