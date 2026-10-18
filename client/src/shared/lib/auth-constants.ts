/**
 * Authentication Constants
 *
 * Central location for all authentication-related constants.
 * These values should match the backend configuration.
 *
 * SECURITY NOTES:
 * - Token lifetimes are set by backend JWT configuration
 * - Frontend values are for UI/refresh timing only
 * - Backend is always the source of truth
 */

// =============================================================================
// TOKEN LIFETIMES (Frontend reference - actual enforcement is on backend)
// =============================================================================

/**
 * Access token lifetime in milliseconds
 * Matches backend: 24 hours
 */
export const ACCESS_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Refresh token lifetime in milliseconds
 * Matches backend: 60 days
 */
export const REFRESH_TOKEN_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

/**
 * Extended cookie lifetime in seconds (for backwards compatibility)
 * Used in legacy setCookie function
 */
export const EXTENDED_TOKEN_LIFETIME_SECONDS = 60 * 24 * 60 * 60; // 60 days

// =============================================================================
// REFRESH TIMING
// =============================================================================

/**
 * Buffer time before token expiration to trigger refresh
 * Refresh happens this many milliseconds BEFORE token expires
 */
export const REFRESH_BUFFER_MS = 60_000; // 1 minute before expiration

/**
 * Minimum interval between refresh attempts
 * Prevents rapid-fire refresh requests during errors
 */
export const MIN_REFRESH_INTERVAL_MS = 30_000; // 30 seconds

/**
 * After a 401 from refresh endpoint, do not call refresh again for this period.
 * Prevents mass refresh requests when refresh token cookie is missing or invalid.
 */
export const REFRESH_401_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum interval between refresh checks
 * Caps the delay for very long-lived tokens
 */
export const MAX_REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Grace period for token expiration check in middleware
 * Prevents redirect loops when token is about to expire
 * Token is considered valid if it expires within this window
 */
export const MIDDLEWARE_TOKEN_GRACE_PERIOD_SECONDS = 30;

// =============================================================================
// BROADCAST CHANNEL
// =============================================================================

/**
 * Debounce interval for BroadcastChannel events
 * Prevents duplicate handling of rapid auth events across tabs
 */
export const BROADCAST_DEBOUNCE_MS = 100;

// =============================================================================
// COOKIE NAMES
// =============================================================================

/**
 * Access token cookie name
 * MUST match backend configuration
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken';

/**
 * Refresh token cookie name
 * MUST match backend configuration
 */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

// =============================================================================
// BROADCAST CHANNEL
// =============================================================================

/**
 * BroadcastChannel name for auth synchronization
 */
export const AUTH_BROADCAST_CHANNEL_NAME = 'auth-sync';

// =============================================================================
// BROADCAST EVENT TYPES
// =============================================================================

export const AUTH_EVENTS = {
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  OTP_VERIFIED: 'OTP_VERIFIED',
  LOGIN: 'LOGIN', // Legacy, same as OTP_VERIFIED
} as const;

export type AuthEventType = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS];
