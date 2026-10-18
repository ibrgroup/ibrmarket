'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import Link from 'next/link';
import { FaShoppingBag } from 'react-icons/fa';
import { TbMessageFilled } from 'react-icons/tb';
import { DeliveryAddressSelector } from './DeliveryAddressSelector';
import { ScrollToTop } from '@/features';

/** Компактная строка TopBar внутри mobile header (адрес + иконки, без сервисных ссылок). */
export function TopBarMobileStrip({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-3 pb-1 pt-0', className)}>
      <DeliveryAddressSelector size="mobile" className="min-w-0 flex-1" />

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
          asChild
        >
          <Link href="/messages" aria-label="Сообщения">
            <TbMessageFilled className="size-[22px]" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full text-white hover:bg-white/15 hover:text-white"
          asChild
        >
          <Link href="/products" aria-label="Каталог товаров">
            <FaShoppingBag className="size-[21px]" />
          </Link>
        </Button>
      </div>
      <ScrollToTop/>
    </div>
  );
}
