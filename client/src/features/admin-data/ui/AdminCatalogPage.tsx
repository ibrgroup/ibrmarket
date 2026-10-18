'use client';

import { useAuth } from '@/features/auth';
import { ADMIN_PERM, canAccessAdminPermission } from '@/shared/lib/admin-permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { AdminPageHeader } from '@/widgets/dashboard-admin/ui/AdminPageHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { AdminBannersSection } from './AdminBannersSection';
import { AdminCategoriesSection } from './AdminCategoriesSection';
import { AdminProductsSection } from './AdminProductsSection';

type CatalogTab = 'products' | 'categories' | 'banners';

function isCatalogTab(v: string | null): v is CatalogTab {
  return v === 'products' || v === 'categories' || v === 'banners';
}

export function AdminCatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const canManageBanners = canAccessAdminPermission(user?.role, ADMIN_PERM.CONTENT);
  const tab: CatalogTab =
    isCatalogTab(tabParam) && (tabParam !== 'banners' || canManageBanners) ? tabParam : 'products';

  useEffect(() => {
    if (tabParam === 'banners' && !canManageBanners) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'products');
      router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
    }
  }, [tabParam, canManageBanners, router, searchParams]);

  const setTab = (value: string) => {
    const next =
      isCatalogTab(value) && (value !== 'banners' || canManageBanners) ? value : 'products';
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/dashboard/catalog?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Каталог"
        description="Товары, категории и промо-баннеры. Вкладка сохраняется в адресе."
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList
          className={`grid w-full cursor-pointer bg-gray-200 max-w-lg ${canManageBanners ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          <TabsTrigger className="cursor-pointer" value="products">
            Товары
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="categories">
            Категории
          </TabsTrigger>
          {canManageBanners ? (
            <TabsTrigger className="cursor-pointer" value="banners">
              Баннеры
            </TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <AdminProductsSection />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <AdminCategoriesSection />
        </TabsContent>
        <TabsContent value="banners" className="mt-6">
          {canManageBanners ? <AdminBannersSection /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
