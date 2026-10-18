/**
 * Global BroadcastChannel singleton for auth synchronization
 *
 * CRITICAL: Single channel instance per session to prevent:
 * - Multiple channels being created
 * - Channels being closed immediately after sending
 * - Memory leaks from unclosed channels
 */

const AUTH_BROADCAST_CHANNEL_NAME = 'auth-sync';

let globalChannel: BroadcastChannel | null = null;

/**
 * Get or create global BroadcastChannel instance
 * Channel is kept open for the entire session
 *
 * @returns BroadcastChannel instance or null if not supported
 */
export function getAuthBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }

  if (!globalChannel) {
    globalChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL_NAME);
  }

  return globalChannel;
}

/**
 * Close global BroadcastChannel instance
 * Should be called on logout or app unmount
 */
export function closeAuthBroadcastChannel(): void {
  if (globalChannel) {
    globalChannel.close();
    globalChannel = null;
  }
}

/**
 * Check if global channel exists
 */
export function hasAuthBroadcastChannel(): boolean {
  return globalChannel !== null;
}
