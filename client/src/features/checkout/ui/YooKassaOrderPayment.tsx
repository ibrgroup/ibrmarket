'use client';

import { useInitPayment, usePayWithSavedCard } from '@/entities/order';
import { usePaymentMethods } from '@/shared/store/payment';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Separator } from '@/shared/ui/separator';
import { CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface YooKassaOrderPaymentProps {
  orderId: string;
  disabled?: boolean;
}

/**
 * Блок оплаты заказа: сохранённая карта ЮKassa или новая (редирект) + опция сохранить карту.
 */
export function YooKassaOrderPayment({ orderId, disabled }: YooKassaOrderPaymentProps) {
  const { methods, defaultMethod, actions } = usePaymentMethods();
  const [mode, setMode] = useState<'new' | 'saved'>('new');
  const [selectedMongoId, setSelectedMongoId] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  const returnUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}/checkout/success?orderId=${orderId}`
        : '',
    [orderId],
  );

  useEffect(() => {
    void actions.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zustand actions stable enough; fetch once on mount
  }, []);

  useEffect(() => {
    if (methods.length > 0) {
      setMode('saved');
    } else {
      setMode('new');
    }
  }, [methods.length]);

  useEffect(() => {
    if (defaultMethod) {
      setSelectedMongoId(defaultMethod.id);
    } else if (methods[0]) {
      setSelectedMongoId(methods[0].id);
    }
  }, [defaultMethod, methods]);

  const goAfterPaid = () => {
    window.location.href = returnUrl;
  };

  const { mutate: initPayment, isPending: initPending } = useInitPayment({
    onSuccess: (data) => {
      if (data.paid) {
        toast.success('Оплата прошла успешно');
        goAfterPaid();
        return;
      }
      if (data.confirmation_url) {
        toast.info('Переход на страницу оплаты...', { duration: 2000 });
        setTimeout(() => {
          window.location.href = data.confirmation_url!;
        }, 400);
        return;
      }
      toast.error('Нет ссылки на оплату. Обновите страницу или попробуйте позже.');
    },
    onError: (e) => toast.error(e.message || 'Не удалось начать оплату'),
  });

  const { mutate: paySaved, isPending: savedPending } = usePayWithSavedCard({
    onSuccess: (data) => {
      if (data.paid) {
        toast.success('Оплата прошла успешно');
        goAfterPaid();
        return;
      }
      if (data.confirmation_url) {
        toast.info('Подтвердите оплату у банка...', { duration: 2000 });
        setTimeout(() => {
          window.location.href = data.confirmation_url!;
        }, 400);
        return;
      }
      toast.error('Ожидание подтверждения банка. Проверьте заказ в «Мои заказы».');
    },
    onError: (e) => toast.error(e.message || 'Не удалось оплатить сохранённой картой'),
  });

  const pending = initPending || savedPending;

  const handlePay = () => {
    if (disabled || !returnUrl) return;

    if (mode === 'saved') {
      const m = methods.find((x) => x.id === selectedMongoId);
      if (!m?.paymentMethodId) {
        toast.error('Выберите карту');
        return;
      }
      paySaved({
        orderId,
        paymentMethodId: m.paymentMethodId,
        return_url: returnUrl,
      });
      return;
    }

    initPayment({
      orderId,
      return_url: returnUrl,
      save_payment_method: saveCard,
    });
  };

  const canUseSaved = methods.length > 0;

  return (
    <div className="space-y-4">
      {canUseSaved && (
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as 'new' | 'saved')}
          className="grid gap-3"
        >
          <div className="flex items-start space-x-3 rounded-xl border border-border p-3">
            <RadioGroupItem value="saved" id="pay-saved" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="pay-saved" className="cursor-pointer font-medium">
                Сохранённая карта
              </Label>
              {mode === 'saved' && (
                <div className="space-y-2 pl-0">
                  {methods.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 hover:bg-muted/50 has-[:checked]:border-primary"
                    >
                      <input
                        type="radio"
                        name="saved-card"
                        checked={selectedMongoId === m.id}
                        onChange={() => setSelectedMongoId(m.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">
                        {m.brand} ·••• {m.lastFour}
                        {m.isDefault ? (
                          <span className="ml-2 text-xs text-muted-foreground">по умолчанию</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Управление картами — в{' '}
                    <Link href="/settings/payment-methods" className="text-primary underline">
                      настройках
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-xl border border-border p-3">
            <RadioGroupItem value="new" id="pay-new" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="pay-new" className="cursor-pointer font-medium">
                Другая карта (YooKassa)
              </Label>
              {mode === 'new' && (
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="save-card"
                    checked={saveCard}
                    onCheckedChange={(c) => setSaveCard(c === true)}
                  />
                  <Label htmlFor="save-card" className="cursor-pointer text-sm font-normal">
                    Сохранить карту для следующих покупок
                  </Label>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      )}

      {!canUseSaved && (
        <div className="space-y-3 rounded-xl border border-border p-3">
          <p className="text-sm text-muted-foreground">
            Оплата через YooKassa. При желании отметьте «сохранить карту» — она появится в{' '}
            <Link href="/settings/payment-methods" className="text-primary underline">
              способах оплаты
            </Link>
            .
          </p>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-card-only"
              checked={saveCard}
              onCheckedChange={(c) => setSaveCard(c === true)}
            />
            <Label htmlFor="save-card-only" className="cursor-pointer text-sm font-normal">
              Сохранить карту для следующих покупок
            </Label>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="h-13 w-full rounded-2xl"
        onClick={handlePay}
        disabled={disabled || pending}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Оплата...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {mode === 'saved' ? 'Оплатить сохранённой картой' : 'Перейти к оплате YooKassa'}
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'saved'
          ? 'При необходимости банк может запросить подтверждение (3‑D Secure).'
          : 'Вы будете перенаправлены на защищённую страницу YooKassa'}
      </p>

      <Separator />

      <p className="text-center text-xs text-muted-foreground">Заказ зарезервирован на 30 минут</p>
    </div>
  );
}
