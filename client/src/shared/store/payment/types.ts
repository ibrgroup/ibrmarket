/**
 * Типы для Payment Store
 */

import type {
  PaymentMethod,
  Transaction,
  PaymentSecuritySettings,
  AddPaymentMethodRequest,
} from '@/shared/api/services/payment-service';

/**
 * Состояние Payment Store
 */
export interface PaymentState {
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  securitySettings: PaymentSecuritySettings;
  isLoading: boolean;
  error: string | null;
}

/**
 * Действия Payment Store, сгруппированные по категориям
 */
export interface PaymentActions {
  paymentMethods: {
    fetch: () => Promise<void>;
    add: (data: AddPaymentMethodRequest) => Promise<void>;
    delete: (id: string) => Promise<void>;
    setDefault: (id: string) => Promise<void>;
  };
  transactions: {
    fetch: () => Promise<void>;
  };
  security: {
    fetch: () => Promise<void>;
    update: (settings: Partial<PaymentSecuritySettings>) => Promise<void>;
  };
  error: {
    clear: () => void;
  };
}

/**
 * Полный тип Payment Store с объектом actions
 */
export interface PaymentStore extends PaymentState {
  actions: PaymentActions;
}

/**
 * Реэкспорт типов из payment-service для удобства
 */
export type {
  PaymentMethod,
  Transaction,
  PaymentSecuritySettings,
  AddPaymentMethodRequest,
};
