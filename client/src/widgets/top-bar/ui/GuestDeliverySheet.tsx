'use client';

import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Check, MapPin } from 'lucide-react';

export const GUEST_DELIVERY_SHEET_ID = 'guest-delivery-sheet';

const POPULAR_CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Новосибирск',
  'Ростов-на-Дону',
  'Уфа',
  'Магас',
  'Назрань',
  'Карабулак',
  'Сунжа',
  'Малгобек',
] as const;

export type GuestDeliverySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: string;
  onSelectCity: (city: string) => void;
  onSignIn: () => void;
};

function GuestDeliveryBody({
  city,
  onSelectCity,
  onSignIn,
}: {
  city: string;
  onSelectCity: (cityName: string) => void;
  onSignIn: () => void;
}) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <p className="mb-3 text-sm text-muted-foreground">
          Сейчас показываем доставку для города. Чтобы сохранить полный адрес и быстрее оформлять
          заказы — войдите в аккаунт.
        </p>
        <ul className="space-y-2">
          {POPULAR_CITIES.map((cityName) => {
            const selected = city === cityName;
            return (
              <li key={cityName}>
                <button
                  type="button"
                  onClick={() => onSelectCity(cityName)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <MapPin
                    className={cn(
                      'h-5 w-5 shrink-0',
                      selected ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span className="min-w-0 flex-1 font-medium text-foreground">{cityName}</span>
                  {selected ? (
                    <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border px-4 pt-3 pb-4">
        <Button type="button" className="h-11 w-full rounded-xl" onClick={onSignIn}>
          Войти и указать адрес
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Город уже выбран — полный адрес можно добавить после входа
        </p>
      </div>
    </>
  );
}

export function GuestDeliverySheet({
  open,
  onOpenChange,
  city,
  onSelectCity,
  onSignIn,
}: GuestDeliverySheetProps) {
  const isMobile = useIsMobile();

  const close = () => onOpenChange(false);

  const body = (
    <GuestDeliveryBody
      city={city}
      onSelectCity={(name) => {
        onSelectCity(name);
      }}
      onSignIn={() => {
        onOpenChange(false);
        onSignIn();
      }}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          id={GUEST_DELIVERY_SHEET_ID}
          side="bottom"
          showCloseButton={false}
          className={cn(
            'flex max-h-[min(88dvh,720px)] flex-col gap-0 overflow-hidden rounded-t-3xl border-t p-0',
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="sr-only">
            <SheetTitle>Город доставки</SheetTitle>
            <SheetDescription>Выберите город или войдите, чтобы указать адрес</SheetDescription>
          </SheetHeader>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-1">
            <div className="min-w-0 flex-1 space-y-1 text-left">
              <p className="text-lg font-semibold leading-tight">Город доставки</p>
              <p className="text-sm text-muted-foreground">Выберите город или войдите в аккаунт</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={close}
            >
              Готово
            </Button>
          </div>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id={GUEST_DELIVERY_SHEET_ID}
        showCloseButton={false}
        className="flex max-h-[min(85dvh,640px)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-2xl p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Город доставки</DialogTitle>
          <DialogDescription>Выберите город или войдите, чтобы указать адрес</DialogDescription>
        </DialogHeader>
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-4">
          <div className="min-w-0 flex-1 space-y-1 text-left">
            <p className="text-lg font-semibold leading-tight">Город доставки</p>
            <p className="text-sm text-muted-foreground">Выберите город или войдите в аккаунт</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl"
            onClick={close}
          >
            Готово
          </Button>
        </div>
        {body}
      </DialogContent>
    </Dialog>
  );
}
