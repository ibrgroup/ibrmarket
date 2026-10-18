'use client';

import { formatPhoneForDisplay } from '@/shared/lib/contact-utils';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { OtpInput } from '@/shared/ui/otp-input';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

/**
 * Константа для обратного отсчета повторной отправки OTP
 */
const OTP_RESEND_COUNTDOWN_SECONDS = 60;

/**
 * Схема валидации для OTP кода с Zod
 */
const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Код должен содержать 6 цифр')
    .regex(/^\d{6}$/, 'Код должен содержать только цифры'),
});

interface OTPFormProps {
  contact: string;
  method: 'phone' | 'email';
  onSubmit: (otp: string) => Promise<void>;
  /**
   * Обработчик повторной отправки кода (возвращает void)
   * Таймер управляется внутри компонента
   */
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
  otpAutoFocus?: boolean;
}

export function OTPForm({
  contact,
  method,
  onSubmit,
  onResend,
  onBack,
  isLoading = false,
  error,
  otpAutoFocus = true,
}: OTPFormProps) {
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(OTP_RESEND_COUNTDOWN_SECONDS);

  // Упрощенный таймер обратного отсчета (один источник истины)
  // Используем один интервал, который работает постоянно
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Сброс ошибки при изменении кода (без setTimeout)
  useEffect(() => {
    if (otpError) {
      setOtpError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]); // otpError не включаем в зависимости, чтобы избежать циклов

  // Валидация и отправка
  const handleSubmit = useCallback(async () => {
    const validationResult = otpSchema.safeParse({ otp: otpValue });

    if (!validationResult.success) {
      const issue = validationResult.error.issues[0]?.message || 'Некорректный код';
      setOtpError(issue);
      setOtpValue('');
      return;
    }

    setOtpError(null);
    await onSubmit(otpValue);
  }, [otpValue, onSubmit]);

  // Отправка по Enter (UX улучшение)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && otpValue.length === 6 && !isLoading) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [otpValue.length, isLoading, handleSubmit],
  );

  // Вызывается, когда пользователь ввел 6 символов
  const handleOtpComplete = useCallback((otp: string) => {
    setOtpValue(otp);
    setOtpError(null);
  }, []);

  // Обработка повторной отправки кода
  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    try {
      await onResend();
      // После успешной отправки запускаем таймер
      setCountdown(OTP_RESEND_COUNTDOWN_SECONDS);
    } catch {
      // Ошибка уже обработана в родительском компоненте (serverError)
      // Здесь только сбрасываем таймер не нужно
    }
  }, [countdown, onResend]);

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          aria-live="polite"
        >
          {error}
        </div>
      )}
      {otpError && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          aria-live="polite"
        >
          {otpError}
        </div>
      )}

      {/* Показываем контакт пользователя */}
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-muted-foreground text-sm">Код отправлен на</p>
        <p className="font-semibold">
          {method === 'phone' ? formatPhoneForDisplay(contact) : contact}
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-2" onKeyDown={handleKeyDown}>
        <Label className="block text-center">Введите 6-значный код</Label>
        <OtpInput
          length={6}
          onComplete={handleOtpComplete}
          onChange={setOtpValue}
          disabled={isLoading}
          error={!!otpError || !!error}
          autoFocus={otpAutoFocus}
          value={otpValue}
        />
      </div>

      {/* Таймер и повторная отправка */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-muted-foreground text-sm">
            Отправить код повторно через {countdown} сек
          </p>
        ) : (
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={isLoading}
            className="text-primary"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Отправка...
              </span>
            ) : (
              'Отправить код повторно'
            )}
          </Button>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || otpValue.length !== 6}
          className="flex-1"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Проверка...
            </span>
          ) : (
            'Подтвердить'
          )}
        </Button>
      </div>
    </div>
  );
}
