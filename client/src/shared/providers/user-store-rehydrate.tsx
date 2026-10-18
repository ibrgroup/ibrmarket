'use client';

import { useUserStore } from '@/entities/user';
import { useLayoutEffect } from 'react';

/**
 * Next.js: persist с localStorage на сервере недоступен; без skipHydration + явного
 * rehydrate() колбэк onRehydrateStorage (и запрос профиля по cookie) может не выполняться.
 */
export function UserStoreRehydrate() {
  useLayoutEffect(() => {
    const p = useUserStore.persist;
    if (p?.rehydrate) {
      void p.rehydrate();
    }
  }, []);
  return null;
}
