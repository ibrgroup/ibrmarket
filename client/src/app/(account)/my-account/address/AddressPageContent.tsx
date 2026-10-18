'use client';

import { useAddressFormModal } from '@/features/address-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Deep-link совместимость: /my-account/address и ?edit=id
 * открывают модалку и возвращают в список адресов.
 */
export function AddressPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { openCreateAddress, openEditAddress } = useAddressFormModal();

  useEffect(() => {
    if (editId) {
      openEditAddress(editId);
    } else {
      openCreateAddress();
    }
    router.replace('/my-account?tab=addresses');
  }, [editId, openCreateAddress, openEditAddress, router]);

  return (
    <div className="max-container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
      Открываем форму адреса…
    </div>
  );
}
