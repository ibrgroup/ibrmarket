'use client';

import { useCallback } from 'react';

import { useAddressFormModalStore } from '../../model/address-form-modal.store';
import type { OpenAddressFormOptions } from '../../model/types';

export function useAddressFormModal() {
  const isOpen = useAddressFormModalStore((s) => s.isOpen);
  const openCreate = useAddressFormModalStore((s) => s.openCreate);
  const openEdit = useAddressFormModalStore((s) => s.openEdit);
  const close = useAddressFormModalStore((s) => s.close);

  const openCreateAddress = useCallback(
    (options?: OpenAddressFormOptions) => {
      openCreate(options);
    },
    [openCreate],
  );

  const openEditAddress = useCallback(
    (editId: string, options?: OpenAddressFormOptions) => {
      openEdit(editId, options);
    },
    [openEdit],
  );

  const closeAddressForm = useCallback(() => {
    close();
  }, [close]);

  return {
    isAddressFormOpen: isOpen,
    openCreateAddress,
    openEditAddress,
    closeAddressForm,
  };
}
