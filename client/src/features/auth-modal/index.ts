/**
 * Публичный API фичи auth-modal
 */

// UI Components
export { AuthModal } from './ui/AuthModal';
export { ProtectedRoute } from './ui/ProtectedRoute';
export { SignInPrompt } from './ui/SignInPrompt';

// Hooks
export { useAuthGuard, useAuthModal, useRequireAuth } from './lib/hooks';

// Types
export { AuthModalStep } from './model/types';
export type { AuthIntent } from './model/types';

// Store (для продвинутого использования)
export { useAuthModalStore } from './model/auth-modal.store';
