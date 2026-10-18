
'use client';

import { getActivePromo } from '@/shared/config/promo';
import { cn } from '@/shared/lib/utils';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { FaCreditCard } from "react-icons/fa6";
import { TbMessageFilled } from "react-icons/tb";
import { FaShoppingBag } from "react-icons/fa";
import { MdHomeWork } from "react-icons/md";
import { FaHandshakeSimple } from "react-icons/fa6";
import { TbTruckDelivery } from "react-icons/tb";
import { TbHelpHexagonFilled } from "react-icons/tb";
import { MdContacts } from "react-icons/md";

import Link from 'next/link';
import { DeliveryAddressSelector } from './DeliveryAddressSelector';
interface TopBarProps {
  className?: string;
}

/**
 * TopBar — полоса над header с геолокацией, промо и сервисными ссылками
 */
export function TopBar({ className }: TopBarProps) {
  const [isPromoVisible] = useState(true);

  const activePromo = getActivePromo();

  return (
    <div
      data-site-chrome-top
      data-site-chrome-measure
      className={cn('relative z-50 w-full', className)}
    >
      {/* bg-gradient-to-r from-indigo-700 to-blue-500 bg-background */}
      <div className="max-container px-4 py-1 mx-auto w-full bg-gradient-to-r from-indigo-700 to-blue-500 bg-background">
        <div className="flex min-h-9 items-center justify-between gap-2 text-sm ">
            {/* <CitySelector /> */}
          <DeliveryAddressSelector className='' size="desktop" />
          <nav
            className="flex min-w-0 lg:block hidden text-gray-100"
            aria-label="Сервисные ссылки"
          >
            <div className='flex items-center'>
              <a href="https://ibrgroup.ru" target='_blank' className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-2 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
               <FaCreditCard/>  Плати частями
              </a>

              <a href="https://dohkar.vercel.app/" target='_blank' className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-2 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
               <MdHomeWork/> Купи продай
              </a>

              <a target='_blank' href="https://ibrgroup.ru/become-partner" className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-2 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
               <FaHandshakeSimple/> Стать партнером 
              </a>
                   <Link href="/delivery" className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-2 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
                 <TbTruckDelivery/> Доставка
                </Link>

                <Link href="/help" className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-2 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
                <TbHelpHexagonFilled/>  Помощь
                </Link>

                <Link href="/contacts" className="text-white hover:bg-[#f2f2f23d] transition-all cursor-pointer rounded-2xl px-1 flex items-center gap-1 text-m dark:text-[#f2f2f2] font-semibold">
                 <MdContacts/> Контакты
                </Link>
                
            </div>
          </nav>
          {activePromo && isPromoVisible ? (
            <div className="hidden min-w-0 flex-1 justify-center md:flex">
              {activePromo.href ? (
                <Link
                  href={activePromo.href}
                  className="line-clamp-1 text-center text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {activePromo.text}
                </Link>
              ) : (
                <span className="line-clamp-1 text-center text-xs text-muted-foreground">
                  {activePromo.text}
                </span>
              )}
            </div>
          ) : (
            <div className="hidden flex-1 md:block" aria-hidden />
          )}

          <div className="flex shrink-0 items-center gap-0.5">

            <Button variant="ghost" size="icon" className="hover:bg-[#f2f2f200] rounded-full" asChild>
              <Link href="/messages" aria-label="Сообщения">
                <TbMessageFilled className="h-[25px] dark:text-[#f2f2f2] w-[25px] text-white" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-[#f2f2f200] rounded-full" asChild>
              <Link href="/products" className='text-white' aria-label="Каталог товаров">
                <FaShoppingBag className="h-[22px] dark:text-[#f2f2f2] text-white w-[23px]" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

