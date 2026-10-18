import type { PaymentStore } from './types';

/**
 * Селекторы для Payment Store
 * Используйте эти селекторы для оптимизации производительности
 */
export const paymentSelectors = {
  // Payment Methods
  paymentMethods: (state: PaymentStore) => state.paymentMethods,
  defaultPaymentMethod: (state: PaymentStore) =>
    state.paymentMethods.find(method => method.isDefault) || null,

  // Transactions
  transactions: (state: PaymentStore) => state.transactions,

  // Security Settings
  securitySettings: (state: PaymentStore) => state.securitySettings,

  // Loading & Error
  isLoading: (state: PaymentStore) => state.isLoading,
  error: (state: PaymentStore) => state.error,

  // Actions
  actions: (state: PaymentStore) => state.actions,
  paymentMethodsActions: (state: PaymentStore) => state.actions.paymentMethods,
  transactionsActions: (state: PaymentStore) => state.actions.transactions,
  securityActions: (state: PaymentStore) => state.actions.security,
  errorActions: (state: PaymentStore) => state.actions.error,

  // Combined selectors
  paymentMethodsWithActions: (state: PaymentStore) => ({
    methods: state.paymentMethods,
    defaultMethod: state.paymentMethods.find(method => method.isDefault) || null,
    actions: state.actions.paymentMethods,
  }),
  transactionsWithActions: (state: PaymentStore) => ({
    transactions: state.transactions,
    actions: state.actions.transactions,
  }),
  securityWithActions: (state: PaymentStore) => ({
    settings: state.securitySettings,
    actions: state.actions.security,
  }),
  status: (state: PaymentStore) => ({
    isLoading: state.isLoading,
    error: state.error,
    clearError: state.actions.error.clear,
  }),
};
