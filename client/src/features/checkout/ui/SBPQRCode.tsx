'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { QRCode } from '@/shared/ui/qr-code';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { orderService } from '@/shared/api/services/order-service';
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  X,
  QrCode as QrCodeIcon,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { devLog } from '@/shared/lib/logger';
import { useRouter } from 'next/navigation';

interface SBPQRCodeProps {
  /** Order id — статус оплаты только через authenticated syncPayment */
  orderId: string;
  paymentId: string;
  qrCode?: string;
  confirmationUrl?: string;
  amount: string;
  expiresAt?: string;
  onPaymentSuccess?: () => void;
  onPaymentFailed?: () => void;
  onCancel?: () => void;
  className?: string;
}

/**
 * QR СБП с проверкой статуса через backend sync (без Next BFF YooKassa).
 */
export function SBPQRCode({
  orderId,
  paymentId: _paymentId,
  qrCode,
  confirmationUrl,
  amount,
  expiresAt,
  onPaymentSuccess,
  onPaymentFailed,
  onCancel,
  className,
}: SBPQRCodeProps) {
  void _paymentId;
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'succeeded' | 'canceled' | 'expired'>('pending');
  const [isChecking, setIsChecking] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number>(600);
  const [copied, setCopied] = useState(false);

  const statusCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkPaymentStatus = useCallback(async () => {
    if (isChecking || status !== 'pending' || !orderId) return;

    setIsChecking(true);
    try {
      const result = await orderService.syncPayment(orderId);
      if (result.order_status === 'PAID') {
        setStatus('succeeded');
        toast.success('Платеж успешно выполнен!');
        onPaymentSuccess?.();
      } else if (result.order_status === 'CANCELLED') {
        setStatus('canceled');
        toast.error('Платеж отменен');
        onPaymentFailed?.();
      }
    } catch (error) {
      devLog.error('Error checking payment status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [orderId, isChecking, status, onPaymentSuccess, onPaymentFailed]);

  // Автоматическая проверка статуса каждые 5 секунд (снижение нагрузки)
  useEffect(() => {
    if (status !== 'pending') {
      // Очищаем интервал если статус изменился
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
      return;
    }

    // Первая проверка сразу
    checkPaymentStatus();

    // Устанавливаем интервал и сохраняем ID
    statusCheckIntervalRef.current = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    // Cleanup функция
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [status, checkPaymentStatus]);

  // Проверка статуса при возврате на вкладку
  useEffect(() => {
    if (status !== 'pending') return;

    const handleFocus = () => {
      // Проверяем статус при возврате на вкладку
      checkPaymentStatus();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [status, checkPaymentStatus]);

  // Таймер до истечения срока действия QR-кода
  useEffect(() => {
    if (!expiresAt || status !== 'pending') {
      // Очищаем интервал если статус изменился или нет expiresAt
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setStatus('expired');
        toast.error('Время действия QR-кода истекло');
        onPaymentFailed?.();
      } else {
        const seconds = Math.floor(diff / 1000);
        setTimeLeft(seconds);

        // Инициализируем общее время из expiresAt при первом обновлении
        if (totalTime === 600) {
          setTotalTime(seconds);
        }
      }
    };

    // Первое обновление сразу для инициализации totalTime
    updateTimeLeft();

    // Устанавливаем интервал и сохраняем ID
    timeUpdateIntervalRef.current = setInterval(updateTimeLeft, 1000);

    // Cleanup функция
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
    };
  }, [expiresAt, status, onPaymentFailed, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = async () => {
    if (isCanceling) return;

    setIsCanceling(true);
    try {
      setStatus('canceled');
      toast.info('Платеж отменен');
      onCancel?.();
      onPaymentFailed?.();
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = qrCode || confirmationUrl;
    if (!linkToCopy) return;

    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success('Ссылка скопирована в буфер обмена');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      devLog.error('Failed to copy link:', error);
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleCancelFallback = () => {
    // Если onCancel не передан, используем router.back()
    if (onCancel) {
      handleCancel();
    } else {
      router.back();
    }
  };

  // Прогресс в процентах
  const progressPercent =
    timeLeft !== null && totalTime > 0
      ? Math.max(0, Math.min(100, (timeLeft / totalTime) * 100))
      : 100;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'succeeded' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === 'canceled' && <XCircle className="h-5 w-5 text-red-500" />}
          {status === 'expired' && <XCircle className="h-5 w-5 text-red-500" />}
          {status === 'pending' && <Clock className="h-5 w-5 text-blue-500" />}
          <span>Оплата через СБП</span>
        </CardTitle>
        <CardDescription>Отсканируйте QR-код в приложении вашего банка для оплаты</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'pending' && (
          <>
            {/* Прогресс-бар времени */}
            {timeLeft !== null && timeLeft > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Осталось времени:</span>
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="from-primary h-full rounded-full bg-gradient-to-r to-blue-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {qrCode ? (
                <div className="relative">
                  <QRCode
                    value={qrCode}
                    size={256}
                    className="rounded-lg border-2 border-gray-200 p-4 shadow-md dark:border-gray-700"
                  />
                  {isChecking && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
                      <Loader2 className="text-primary h-8 w-8 animate-spin" />
                    </div>
                  )}
                  {/* Кнопка копирования ссылки, если qrCode - это URL */}
                  {qrCode.startsWith('http://') || qrCode.startsWith('https://') ? (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Скопировано
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Скопировать ссылку
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : confirmationUrl ? (
                <div className="flex w-full flex-col items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 dark:border-gray-700 dark:bg-gray-800/50">
                  <QrCodeIcon className="h-16 w-16 text-gray-400" />
                  <p className="text-muted-foreground text-center text-sm">
                    QR-код недоступен. Используйте кнопку ниже для перехода к оплате.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2 text-center">
                <p className="text-2xl font-bold">{parseFloat(amount).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>

            <div className="text-muted-foreground space-y-2 text-sm">
              <p className="font-medium">Инструкция:</p>
              <ol className="list-inside list-decimal space-y-1">
                <li>Откройте приложение вашего банка</li>
                <li>Найдите функцию оплаты по QR-коду</li>
                <li>Отсканируйте QR-код выше</li>
                <li>Подтвердите оплату в приложении</li>
              </ol>
            </div>

            <div className="flex gap-2">
              {confirmationUrl && !qrCode && (
                <Button onClick={() => (window.location.href = confirmationUrl)} className="flex-1">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Перейти к оплате
                </Button>
              )}
              <Button
                variant="outline"
                onClick={checkPaymentStatus}
                disabled={isChecking}
                className={confirmationUrl && !qrCode ? 'flex-1' : 'w-full'}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Проверить
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleCancelFallback}
              disabled={isCanceling}
              className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отмена...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Отменить платеж
                </>
              )}
            </Button>
          </>
        )}

        {status === 'succeeded' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="space-y-2 text-center">
              <p className="text-xl font-semibold">Платеж успешно выполнен!</p>
              <p className="text-muted-foreground text-sm">
                Сумма: {parseFloat(amount).toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        )}

        {(status === 'canceled' || status === 'expired') && (
          <div className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-16 w-16 text-red-500" />
            <div className="space-y-2 text-center">
              <p className="text-xl font-semibold">
                {status === 'expired' ? 'Время действия QR-кода истекло' : 'Платеж отменен'}
              </p>
              <p className="text-muted-foreground text-sm">
                Пожалуйста, попробуйте создать новый платеж
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
