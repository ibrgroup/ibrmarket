/**
 * Типы для модального окна авторизации
 */

/**
 * Шаги модального окна авторизации
 */
export enum AuthModalStep {
  /** Ввод контакта (email/phone) */
  CONTACT = 'contact',
  /** Ввод OTP кода */
  OTP = 'otp',
  /** Экран успешной авторизации */
  SUCCESS = 'success',
}

/**
 * Intent - действие, которое нужно выполнить после успешного входа
 */
export type AuthIntent =
  | { type: 'none' } // Просто логин
  | { type: 'checkout' } // Переход в checkout
  | { type: 'profile' } // Переход в профиль
  | { type: 'orders' } // Переход в заказы
  | { type: 'delivery' } // После входа — форма адреса доставки
  | { type: 'custom'; url: string }; // Кастомный URL

/**
 * Состояние модального окна авторизации
 */
export interface AuthModalState {
  /** Открыта ли модалка */
  isOpen: boolean;
  /** Текущий шаг */
  currentStep: AuthModalStep;
  /** Контакт пользователя (email или phone) */
  contact: string;
  /** Intent - что делать после успешного входа */
  intent: AuthIntent;
  /** Ошибка */
  error: string | null;
  /** Загрузка */
  isLoading: boolean;
}

/**
 * Действия для модального окна авторизации
 */
export interface AuthModalActions {
  /** Открыть модалку */
  open: (intent?: AuthIntent) => void;
  /** Закрыть модалку */
  close: () => void;
  /** Установить шаг */
  setStep: (step: AuthModalStep) => void;
  /** Установить контакт */
  setContact: (contact: string) => void;
  /** Установить ошибку */
  setError: (error: string | null) => void;
  /** Установить загрузку */
  setLoading: (isLoading: boolean) => void;
  /** Сбросить состояние */
  reset: () => void;
  /** Сбросить только если на первом шаге, иначе сохранить прогресс */
  resetIfNeeded: () => void;
}

/**
 * Полный store модального окна авторизации
 */
export type AuthModalStore = AuthModalState & AuthModalActions;
