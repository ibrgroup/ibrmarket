'use client';

import type { Address } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, MapPin, Plus } from 'lucide-react';
import { ADDRESS_PICKER_SHEET_ID } from './AddressPickerSheet';

export interface AddressPickerSummaryProps {
  addresses: Address[];
  selectedId?: string;
  isNewAddress?: boolean;
  pickerOpen?: boolean;
  onOpenPicker: () => void;
  className?: string;
}

export function AddressPickerSummary({
  addresses,
  selectedId,
  isNewAddress,
  pickerOpen = false,
  onOpenPicker,
  className,
}: AddressPickerSummaryProps) {
  const selected = !isNewAddress && selectedId ? addresses.find((a) => a._id === selectedId) : null;

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      aria-expanded={pickerOpen}
      aria-haspopup="dialog"
      aria-controls={ADDRESS_PICKER_SHEET_ID}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-3.5 text-left transition-colors',
        'hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {selected ? (
          <MapPin className="h-5 w-5 text-primary" />
        ) : (
          <Plus className="h-5 w-5 text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {selected ? (
          <>
            <p className="truncate font-medium text-foreground">{selected.address_line1}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {selected.city}
              {selected.pincode ? `, ${selected.pincode}` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">Новый адрес</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Нажмите, чтобы выбрать или добавить
            </p>
          </>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
