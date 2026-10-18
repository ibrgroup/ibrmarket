'use client';

import { useUserStore } from '@/features/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

function LoginRedirect() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams?.get('redirect') || '/';

    if (isAuthenticated) {
      router.replace(redirect);
      return;
    }

    const params = new URLSearchParams({ auth: 'required' });
    if (redirect !== '/') {
      params.set('redirect', redirect);
    }
    router.replace(`/?${params.toString()}`);
  }, [isAuthenticated, router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <p className="text-muted-foreground animate-pulse font-roboto text-sm">Открываем вход…</p>
    </div>
  );
}

export function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="text-muted-foreground animate-pulse text-sm">Загрузка…</span>
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}
