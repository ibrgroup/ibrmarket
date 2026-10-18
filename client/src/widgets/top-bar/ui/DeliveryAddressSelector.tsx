'use client';

import { AddressPickerSheet, useAddresses } from '@/entities/address';
import { useAddressFormModal } from '@/features/address-form';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth-modal';
import { addressService } from '@/shared/api/services/address-service';
import { cn } from '@/shared/lib/utils';
import { useLocationStore } from '@/shared/store/location';
import { useQueryClient } from '@tanstack/react-query';
import { FaChevronDown } from "react-icons/fa";
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { GuestDeliverySheet } from './GuestDeliverySheet';

type DeliveryAddressSelectorProps = {
  className?: string;
  /** desktop — флаг + крупнее; mobile — MapPin-стиль компактнее */
  size?: 'desktop' | 'mobile';
};

function RussiaFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <rect
        width="19"
        height="13"
        x="2.5"
        y="5.5"
        stroke="#001A34"
        strokeOpacity=".16"
        opacity=".75"
        rx="2.5"
      />
      <path fill="white" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3z" />
      <path fill="#0055CC" d="M3 10h18v4H3z" />
      <path fill="#F0121F" d="M3 14h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function DeliveryAddressSelector({
  className,
  size = 'desktop',
}: DeliveryAddressSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isInitialized } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { openCreateAddress } = useAddressFormModal();
  const city = useLocationStore((s) => s.city);
  const setCity = useLocationStore((s) => s.setCity);

  const canLoadAddresses = Boolean(isAuthenticated && user?._id && isInitialized);
  const { addresses, isAtLimit, maxAddresses, isLoading } = useAddresses(canLoadAddresses);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.selected) ?? addresses[0] ?? null,
    [addresses],
  );

  /** Всегда есть осмысленный текст: город по умолчанию (Москва) или сохранённый адрес */
  const label = useMemo(() => {
    if (!canLoadAddresses) return city || 'Магас';
    if (isLoading && !selectedAddress) return city || 'Магас';
    if (selectedAddress?.address_line1) return selectedAddress.address_line1;
    return city || 'Магас';
  }, [canLoadAddresses, isLoading, selectedAddress, city]);

  const ariaLabel = canLoadAddresses
    ? selectedAddress
      ? 'Выбрать адрес доставки'
      : 'Выбрать город или добавить адрес доставки'
    : 'Выбрать город доставки или войти, чтобы указать адрес';

  const handleTriggerClick = () => {
    if (!isInitialized) {
      // Сессия ещё поднимается — всё равно показываем гостевой выбор города
      setGuestOpen(true);
      return;
    }
    if (!isAuthenticated || !user) {
      setGuestOpen(true);
      return;
    }
    setPickerOpen(true);
  };

  const handleSelect = async (addressId: string) => {
    try {
      await addressService.setDefaultAddress(addressId);
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Адрес доставки обновлён');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось выбрать адрес');
    }
  };

  const handleSelectNew = () => {
    openCreateAddress({ preferDefault: true });
  };

  const handleGuestCitySelect = (cityName: string) => {
    setCity(cityName);
    toast.success(`Город доставки: ${cityName}`);
  };

  const handleGuestSignIn = () => {
    openAuthModal({ type: 'delivery' });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          'flex min-w-0 items-center gap-1.5 rounded-xl text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          size === 'desktop'
            ? 'h-8 max-w-full px-2 text-white hover:bg-white/15'
            : 'h-8 text-white/95 hover:text-white',
          className,
        )}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen || guestOpen}
      ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" className="uw_a1o"><rect width="19" height="13" x="2.5" y="5.5" stroke="#001A34" strokeOpacity=".16" opacity=".75" rx="2.5"></rect><path fill="white" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3z"></path><path fill="#0055CC" d="M3 10h18v4H3z"></path><path fill="#F0121F" d="M3 14h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
        <span
          className={cn(
            'text-white transition-all line-clamp-2  cursor-pointer rounded-2xl flex items-center gap-1 text-base dark:text-[#f2f2f2] font-roboto',
            size === 'desktop'
          )}
        >
          {label}
        </span>
        <FaChevronDown size={16} className='mt-1 text-white dark:text-[#f2f2f2]' />
      </button>

      <GuestDeliverySheet
        open={guestOpen}
        onOpenChange={setGuestOpen}
        city={city || 'Магас'}
        onSelectCity={handleGuestCitySelect}
        onSignIn={handleGuestSignIn}
      />

      {canLoadAddresses ? (
        <AddressPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          addresses={addresses}
          selectedId={selectedAddress?._id}
          onSelect={(id) => void handleSelect(id)}
          onSelectNew={handleSelectNew}
          isAtLimit={isAtLimit}
          maxAddresses={maxAddresses}
          addAddressHref="/my-account?tab=addresses"
        />
      ) : null}
    </>
  );
}
