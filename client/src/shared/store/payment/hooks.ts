import { useShallow } from 'zustand/react/shallow';

import { usePaymentStore } from './paymentStore';
import { paymentSelectors } from './selectors';

/**
 * Хуки для работы с Payment Store
 * Предоставляют удобные способы доступа к состоянию и действиям
 */

/**
 * Хук для работы со способами оплаты
 * Использует useShallow для предотвращения бесконечных ре-рендеров
 */
export const usePaymentMethods = () => {
  return usePaymentStore(
    useShallow(paymentSelectors.paymentMethodsWithActions)
  );
};

/**
 * Хук для работы с транзакциями
 * Использует useShallow для предотвращения бесконечных ре-рендеров
 */
export const useTransactions = () => {
  return usePaymentStore(
    useShallow(paymentSelectors.transactionsWithActions)
  );
};

/**
 * Хук для работы с настройками безопасности
 * Использует useShallow для предотвращения бесконечных ре-рендеров
 */
export const usePaymentSecurity = () => {
  return usePaymentStore(
    useShallow(paymentSelectors.securityWithActions)
  );
};

/**
 * Хук для получения состояния загрузки и ошибок
 * Использует useShallow для предотвращения бесконечных ре-рендеров
 */
export const usePaymentStatus = () => {
  return usePaymentStore(
    useShallow(paymentSelectors.status)
  );
};

/**
 * Хук для получения всех действий платежей
 * Использует useShallow для предотвращения бесконечных ре-рендеров
 */
export const usePaymentActions = () => {
  return usePaymentStore(
    useShallow(paymentSelectors.actions)
  );
};

/**
 * Хук для получения всего состояния платежей (оптимизирован с useShallow)
 */
export const usePaymentState = () => {
  return usePaymentStore(
    useShallow(state => ({
      paymentMethods: state.paymentMethods,
      transactions: state.transactions,
      securitySettings: state.securitySettings,
      isLoading: state.isLoading,
      error: state.error,
      actions: state.actions,
    }))
  );
};
