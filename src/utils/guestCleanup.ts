import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { clearGuestSessionStorage, getGuestSessionUser } from './guestSession';

const GUEST_STORAGE_PREFIX = 'dukankhata_guest_';

/**
 * Clears all guest session artifacts:
 * - Empties in-memory guest state
 * - Cleans all guest keys in sessionStorage
 * - Scans and purges any stray guest keys in localStorage (safeguard)
 * - Leaves all permanent user data (dukankhata_user_state_*, dukankhata_state_v1) completely untouched.
 */
export function cleanupGuestSession(): void {
  // 1. Clear guest memory and sessionStorage
  clearGuestSessionStorage();

  // 2. Safeguard scan: purge only guest-prefixed keys in localStorage if any ever got written
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(GUEST_STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('Error purging guest keys from localStorage:', err);
  }
}

/**
 * Best-effort unload handlers for Web / PWA / Android WebView:
 * Listens to pagehide and beforeunload to trigger cleanup when the browser or app tab closes.
 * Note: Per specifications, browser close cleanup is best-effort.
 */
export function registerGuestUnloadHandlers(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUnload = () => {
    const guestUser = getGuestSessionUser();
    if (guestUser?.isGuest) {
      cleanupGuestSession();
      try {
        if (auth.currentUser?.isAnonymous) {
          signOut(auth).catch(() => {});
        }
      } catch {}
    }
  };

  window.addEventListener('pagehide', handleUnload);
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    window.removeEventListener('pagehide', handleUnload);
    window.removeEventListener('beforeunload', handleUnload);
  };
}

/**
 * On application startup:
 * Detects any leftover or incomplete guest session from a previous launch and purges it
 * to ensure that reopening the app starts cleanly on the Login screen.
 * Permanent user accounts are never touched.
 */
export function detectAndCleanupStaleGuestSession(): void {
  try {
    const guestUser = getGuestSessionUser();
    if (guestUser?.isGuest) {
      cleanupGuestSession();
    }
  } catch (e) {
    console.warn('Stale guest cleanup error:', e);
  }
}
