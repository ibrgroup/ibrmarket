'use client';

import { useParams } from 'next/navigation';
import { ProductBreadcrumbs } from '@/widgets/product-breadcrumbs';

interface ProductLayoutProps {
  children: React.ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  const params = useParams();
  const productId = params?.id as string;

  if (!params || !params.id) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="">
          <p className="text-red-500">Некорректный идентификатор товара</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <ProductBreadcrumbs productId={productId} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
