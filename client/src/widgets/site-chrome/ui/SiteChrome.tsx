'use client';

import { AddressFormModal } from '@/features/address-form';
import { AuthModal } from '@/features/auth-modal';
import { cn } from '@/shared/lib/utils';
import { Toaster } from '@/shared/ui/sonner';
import { CatalogOverlayHost } from '@/widgets/catalog-overlay';
// import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';
import { MobileBottomNav } from '@/widgets/mobile-nav';
import { ProductQuickViewModal } from '@/widgets/product-quick-view-modal';
import { TopBar } from '@/widgets/top-bar';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { resolveSiteChromeConfig } from '../lib/chrome-config';
import { DesktopHeaderShell } from './DesktopHeaderShell';
import { ScrollToTop } from '@/features';

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const chrome = resolveSiteChromeConfig(pathname);
  const isDashboard = pathname.startsWith('/dashboard');
  const isStorefront = !isDashboard;
  const showTopBarOnMobile = chrome.topBar;
  const showTopBarOnDesktop = isStorefront && pathname !== '/login';

  return (
    <>
      {showTopBarOnDesktop && <TopBar className='hidden md:block' />}
      {isStorefront && (
        <div className="sticky top-0 z-50 hidden md:block">
          <div className="max-container mx-auto w-full">
            <DesktopHeaderShell>
              <Header mode={chrome.header} variant="embedded" />
            </DesktopHeaderShell>
          </div>
          <ScrollToTop />
        </div>
      )}

      {isStorefront && (
        <Header mode={chrome.header} variant="mobile-only" showTopBar={showTopBarOnMobile} />
      )}

      <main
        className={cn(
          'flex flex-col',
          isDashboard && 'bg-muted/40 min-h-[calc(100dvh-0px)] flex-1',
        )}
      >
        {children}

      </main>
      {/* {chrome.footer && <Footer />} */}
      {chrome.bottomNav && <MobileBottomNav />}
      {!isDashboard && <CatalogOverlayHost />}
      <Toaster />
      {chrome.quickView && <ProductQuickViewModal />}
      <AuthModal />
      <AddressFormModal />
    </>
  );
}
