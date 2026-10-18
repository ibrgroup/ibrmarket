'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { getToken, isTokenExpired } from './auth';

/**
 * HOC для защиты компонентов (клиент-сайд)
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAuth, setIsAuth] = React.useState(false);

    React.useEffect(() => {
      const checkAuth = () => {
        const token = getToken();
        const authenticated = token ? !isTokenExpired(token) : false;
        setIsAuth(authenticated);
        setIsLoading(false);

        if (!authenticated) {
          const redirect =
            typeof window !== 'undefined' && window.location.pathname !== '/'
              ? `&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
              : '';
          router.replace(`/?auth=required${redirect}`);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return React.createElement(
        'div',
        {
          className: 'flex items-center justify-center p-8',
        },
        React.createElement('div', {
          className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary',
        }),
      );
    }

    if (!isAuth) {
      return null;
    }

    return React.createElement(Component, props);
  };
};
