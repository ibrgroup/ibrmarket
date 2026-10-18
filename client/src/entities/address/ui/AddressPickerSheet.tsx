'use client';

import type { Address } from '@/entities/user';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Check, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';

export const ADDRESS_PICKER_SHEET_ID = 'address-picker-sheet';

export interface AddressPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: Address[];
  selectedId?: string;
  onSelect: (addressId: string) => void;
  onSelectNew: () => void;
  isAtLimit?: boolean;
  maxAddresses?: number;
  addAddressHref?: string;
}

type PickerBodyProps = {
  addresses: Address[];
  selectedId?: string;
  isAtLimit: boolean;
  maxAddresses: number;
  addAddressHref: string;
  onPick: (id: string) => void;
  onPickNew: () => void;
  onClose: () => void;
};

function AddressPickerBody({
  addresses,
  selectedId,
  isAtLimit,
  maxAddresses,
  addAddressHref,
  onPick,
  onPickNew,
  onClose,
}: PickerBodyProps) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <ul className="space-y-2">
          {addresses.map((address) => {
            const isSelected = selectedId === address._id;
            return (
              <li key={address._id}>
                <button
                  type="button"
                  onClick={() => onPick(address._id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <MapPin
                    className={cn(
                      'mt-0.5 h-5 w-5 shrink-0',
                      isSelected ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{address.address_line1}</span>
                      {address.selected ? (
                        <Badge variant="secondary" className="text-xs">
                          По умолчанию
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {address.city}
                      {address.pincode ? `, ${address.pincode}` : ''}
                      {address.mobile ? ` · ${address.mobile}` : ''}
                    </p>
                  </div>
                  {isSelected ? (
                    <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border px-4 pt-3 pb-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2 rounded-xl"
          disabled={isAtLimit}
          onClick={onPickNew}
        >
          <Plus className="h-4 w-4" />
          {isAtLimit ? `Лимит адресов (${maxAddresses})` : 'Новый адрес'}
        </Button>
        <Button type="button" variant="ghost" className="h-9 w-full rounded-xl" asChild>
          <Link href={addAddressHref} onClick={onClose}>
            Управление адресами в профиле
          </Link>
        </Button>
      </div>
    </>
  );
}

function AddressPickerHeader({
  onClose,
  variant = 'dialog',
}: {
  onClose: () => void;
  variant?: 'dialog' | 'sheet';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 pb-3',
        variant === 'sheet' ? 'pt-1' : 'pt-4',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1 text-left">
        <p className="text-lg font-semibold leading-tight">Адрес доставки</p>
        <p className="text-muted-foreground text-sm">
          Выберите сохранённый адрес или укажите новый
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="shrink-0 rounded-xl"
        onClick={onClose}
      >
        Готово
      </Button>
    </div>
  );
}

export function AddressPickerSheet({
  open,
  onOpenChange,
  addresses,
  selectedId,
  onSelect,
  onSelectNew,
  isAtLimit = false,
  maxAddresses = 10,
  addAddressHref = '/my-account?tab=addresses',
}: AddressPickerSheetProps) {
  const isMobile = useIsMobile();

  const pick = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const pickNew = () => {
    onSelectNew();
    onOpenChange(false);
  };

  const close = () => onOpenChange(false);

  const bodyProps: PickerBodyProps = {
    addresses,
    selectedId,
    isAtLimit,
    maxAddresses,
    addAddressHref,
    onPick: pick,
    onPickNew: pickNew,
    onClose: close,
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          id={ADDRESS_PICKER_SHEET_ID}
          side="bottom"
          showCloseButton={false}
          className={cn(
            'flex max-h-[min(88dvh,720px)] flex-col gap-0 overflow-hidden rounded-t-3xl border-t p-0',
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className="mx-auto mb-2 mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <SheetHeader className="sr-only">
            <SheetTitle>Адрес доставки</SheetTitle>
            <SheetDescription>Выберите сохранённый адрес или укажите новый</SheetDescription>
          </SheetHeader>
          <AddressPickerHeader onClose={close} variant="sheet" />
          <AddressPickerBody {...bodyProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id={ADDRESS_PICKER_SHEET_ID}
        showCloseButton={false}
        className="flex max-h-[min(85dvh,640px)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-2xl p-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Адрес доставки</DialogTitle>
          <DialogDescription>Выберите сохранённый адрес или укажите новый</DialogDescription>
        </DialogHeader>
        <AddressPickerHeader onClose={close} variant="dialog" />
        <AddressPickerBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
