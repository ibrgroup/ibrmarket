import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { AddressFormModalStore, OpenAddressFormOptions } from './types';

const initialState = {
  isOpen: false,
  editId: null as string | null,
  preferDefault: false,
  onSuccess: null as AddressFormModalStore['onSuccess'],
  openEpoch: 0,
};

export const useAddressFormModalStore = create<AddressFormModalStore>()(
  devtools(
    (set) => ({
      ...initialState,

      openCreate: (options?: OpenAddressFormOptions) =>
        set((state) => ({
          isOpen: true,
          editId: null,
          preferDefault: options?.preferDefault ?? false,
          onSuccess: options?.onSuccess ?? null,
          openEpoch: state.openEpoch + 1,
        })),

      openEdit: (editId: string, options?: OpenAddressFormOptions) =>
        set((state) => ({
          isOpen: true,
          editId,
          preferDefault: false,
          onSuccess: options?.onSuccess ?? null,
          openEpoch: state.openEpoch + 1,
        })),

      close: () =>
        set({
          isOpen: false,
        }),

      clearCallbacks: () =>
        set({
          onSuccess: null,
          preferDefault: false,
        }),
    }),
    { name: 'AddressFormModalStore' },
  ),
);
