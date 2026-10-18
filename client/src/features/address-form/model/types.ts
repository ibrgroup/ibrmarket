import type { Address } from '@/entities/user';

export type AddressFormSuccessHandler = (address: Address) => void;

export type OpenAddressFormOptions = {
  /** После создания сразу сделать адрес по умолчанию (хедер доставки) */
  preferDefault?: boolean;
  onSuccess?: AddressFormSuccessHandler;
};

export type AddressFormModalStore = {
  isOpen: boolean;
  editId: string | null;
  preferDefault: boolean;
  onSuccess: AddressFormSuccessHandler | null;
  /** Инкремент при каждом open — форма сбрасывается под новую сессию */
  openEpoch: number;

  openCreate: (options?: OpenAddressFormOptions) => void;
  openEdit: (editId: string, options?: OpenAddressFormOptions) => void;
  close: () => void;
  clearCallbacks: () => void;
};
