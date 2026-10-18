/**
 * Zustand store для модального окна авторизации
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AuthModalStore } from './types';
import { AuthModalStep } from './types';

const initialState = {
  isOpen: false,
  currentStep: AuthModalStep.CONTACT,
  contact: '',
  intent: { type: 'none' as const },
  error: null,
  isLoading: false,
};

/**
 * Store для управления модальным окном авторизации
 *
 * @example
 * ```ts
 * const { open, close, setStep } = useAuthModalStore();
 *
 * // Открыть модалку для обычного логина
 * open();
 *
 * // Открыть модалку с intent для checkout
 * open({ type: 'checkout' });
 * ```
 */
export const useAuthModalStore = create<AuthModalStore>()(
  devtools(
    (set) => ({
      ...initialState,

      open: (intent = { type: 'none' }) =>
        set((state) => {
          // Если модалка уже была открыта и есть прогресс (OTP или SUCCESS) - сохраняем его
          // Иначе начинаем с первого шага
          const shouldReset =
            state.currentStep === AuthModalStep.CONTACT || !state.contact;

          return {
            isOpen: true,
            intent,
            currentStep: shouldReset ? AuthModalStep.CONTACT : state.currentStep,
            error: null,
            // Если сбрасываем - очищаем контакт, иначе сохраняем
            contact: shouldReset ? '' : state.contact,
          };
        }),

      close: () =>
        set({
          isOpen: false,
          // НЕ сбрасываем состояние - сохраняем для повторного открытия
        }),

      setStep: (step) =>
        set({
          currentStep: step,
          error: null,
        }),

      setContact: (contact) =>
        set({
          contact,
        }),

      setError: (error) =>
        set({
          error,
          isLoading: false,
        }),

      setLoading: (isLoading) =>
        set({
          isLoading,
          error: null,
        }),

      reset: () => set(initialState),

      /**
       * Сбросить только если на первом шаге, иначе сохранить прогресс
       */
      resetIfNeeded: () =>
        set((state) => {
          // Если на шаге CONTACT - сбрасываем полностью
          if (state.currentStep === AuthModalStep.CONTACT) {
            return initialState;
          }
          // Иначе только закрываем, но сохраняем состояние
          return { ...state, isOpen: false };
        }),
    }),
    { name: 'AuthModalStore' }
  )
);
