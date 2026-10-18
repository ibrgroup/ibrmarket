/**
 * Содержимое модального окна авторизации
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { useUserStore } from '@/entities/user';
import { useAddressFormModalStore } from '@/features/address-form/model/address-form-modal.store';

import { normalizeContact } from '../lib/utils';
import { useAuthModalStore } from '../model/auth-modal.store';
import { SUCCESS_AUTO_CLOSE_DELAY } from '../model/constants';
import { AuthModalStep } from '../model/types';

import { LoginStep } from './LoginStep';
import { OtpStep } from './OtpStep';
import { SuccessStep } from './SuccessStep';

/**
 * Основной компонент содержимого модального окна авторизации
 */
export function AuthModalContent() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth Modal Store
  const { currentStep, contact, intent, setStep, setContact, setError, setLoading, close } =
    useAuthModalStore();

  // User Store
  const { sendOtp, verifyOtp, user } = useUserStore();

  // Cleanup timeout при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Отправка OTP кода
   */
  const handleSendOtp = useCallback(
    async (inputContact: string) => {
      setLoading(true);
      setContact(inputContact);

      try {
        const normalized = normalizeContact(inputContact);

        // Отправляем OTP через useUserStore
        await sendOtp(normalized);

        // Переходим на шаг ввода OTP
        setStep(AuthModalStep.OTP);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Не удалось отправить код');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sendOtp, setContact, setError, setLoading, setStep],
  );

  /**
   * Проверка OTP кода
   */
  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      setLoading(true);

      try {
        const normalized = normalizeContact(contact);

        // Верифицируем OTP через useUserStore
        await verifyOtp({
          ...normalized,
          otp,
        });

        // Переходим на шаг успеха
        setStep(AuthModalStep.SUCCESS);

        // Автоматически закрываем модалку через 1.5 секунды
        timeoutRef.current = setTimeout(() => {
          close();
          // Сбрасываем состояние после успешного входа
          const { reset } = useAuthModalStore.getState();
          reset();

          // Выполняем intent после закрытия модалки
          if (intent.type === 'checkout') {
            router.push('/checkout');
          } else if (intent.type === 'profile') {
            router.push('/my-account');
          } else if (intent.type === 'orders') {
            router.push('/purchases');
          } else if (intent.type === 'delivery') {
            useAddressFormModalStore.getState().openCreate({ preferDefault: true });
          } else if (intent.type === 'custom') {
            router.push(intent.url);
          }
        }, SUCCESS_AUTO_CLOSE_DELAY);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Неверный код');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [contact, verifyOtp, setError, setLoading, setStep, close, intent, router],
  );

  /**
   * Повторная отправка OTP
   */
  const handleResendOtp = useCallback(async () => {
    await handleSendOtp(contact);
  }, [contact, handleSendOtp]);

  /**
   * Возврат на предыдущий шаг
   */
  const handleBack = useCallback(() => {
    setStep(AuthModalStep.CONTACT);
  }, [setStep]);

  // Рендерим соответствующий шаг
  switch (currentStep) {
    case AuthModalStep.CONTACT:
      return <LoginStep onSubmit={handleSendOtp} initialContact={contact} />;

    case AuthModalStep.OTP:
      return (
        <OtpStep
          contact={contact}
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
          onBack={handleBack}
        />
      );

    case AuthModalStep.SUCCESS:
      return <SuccessStep userName={user?.name} />;

    default:
      return null;
  }
}
