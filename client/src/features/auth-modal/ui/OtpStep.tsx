/**
 * Второй шаг модального окна авторизации - ввод OTP кода
 */

'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import { maskContact } from '../lib/utils';
import { ERROR_MESSAGES, OTP_LENGTH, OTP_RESEND_COOLDOWN } from '../model/constants';

interface OtpStepProps {
  /** Контакт пользователя (email или phone) */
  contact: string;
  /** Callback при отправке OTP */
  onSubmit: (otp: string) => Promise<void>;
  /** Callback при запросе повторной отправки OTP */
  onResend: () => Promise<void>;
  /** Callback при возврате на предыдущий шаг */
  onBack: () => void;
}

/**
 * Компонент второго шага авторизации - ввод OTP кода
 */
export function OtpStep({ contact, onSubmit, onResend, onBack }: OtpStepProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Таймер для повторной отправки
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
    return undefined;
  }, [resendCooldown]);

  // Фокус на первый инпут при монтировании
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    setError(null);

    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Автофокус на следующий инпут
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Автоматическая отправка при заполнении всех полей
    if (value && index === OTP_LENGTH - 1 && newOtp.every((digit) => digit)) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace - переход на предыдущий инпут
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // ArrowLeft - переход на предыдущий инпут
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // ArrowRight - переход на следующий инпут
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Проверяем, что вставленные данные - это цифры
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const digits = pastedData.slice(0, OTP_LENGTH).split('');
    const newOtp = [...otp];

    digits.forEach((digit, index) => {
      newOtp[index] = digit;
    });

    setOtp(newOtp);

    // Фокус на следующий пустой инпут или последний
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Автоматическая отправка если все поля заполнены
    if (newOtp.every((digit) => digit)) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleSubmit = async (otpCode: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit(otpCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.OTP_VERIFY_FAILED);
      // Очищаем инпуты при ошибке
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError(null);
    setCanResend(false);
    setResendCooldown(OTP_RESEND_COOLDOWN);

    try {
      await onResend();
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.OTP_SEND_FAILED);
      setCanResend(true);
      setResendCooldown(0);
    }
  };

  const maskedContact = maskContact(contact);

  return (
    <div className="space-y-3">

      {/* Кнопка "Назад" */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute rounded-full w-10 h-10 left-4 top-2 p-0"
        disabled={isLoading}
      >
        <ArrowLeft size={21} />
      </Button>

      {/* Заголовок */}

      <div className="text-center mt-[10vh]">
        <img className='w-52 my-5 m-auto' src="/ibrmarket.png" alt="ibrmarket" />
        <div className='space-y-3 bg-gray-200 md:bg-gray-100 p-5 rounded-3xl'>
          <h2 className="text-2xl font-bold mt-2 text-center font-roboto">Введите код</h2>
          <p className="mt-2 text-sm text-muted-foreground">Код отправлен на {maskedContact}</p>
          {process.env.NEXT_PUBLIC_SHOW_DEMO_OTP_HINT === 'true' && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Демо: введите{' '}
              <span className="font-mono font-semibold">
                {process.env.NEXT_PUBLIC_DEMO_OTP_CODE || '555555'}
              </span>
              , если на сервере включён <span className="font-mono">DEMO_MASTER_OTP=true</span>
            </p>
          )}

          {/* OTP инпуты */}
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="h-12 w-12 font-roboto bg-white text-center"
                  aria-label={`Цифра ${index + 1}`}
                />
              ))}
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-center text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Повторная отправка */}
            <div className="text-center">
              {canResend ? (
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="h-auto p-0 text-sm"
                >
                  Отправить код повторно
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Отправить повторно через {resendCooldown} сек
                </p>
              )}
            </div>

            {/* Индикатор загрузки */}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
