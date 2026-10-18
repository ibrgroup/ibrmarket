'use client';

import { useAuthModal } from '@/features/auth-modal';
import { Popular } from '@/features/popular';
import { FilterState } from '@/features/product-filters';
import { LazyInfiniteProductList } from '@/features/product-list/LazyInfiniteProductList';
import MobileSlider from '@/features/product-slider/ui/MobileSlider';
import { HeroSection } from '@/widgets/hero-section';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

interface HomePageProps {
  dehydratedState?: ReturnType<typeof dehydrate>;
}

/**
 * Client Component для обработки auth query params
 * Должен быть обернут в Suspense для Next.js 16
 */
function AuthQueryHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();

  // Handle auth query param from proxy redirect
  useEffect(() => {
    const authParam = searchParams?.get('auth');
    const redirectParam = searchParams?.get('redirect');
    const forbiddenParam = searchParams?.get('forbidden');

    if (forbiddenParam === 'admin') {
      toast.error('Нужны права администратора для доступа к панели.');
      router.replace('/', { scroll: false });
      return;
    }

    if (authParam === 'required') {
      // Determine intent based on redirect path
      let intent:
        | { type: 'checkout' }
        | { type: 'profile' }
        | { type: 'orders' }
        | { type: 'custom'; url: string }
        | { type: 'none' } = { type: 'none' };
      if (redirectParam) {
        if (redirectParam.startsWith('/checkout')) {
          intent = { type: 'checkout' };
        } else if (redirectParam.startsWith('/my-account')) {
          intent = { type: 'profile' };
        } else if (
          redirectParam.startsWith('/my-orders') ||
          redirectParam.startsWith('/purchases')
        ) {
          intent = { type: 'orders' };
        } else if (redirectParam.startsWith('/dashboard')) {
          intent = { type: 'custom', url: '/dashboard' };
        }
      }

      if (intent.type !== 'none') {
        openAuthModal(intent);
      } else {
        openAuthModal();
      }

      // CRITICAL: Clean up query params to prevent refresh loops
      // Replace URL without query params (scroll: false to prevent scroll jump)
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router, openAuthModal]);

  return null; // This component doesn't render anything
}

export function HomePage({ dehydratedState }: HomePageProps) {
  // Начальные фильтры для бесконечного скролла (все продукты)
  const initialFilters: FilterState = {
    categories: [],
    brands: [],
    priceRange: [0, 200000],
    rating: 0,
    inStock: null,
    sortBy: 'createdAt', // Сортировка по дате создания
    sortOrder: 'desc', // По убыванию (новые сначала)
  };

  const content = (
    <>
      {/* CRITICAL: Wrap useSearchParams in Suspense for Next.js 16 */}
      <Suspense fallback={null}>
        <AuthQueryHandler />
      </Suspense>

      <div className="bg-white md:bg-[#ffffff00] rounded-b-3xl">
        <div className='md:block hidden'>
          <HeroSection />
        </div>
        <div className='md:hidden'>
          <MobileSlider />
        </div>
        <Popular />
        {/* <img className='max-container m-auto mt-5 h-10 object-cover rounded-2xl' src="https://web.whatsapp.com/d0e0dbf4-689f-4f95-9d88-7643534b7cf7" alt="" /> */}
      </div>

      {/* Бесконечный скролл всех продуктов - lazy loaded */}
      <section className="product-section">
        <div className="max-w-[1416px] md:bg-white m-auto mt-2 md:mt-5 md:p-2 rounded-3xl">
          <LazyInfiniteProductList filters={initialFilters} />
        </div>
      </section>

      {/* <ScrollToTop />  */}
    </>
  );

  // Если есть prefetched данные, оборачиваем в HydrationBoundary
  if (dehydratedState) {
    return <HydrationBoundary state={dehydratedState}>{content}</HydrationBoundary>;
  }

  return content;
}
