import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { GoogleUserProfile, saveGoogleUser } from './cloudBackupService';
import { Language } from '../types';

export interface AuthErrorResponse {
  code: string;
  messageEn: string;
  messageHi: string;
  messageOr: string;
  messageBn: string;
}

/**
 * Standard User-friendly localized error dictionary
 * Technical Firebase error codes are NEVER shown to the user.
 */
export const AUTH_ERRORS: Record<string, AuthErrorResponse> = {
  EMPTY_LOGIN_ID: {
    code: 'EMPTY_LOGIN_ID',
    messageEn: 'Please enter your Login ID or Email.',
    messageHi: 'कृपया अपनी लॉगिन आईडी या ईमेल दर्ज करें।',
    messageOr: 'ଦୟାକରି ଆପଣଙ୍କର ଲଗଇନ୍ ID କିମ୍ବା ଇମେଲ୍ ପ୍ରବେଶ କରନ୍ତୁ।',
    messageBn: 'অনুগ্রহ করে আপনার লগইন আইডি বা ইমেল লিখুন।',
  },
  EMPTY_PASSWORD: {
    code: 'EMPTY_PASSWORD',
    messageEn: 'Please enter your password.',
    messageHi: 'कृपया अपना पासवर्ड दर्ज करें।',
    messageOr: 'ଦୟାକରି ଆପଣଙ୍କର ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ।',
    messageBn: 'অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন।',
  },
  SHORT_PASSWORD: {
    code: 'SHORT_PASSWORD',
    messageEn: 'Password must be at least 6 characters long.',
    messageHi: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
    messageOr: 'ପାସୱାର୍ଡ ଅତି କମରେ 6 ଅକ୍ଷର ବିଶିଷ୍ଟ ହେବା ଉଚିତ।',
    messageBn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
  },
  WRONG_CREDENTIALS: {
    code: 'WRONG_CREDENTIALS',
    messageEn: 'Wrong Login ID or password. Please verify.',
    messageHi: 'गलत लॉगिन आईडी या पासवर्ड। कृपया जांचें।',
    messageOr: 'ଭୁଲ୍ ଲଗଇନ୍ ID କିମ୍ବା ପାସୱାର୍ଡ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ।',
    messageBn: 'ভুল লগইন আইডি বা পাসওয়ার্ড। অনুগ্রহ করে যাচাই করুন।',
  },
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    messageEn: 'User not found. Please check your ID or create an account.',
    messageHi: 'खाता नहीं मिला। कृपया अपनी आईडी जांचें या नया खाता बनाएं।',
    messageOr: 'ଖାତା ମିଳିଲା ନାହିଁ। ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ କିମ୍ବା ନୂଆ ଖାତା ଖୋଲନ୍ତୁ।',
    messageBn: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আইডি যাচাই করুন বা নতুন অ্যাকাউন্ট তৈরি করুন।',
  },
  EMAIL_ALREADY_IN_USE: {
    code: 'EMAIL_ALREADY_IN_USE',
    messageEn: 'This email or Login ID is already registered.',
    messageHi: 'यह ईमेल या लॉगिन आईडी पहले से पंजीकृत है।',
    messageOr: 'ଏହି ଇମେଲ୍ କିମ୍ବା ଲଗଇନ୍ ID ପୂର୍ବରୁ ପଞ୍ଜୀକୃତ ହୋଇଛି।',
    messageBn: 'এই ইমেল বা লগইন আইডি ইতিমধ্যে নিবন্ধিত।',
  },
  TOO_MANY_ATTEMPTS: {
    code: 'TOO_MANY_ATTEMPTS',
    messageEn: 'Too many failed attempts. Please try again after a few minutes.',
    messageHi: 'बहुत अधिक गलत प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।',
    messageOr: 'ଅତ୍ୟଧିକ ଚେଷ୍ଟା କରାଯାଇଛି। ଦୟାକରି କିଛି ସମୟ ପରେ ଚେଷ୍ଟା କରନ୍ତୁ।',
    messageBn: 'অনেক বার ভুল চেষ্টা করা হয়েছে। অনুগ্রহ করে কয়েক মিনিট পর আবার চেষ্টা করুন।',
  },
  NO_INTERNET: {
    code: 'NO_INTERNET',
    messageEn: 'No internet connection. Please check your network.',
    messageHi: 'इंटरनेट कनेक्शन नहीं है। कृपया अपना नेटवर्क जांचें।',
    messageOr: 'ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ନାହିଁ। ଦୟାକରି ନେଟୱାର୍କ ଯାଞ୍ଚ କରନ୍ତୁ।',
    messageBn: 'ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে আপনার নেটওয়ার্ক চেক করুন।',
  },
  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    messageEn: 'This account has been disabled. Please contact support.',
    messageHi: 'यह खाता बंद (निष्क्रिय) कर दिया गया है। कृपया सहायता से संपर्क करें।',
    messageOr: 'ଏହି ଖାତା ବନ୍ଦ କରାଯାଇଛି। ଦୟାକରି ସହାୟତା ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
    messageBn: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে সহায়তার সাথে যোগাযোগ করুন।',
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    messageEn: 'Something went wrong. Please try again.',
    messageHi: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
    messageOr: 'କିଛି ଭୁଲ୍ ହୋଇଛି। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
    messageBn: 'কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  },
};

export function getLocalizedAuthError(errorKey: string, lang: Language): string {
  const err = AUTH_ERRORS[errorKey] || AUTH_ERRORS.UNKNOWN_ERROR;
  switch (lang) {
    case 'hi':
      return err.messageHi;
    case 'or':
      return err.messageOr;
    case 'bn':
      return err.messageBn;
    case 'en':
    default:
      return err.messageEn;
  }
}

/**
 * Normalizes input:
 * - Trims leading and trailing spaces
 * - Preserves case
 * - If not containing an @ symbol, creates a standard synthetic shop email
 *   e.g. "shree_ram_store" -> "shree_ram_store@dukankhata.app"
 */
export function normalizeLoginId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Remove spaces or invalid email characters for localpart while keeping recognizable id
  const sanitized = trimmed.replace(/\s+/g, '_').toLowerCase();
  return `${sanitized}@dukankhata.app`;
}

/**
 * Maps raw Firebase auth errors to friendly user codes
 */
function mapFirebaseErrorCode(fbCode: string): string {
  switch (fbCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-login-credentials':
      return 'WRONG_CREDENTIALS';
    case 'auth/user-not-found':
      return 'USER_NOT_FOUND';
    case 'auth/email-already-in-use':
      return 'EMAIL_ALREADY_IN_USE';
    case 'auth/too-many-requests':
      return 'TOO_MANY_ATTEMPTS';
    case 'auth/user-disabled':
      return 'ACCOUNT_DISABLED';
    case 'auth/network-request-failed':
      return 'NO_INTERNET';
    case 'auth/weak-password':
      return 'SHORT_PASSWORD';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Helper to build GoogleUserProfile from FirebaseUser
 */
export function buildUserProfile(user: FirebaseUser, originalLoginId?: string): GoogleUserProfile {
  const email = user.email || '';
  const isSynthetic = email.endsWith('@dukankhata.app');
  const displayLoginId = originalLoginId || (isSynthetic ? email.replace('@dukankhata.app', '') : email);

  const profile: GoogleUserProfile = {
    uid: user.uid,
    name: user.displayName || displayLoginId.split('@')[0] || 'Dukandar',
    email: isSynthetic ? '' : email,
    photoURL: user.photoURL || undefined,
  };
  return profile;
}

/**
 * Sign In with Login ID or Email and Password
 * Strictly avoids logging or storing the password.
 */
export async function signInWithEmailOrLoginId(
  loginIdOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: GoogleUserProfile; errorKey?: string }> {
  const cleanInput = loginIdOrEmail.trim();

  // Validate empty fields
  if (!cleanInput) {
    return { success: false, errorKey: 'EMPTY_LOGIN_ID' };
  }
  if (!password) {
    return { success: false, errorKey: 'EMPTY_PASSWORD' };
  }

  // Connectivity check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, errorKey: 'NO_INTERNET' };
  }

  const emailToUse = normalizeLoginId(cleanInput);

  try {
    const credential = await signInWithEmailAndPassword(auth, emailToUse, password);
    const profile = buildUserProfile(credential.user, cleanInput);
    saveGoogleUser(profile);
    // Record login timestamp
    try {
      localStorage.setItem(`dukankhata_last_login_${credential.user.uid}`, new Date().toISOString());
      localStorage.setItem(`dukankhata_login_id_${credential.user.uid}`, cleanInput);
    } catch {}

    return { success: true, user: profile };
  } catch (err: any) {
    const errorKey = mapFirebaseErrorCode(err?.code || '');
    return { success: false, errorKey };
  }
}

/**
 * Register / Create Account with Email / Login ID
 */
export async function registerWithEmailOrLoginId(
  loginIdOrEmail: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; user?: GoogleUserProfile; errorKey?: string }> {
  const cleanInput = loginIdOrEmail.trim();

  if (!cleanInput) {
    return { success: false, errorKey: 'EMPTY_LOGIN_ID' };
  }
  if (!password) {
    return { success: false, errorKey: 'EMPTY_PASSWORD' };
  }
  if (password.length < 6) {
    return { success: false, errorKey: 'SHORT_PASSWORD' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, errorKey: 'NO_INTERNET' };
  }

  const emailToUse = normalizeLoginId(cleanInput);

  try {
    const credential = await createUserWithEmailAndPassword(auth, emailToUse, password);
    if (displayName?.trim()) {
      try {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      } catch {}
    }
    const profile = buildUserProfile(credential.user, cleanInput);
    saveGoogleUser(profile);
    try {
      localStorage.setItem(`dukankhata_last_login_${credential.user.uid}`, new Date().toISOString());
      localStorage.setItem(`dukankhata_login_id_${credential.user.uid}`, cleanInput);
    } catch {}

    return { success: true, user: profile };
  } catch (err: any) {
    const errorKey = mapFirebaseErrorCode(err?.code || '');
    return { success: false, errorKey };
  }
}

/**
 * Password Reset via Email
 */
export async function sendUserPasswordReset(
  emailOrLoginId: string
): Promise<{ success: boolean; errorKey?: string }> {
  const cleanInput = emailOrLoginId.trim();
  if (!cleanInput) {
    return { success: false, errorKey: 'EMPTY_LOGIN_ID' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, errorKey: 'NO_INTERNET' };
  }

  const emailToUse = cleanInput.includes('@') ? cleanInput : `${cleanInput}@gmail.com`;

  try {
    await sendPasswordResetEmail(auth, emailToUse);
    return { success: true };
  } catch (err: any) {
    const errorKey = mapFirebaseErrorCode(err?.code || '');
    return { success: false, errorKey };
  }
}

/**
 * Logout
 */
export async function logoutAppUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Sign out error:', e);
  } finally {
    saveGoogleUser(null);
  }
}
