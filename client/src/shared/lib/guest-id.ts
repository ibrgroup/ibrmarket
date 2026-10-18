/**
 * Guest ID Management
 *
 * Provides persistent guest identification for cart/wishlist
 * before user authentication.
 *
 * CRITICAL:
 * - GuestId is created once and persists across page reloads
 * - Stored in localStorage with key "guest-id"
 * - Cleared on logout (when user logs in, guest session ends)
 * - New guestId created when guest shops again after logout
 */

const GUEST_ID_KEY = 'guest-id';

/**
 * Generates a UUID v4
 * @returns UUID string
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets existing guest ID or creates a new one
 *
 * CRITICAL:
 * - Checks localStorage first
 * - Creates UUID only if doesn't exist
 * - Returns same ID across page reloads
 * - Thread-safe (localStorage is synchronous)
 *
 * @returns Guest ID (UUID string)
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    // SSR: return temporary ID (will be replaced on client)
    return `temp-${Date.now()}`;
  }

  try {
    // Check if guest ID already exists
    const existingId = localStorage.getItem(GUEST_ID_KEY);
    if (existingId) {
      return existingId;
    }

    // Create new guest ID
    const newId = generateUUID();
    localStorage.setItem(GUEST_ID_KEY, newId);

    console.log('🆔 [GuestId] Created new guest ID:', newId);
    return newId;
  } catch (error) {
    // localStorage might be disabled or full
    console.error('❌ [GuestId] Failed to access localStorage:', error);
    // Return session-only ID (will be lost on page reload)
    return `session-${Date.now()}`;
  }
}

/**
 * Clears guest ID from localStorage
 *
 * Called on:
 * - User logout
 * - After successful guest cart/wishlist merge on login
 *
 * @returns true if cleared successfully, false otherwise
 */
export function clearGuestId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY);
    if (existingId) {
      localStorage.removeItem(GUEST_ID_KEY);
      console.log('🗑️ [GuestId] Cleared guest ID:', existingId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ [GuestId] Failed to clear guest ID:', error);
    return false;
  }
}

/**
 * Checks if guest ID exists in localStorage
 *
 * Used to determine if there is a guest session to restore
 *
 * @returns true if guest ID exists, false otherwise
 */
export function hasGuestId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const id = localStorage.getItem(GUEST_ID_KEY);
    return id !== null && id !== undefined && id !== '';
  } catch (error) {
    return false;
  }
}

/**
 * Gets existing guest ID without creating a new one
 *
 * @returns Guest ID if exists, null otherwise
 */
export function getGuestId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    return null;
  }
}
