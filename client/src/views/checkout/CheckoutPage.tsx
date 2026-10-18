'use client';

import { AddressPickerSheet, AddressPickerSummary, useAddresses } from '@/entities/address';
import { useCartStore } from '@/entities/cart';
import { CHECKOUT_ONLY_LINE_IDS_SESSION_KEY } from '@/entities/cart/lib/checkout-session-storage';
import { useCreateOrder } from '@/entities/order';
import { getProductColorVisual, getProductSizeLabel } from '@/entities/product';
import { useUserStore } from '@/entities/user';
import { useAddressFormModal } from '@/features/address-form';
import { addressService } from '@/shared/api/services';
import {
  formatPhoneForDisplay,
  isValidRussianPhone,
  normalizePhone,
} from '@/shared/lib/contact-utils';
import { mergeAddressLine, type DadataStructuredAddress } from '@/shared/lib/dadata-address';
import { logger } from '@/shared/lib/logger';
import { cn } from '@/shared/lib/utils';
import { AddressInput } from '@/shared/ui/address-input';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { PhoneInput } from '@/shared/ui/phone-input';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  Mail,
  MapPin,
  Shield,
  ShoppingBag,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useLayoutEffect as useBrowserLayoutEffect,
  useCallback,
  useEffect,
  useEffect as useIsoLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

/**
 * Константы для checkout
 */
const DELIVERY_FREE_THRESHOLD = 2000; // Бесплатная доставка от 2000₽
const DELIVERY_COST = 300; // Стоимость доставки

const optionalEmailField = z
  .string()
  .trim()
  .max(100, 'Email должен содержать не более 100 символов')
  .refine(
    (val) => val.length === 0 || z.email().safeParse(val).success,
    'Введите корректный email',
  );

const optionalPhoneField = z
  .string()
  .refine(
    (val) => !val || val.trim().length === 0 || isValidRussianPhone(val),
    'Введите корректный российский номер телефона',
  );

const optionalPersonNameField = (label: string) =>
  z
    .string()
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length >= 2,
      `${label} должно содержать минимум 2 символа`,
    );

const checkoutSchema = z.object({
  email: optionalEmailField,
  phone: optionalPhoneField,
  firstName: optionalPersonNameField('Имя'),
  lastName: optionalPersonNameField('Фамилия'),
  selectedAddressId: z.string().optional(), // ID выбранного существующего адреса
  address: z
    .string()
    .min(1, 'Адрес обязателен')
    .min(5, 'Адрес должен содержать минимум 5 символов'),
  /** Добавляется к строке адреса: квартира, подъезд */
  addressExtra: z.string().optional(),
  /** Заполняются при выборе подсказки DaData (новый адрес) или из сохранённого адреса */
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  /** Онлайн (ЮKassa) или при получении */
  checkoutPayment: z.enum(['online', 'on_delivery'], {
    message: 'Выберите способ оплаты',
  }),
  saveAddress: z.boolean().optional(), // Сохранить адрес для будущих заказов
  deliveryMethod: z.enum(['courier', 'pickup'], { message: 'Выберите способ доставки' }),
  // agreeToTerms: z.boolean().refine((val) => val === true, 'Необходимо согласиться с условиями'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

/**
 * Checkout: только создание заказа и редирект на страницу заказа.
 * Оплата — на странице заказа (кнопка «Оплатить через YooKassa»).
 */

/** Классы карточек в зависимости от темы */
const getCardGradient = (isDark: boolean) =>
  isDark
    ? 'bg-gradient-to-r from-gray-800/50 to-transparent border-gray-800'
    : 'bg-gradient-to-r from-gray-50/50 to-transparent border-gray-100';

const getOrderCardHeaderGradient = (isDark: boolean) =>
  isDark ? 'bg-primary/10 border-border/60' : 'bg-primary/5 border-border/60';

/** Шапка карточек checkout: flex вместо grid у CardHeader, ровные отступы */
const CHECKOUT_CARD_SHELL = 'mb-0 gap-0 overflow-hidden py-0';
const CHECKOUT_CARD_HEADER =
  '!flex min-h-[3.25rem] w-full items-center border-b px-4 py-3 sm:min-h-[3.5rem] sm:px-5 sm:py-3.5 [.border-b]:!pb-3 sm:[.border-b]:!pb-3.5';

function CheckoutPageSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={cn(
        'min-h-screen pb-10 sm:pb-12',
        isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
      )}
    >
      <div className="max-container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start lg:gap-5">
          <div className="space-y-3 lg:col-span-2">
            <Card className="border-0 py-4">
              <CardHeader className="px-4 pb-3">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3 px-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
          <Card className="py-4">
            <CardHeader className="px-4 pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { theme, systemTheme } = useTheme();
  // Use layout effect to avoid hydration issues (for SSR), but fallback to useEffect
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useBrowserLayoutEffect : useIsoLayoutEffect;
  const [isDark, setIsDark] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (theme === 'system') {
      setIsDark(
        typeof window !== 'undefined'
          ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          : false,
      );
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemTheme]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    items,
    selectedItems,
    selectedTotalPrice,
    selectedTotalItems,
    totalPrice,
    totalItems,
    syncWithServer,
    isLoading: isCartLoading,
    isSyncing: isCartSyncing,
  } = useCartStore();

  const { mutateAsync: createOrderMutation, isPending: isCreatingOrder } = useCreateOrder();

  // Получаем данные пользователя для автозаполнения
  const { user, isInitialized: isAuthInitialized } = useUserStore();

  // Загружаем адреса пользователя
  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    maxAddresses = 10,
    isAtLimit,
  } = useAddresses(true);

  // Определяем какие товары используем для оформления заказа
  // Используем useMemo для оптимизации пересчетов
  const checkoutItems = useMemo(
    () => (selectedItems.length > 0 ? selectedItems : items),
    [selectedItems, items],
  );
  const checkoutTotalPrice = useMemo(
    () => (selectedItems.length > 0 ? selectedTotalPrice : totalPrice),
    [selectedItems.length, selectedTotalPrice, totalPrice],
  );
  const checkoutTotalItems = useMemo(
    () => (selectedItems.length > 0 ? selectedTotalItems : totalItems),
    [selectedItems.length, selectedTotalItems, totalItems],
  );

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      address: '',
      addressExtra: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
      checkoutPayment: 'online',
      deliveryMethod: 'courier',
    },
  });

  const {
    control,
    watch,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    getValues,
  } = form;
  const isSubmitDisabled = isSubmitting || isCreatingOrder;
  const deliveryMethod = watch('deliveryMethod');
  const checkoutPayment = watch('checkoutPayment');
  /** Простой показ блока без Radix Collapsible — у того анимация height + overflow:hidden даёт рывки скролла страницы */
  const [additionalOpen, setAdditionalOpen] = useState(true);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const { openCreateAddress } = useAddressFormModal();

  // Автозаполнение контактных данных из профиля пользователя
  useEffect(() => {
    if (!user) return;

    const { email, phone, firstName, lastName } = getValues();
    if (user.email && !email) {
      setValue('email', user.email);
    }
    if (user.phone && !phone) {
      setValue('phone', formatPhoneForDisplay(user.phone));
    }
    if (user.name) {
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length > 0 && !firstName) {
        setValue('firstName', nameParts[0]);
      }
      if (nameParts.length > 1 && !lastName) {
        setValue('lastName', nameParts.slice(1).join(' '));
      } else if (nameParts.length === 1 && !lastName) {
        // Одно слово в профиле — дублируем, иначе zod (min 2 для фамилии) блокирует заказ
        setValue('lastName', nameParts[0]);
      }
    }
  }, [user, setValue, getValues]);

  const cartBusy = isCartLoading || isCartSyncing;

  // «Купить сейчас»: после sync с сервером без isSelected все строки помечаются выбранными — подсвечиваем только нужные (ключ снимаем при успешном заказе или при уходе со страницы).
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthInitialized || cartBusy) return;
    const raw = sessionStorage.getItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY);
    if (!raw) return;
    try {
      const ids = JSON.parse(raw) as unknown;
      if (!Array.isArray(ids) || ids.length === 0) return;
      useCartStore.getState().selectOnlyTheseItems(ids.map(String));
    } catch {
      // ignore
    }
  }, [isAuthInitialized, cartBusy]);

  // Обработчик выбора существующего адреса (или только что созданного)
  const applyAddressToForm = useCallback(
    (selectedAddress: {
      _id: string;
      address_line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
      mobile?: number | string | null;
    }) => {
      setValue('selectedAddressId', selectedAddress._id);
      setValue('address', selectedAddress.address_line1 || '');
      setValue('city', selectedAddress.city || '');
      setValue('state', selectedAddress.state || '');
      setValue('zipCode', selectedAddress.pincode || '');
      setValue('addressExtra', '');
      if (selectedAddress.mobile) {
        setValue('phone', formatPhoneForDisplay(String(selectedAddress.mobile)));
      }
    },
    [setValue],
  );

  const handleAddressSelect = useCallback(
    (addressId: string) => {
      const selectedAddress = addresses.find((addr) => addr._id === addressId);
      if (selectedAddress) applyAddressToForm(selectedAddress);
    },
    [addresses, applyAddressToForm],
  );

  // «Новый адрес» — модалка (как в профиле / хедере), без ухода со страницы
  const handleNewAddress = useCallback(() => {
    openCreateAddress({
      onSuccess: (address) => {
        applyAddressToForm(address);
      },
    });
  }, [openCreateAddress, applyAddressToForm]);

  const defaultAddressAppliedRef = useRef(false);
  const createAddressIdempotencyKeyRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `checkout-addr-${Date.now()}`,
  );

  // Автовыбор адреса по умолчанию (или первого сохранённого)
  useEffect(() => {
    if (isLoadingAddresses || defaultAddressAppliedRef.current) return;

    const currentId = getValues('selectedAddressId');
    if (currentId && currentId !== '') {
      defaultAddressAppliedRef.current = true;
      return;
    }

    if (addresses.length === 0) {
      setValue('selectedAddressId', 'new');
      defaultAddressAppliedRef.current = true;
      return;
    }

    const defaultAddr = addresses.find((a) => a.selected) ?? addresses[0];
    if (defaultAddr) {
      handleAddressSelect(defaultAddr._id);
      defaultAddressAppliedRef.current = true;
    }
  }, [isLoadingAddresses, addresses, getValues, setValue, handleAddressSelect]);

  const applyCheckoutParsedAddress = useCallback(
    (parsed: DadataStructuredAddress | null) => {
      if (!parsed) {
        setValue('city', '');
        setValue('state', '');
        setValue('zipCode', '');
        return;
      }
      setValue('city', parsed.city);
      setValue('state', parsed.state);
      setValue('zipCode', parsed.pincode);
    },
    [setValue],
  );

  // Отслеживаем выбранный адрес для блокировки полей
  const selectedAddressId = watch('selectedAddressId');

  // Определяем, заблокированы ли поля адреса (когда выбран существующий адрес)
  const isAddressFieldsDisabled = useMemo(() => {
    return !!selectedAddressId && selectedAddressId !== 'new' && selectedAddressId !== '';
  }, [selectedAddressId]);

  // Редирект только после инициализации сессии и синхронизации корзины (избегаем ложного срабатывания)
  useEffect(() => {
    if (!isAuthInitialized || cartBusy) return;
    if (checkoutItems.length === 0) {
      toast.error('Корзина пуста или не выбраны товары для оформления');
      router.push('/cart');
    }
  }, [isAuthInitialized, cartBusy, checkoutItems.length, router]);

  // Вычисляем стоимость доставки и итоговую сумму
  const deliveryCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    return checkoutTotalPrice >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_COST;
  }, [deliveryMethod, checkoutTotalPrice]);

  const totalWithDelivery = useMemo(
    () => checkoutTotalPrice + deliveryCost,
    [checkoutTotalPrice, deliveryCost],
  );

  /**
   * Обработчик отправки: только POST /api/order/create и редирект на страницу заказа.
   * Оплата — на странице заказа (кнопка «Оплатить через YooKassa»).
   */
  const onSubmit = useCallback(
    async (data: CheckoutFormData) => {
      try {
        await syncWithServer();
        const buyNowRaw =
          typeof window !== 'undefined'
            ? sessionStorage.getItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY)
            : null;
        if (buyNowRaw) {
          try {
            const ids = JSON.parse(buyNowRaw) as unknown;
            if (Array.isArray(ids) && ids.length > 0) {
              useCartStore.getState().selectOnlyTheseItems(ids.map(String));
            }
          } catch {
            // ignore
          }
        }
        let deliveryAddressId: string;

        if (data.selectedAddressId && data.selectedAddressId !== 'new') {
          deliveryAddressId = data.selectedAddressId;
        } else {
          const user = useUserStore.getState().user;
          const userId = user?._id;
          if (!userId) {
            toast.error('Необходимо войти в аккаунт');
            return;
          }
          if (addresses.length >= maxAddresses) {
            toast.error(
              `Достигнут лимит адресов (${maxAddresses}). Удалите ненужный в «Мои адреса» или выберите сохранённый адрес.`,
            );
            return;
          }
          const zip = data.zipCode?.trim() ?? '';
          const city = data.city?.trim() ?? '';
          if (!city || !zip || !/^\d{5,6}$/.test(zip)) {
            toast.error(
              'Выберите адрес из списка подсказок — так подставятся город и почтовый индекс.',
            );
            return;
          }
          const line1 = mergeAddressLine(data.address.trim(), data.addressExtra?.trim());
          const normalizedPhone = normalizePhone(data.phone) || normalizePhone(user?.phone || '');
          if (!normalizedPhone) {
            setAdditionalOpen(true);
            toast.error(
              'Для нового адреса укажите телефон в «Дополнительно» или добавьте его в профиль',
            );
            return;
          }
          const { address: newAddress } = await addressService.addAddress(
            {
              address_line1: line1,
              city,
              state: data.state?.trim() || city || 'Не указан',
              pincode: zip,
              country: 'Россия',
              mobile: normalizedPhone,
              name: user.name?.trim() || undefined,
              locality: city,
              addressType: 'HOME',
            },
            { idempotencyKey: createAddressIdempotencyKeyRef.current },
          );
          createAddressIdempotencyKeyRef.current =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `checkout-addr-${Date.now()}`;
          deliveryAddressId = newAddress._id;
          await queryClient.invalidateQueries({ queryKey: ['addresses'] });
        }

        const payment_type = data.checkoutPayment === 'on_delivery' ? 'ON_DELIVERY' : 'YOOKASSA';
        const { selectedItems: selAfter, items: allAfter } = useCartStore.getState();
        const linesForOrder = selAfter.length > 0 ? selAfter : allAfter;
        const cartItemIds = linesForOrder
          .map((i) => i._id)
          .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
        if (cartItemIds.length !== linesForOrder.length) {
          toast.error('Обновите корзину и попробуйте снова', {
            description: 'Не все позиции синхронизированы с сервером.',
          });
          await syncWithServer();
          return;
        }
        const order = await createOrderMutation({
          delivery_address: deliveryAddressId,
          payment_type,
          delivery_method: data.deliveryMethod,
          cartItemIds,
        });
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(CHECKOUT_ONLY_LINE_IDS_SESSION_KEY);
        }
        await syncWithServer();
        toast.success('Заказ создан', {
          description:
            payment_type === 'ON_DELIVERY'
              ? 'Оплата при получении'
              : 'Перенаправляем на страницу оплаты...',
        });
        router.push(`/checkout/order/${order._id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось создать заказ';
        toast.error('Ошибка', { description: message });
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        syncWithServer().catch(() => {});
        logger.error('Create order error', {
          error: error instanceof Error ? error.message : error,
        });
      }
    },
    [createOrderMutation, syncWithServer, router, queryClient, addresses.length, maxAddresses],
  );

  const onInvalid = useCallback((errors: FieldErrors<CheckoutFormData>) => {
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(String(firstError.message));
    }
  }, []);

  if (!isAuthInitialized || (cartBusy && items.length === 0)) {
    return <CheckoutPageSkeleton isDark={isDark} />;
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          '',
          isDark
            ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 text-gray-100'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
        )}
      >
        <div className={cn('mx-auto max-w-md text-center', isDark ? 'bg-gray-900' : '')}>
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
              <ShoppingBag className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h1 className={cn('mb-4 text-3xl font-bold', isDark ? 'text-gray-100' : 'text-gray-900')}>
            Корзина пуста
          </h1>
          <p className={cn('', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Добавьте товары в корзину перед оформлением заказа
          </p>
          <Button asChild size="lg" className="mt-6 rounded-lg">
            <Link href="/products">Перейти к покупкам</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        /* чуть больший нижний отступ — у края документа скролл в Chrome/Edge меньше «цепляется» */
        'min-h-screen pb-10 sm:pb-12',
        isDark
          ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900'
          : 'bg-gradient-to-br from-muted/25 via-background to-muted/30',
      )}
    >
      <div className="max-container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="">
          {/* Header */}
          <div className="mb-2 overflow-hidden rounded-xl bg-card sm:rounded-2xl">
            <div className="border-b border-border/60 px-1 py-0.5 sm:px-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  'h-8 px-2 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                  isDark ? 'text-gray-400' : 'text-gray-600',
                )}
              >
                <Link href="/cart">
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
                  Назад в корзину
                </Link>
              </Button>
            </div>
            <div className="p-2.5 sm:p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl',
                    isDark
                      ? 'from-primary/15 to-primary/5 bg-gradient-to-br'
                      : 'from-primary/10 to-primary/5 bg-gradient-to-br',
                  )}
                >
                  <Sparkles className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h1
                    className={cn(
                      'text-lg font-bold tracking-tight sm:text-xl',
                      isDark ? 'text-gray-100' : 'text-gray-900',
                    )}
                  >
                    Оформление заказа
                  </h1>
                  <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
                    Контакты, адрес и оплата на одной странице
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start lg:gap-5">
                {/* Левая колонка - Форма */}
                <div className="space-y-2.5 sm:space-y-3 lg:col-span-2">
                  {/* Способ оплаты */}
                  <Card className={cn(CHECKOUT_CARD_SHELL, 'transition-colors')}>
                    <CardHeader className={cn(CHECKOUT_CARD_HEADER, getCardGradient(isDark))}>
                      <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <CreditCard className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                        </div>
                        <span className="font-bold leading-tight">Способ оплаты</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 sm:px-5">
                      <FormField
                        control={control}
                        name="checkoutPayment"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2"
                              >
                                <label
                                  className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all',
                                    field.value === 'online'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-muted/40 hover:border-primary/30',
                                  )}
                                >
                                  <RadioGroupItem
                                    value="online"
                                    id="pay-online"
                                    className="shrink-0"
                                  />
                                  <span className="text-sm font-medium leading-tight">
                                    Онлайн (YooKassa)
                                  </span>
                                </label>
                                <label
                                  className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all',
                                    field.value === 'on_delivery'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-muted/40 hover:border-primary/30',
                                  )}
                                >
                                  <RadioGroupItem
                                    value="on_delivery"
                                    id="pay-cod"
                                    className="shrink-0"
                                  />
                                  <span className="text-sm font-medium leading-tight">
                                    При получении
                                  </span>
                                </label>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Способ доставки — скрыто до запуска самовывоза (в заказ уходит courier по умолчанию) */}
                  {/*
                  <Card className={cn(CHECKOUT_CARD_SHELL, 'transition-colors')}>
                    <CardHeader className={cn(CHECKOUT_CARD_HEADER, getCardGradient(isDark))}>
                      <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Truck className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                        </div>
                        <span className="font-bold leading-tight">Способ доставки</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 sm:px-5">
                      <FormField
                        control={control}
                        name="deliveryMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2"
                              >
                                <label
                                  className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all',
                                    field.value === 'courier'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-muted/40 hover:border-primary/30',
                                  )}
                                >
                                  <RadioGroupItem
                                    value="courier"
                                    id="delivery-courier"
                                    className="shrink-0"
                                  />
                                  <span className="text-sm font-medium leading-tight">
                                    Курьером
                                  </span>
                                </label>
                                <label
                                  className={cn(
                                    'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all',
                                    field.value === 'pickup'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-muted/40 hover:border-primary/30',
                                  )}
                                >
                                  <RadioGroupItem
                                    value="pickup"
                                    id="delivery-pickup"
                                    className="shrink-0"
                                  />
                                  <Store
                                    className="text-muted-foreground h-4 w-4 shrink-0"
                                    aria-hidden
                                  />
                                  <span className="text-sm font-medium leading-tight">
                                    Самовывоз
                                  </span>
                                </label>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  */}

                  {/* Адрес доставки */}
                  <Card className={cn(CHECKOUT_CARD_SHELL, 'transition-colors')}>
                    <CardHeader className={cn(CHECKOUT_CARD_HEADER, getCardGradient(isDark))}>
                      <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold leading-tight">Адрес доставки</span>
                          {user?.name || user?.phone || user?.email ? (
                            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                              Получатель:{' '}
                              {[
                                user.name,
                                user.phone ? formatPhoneForDisplay(user.phone) : null,
                                user.email,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : null}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-3 sm:px-5">
                      {/* Выбор существующего адреса */}
                      {isLoadingAddresses && (
                        <div className="mb-3 space-y-2">
                          <Skeleton className="h-16 w-full rounded-2xl" />
                        </div>
                      )}
                      {!isLoadingAddresses && addresses.length > 0 && (
                        <div className="mb-4">
                          <FormField
                            control={control}
                            name="selectedAddressId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="mb-2 block text-sm font-medium">
                                  Сохранённый адрес
                                </FormLabel>
                                <FormControl>
                                  <AddressPickerSummary
                                    addresses={addresses}
                                    selectedId={
                                      field.value && field.value !== 'new' ? field.value : undefined
                                    }
                                    isNewAddress={
                                      !field.value || field.value === 'new' || field.value === ''
                                    }
                                    pickerOpen={addressSheetOpen}
                                    onOpenPicker={() => setAddressSheetOpen(true)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Separator className="my-4" />
                        </div>
                      )}

                      {/* Адрес: одно поле с DaData + необязательное уточнение */}
                      <FormField
                        control={control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {isAddressFieldsDisabled
                                ? 'Проверьте адрес'
                                : 'Укажите адрес на карте'}
                            </FormLabel>
                            <FormControl>
                              <AddressInput
                                value={field.value}
                                onChange={field.onChange}
                                onParsedAddress={
                                  isAddressFieldsDisabled ? undefined : applyCheckoutParsedAddress
                                }
                                disabled={
                                  !!watch('selectedAddressId') &&
                                  watch('selectedAddressId') !== 'new'
                                }
                                className={cn(
                                  'transition-all focus:ring-2 focus:ring-primary/20',
                                  isAddressFieldsDisabled
                                    ? 'cursor-default border-dashed border-border/80 bg-muted/25 text-foreground focus:border-border focus:ring-0'
                                    : 'border-border bg-muted focus:border-primary',
                                )}
                              />
                            </FormControl>
                            {watch('city') && watch('zipCode') && !isAddressFieldsDisabled && (
                              <p className="text-xs text-muted-foreground">
                                {watch('city')} · {watch('zipCode')}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(!watch('selectedAddressId') ||
                        watch('selectedAddressId') === 'new' ||
                        watch('selectedAddressId') === '') && (
                        <FormField
                          control={control}
                          name="addressExtra"
                          render={({ field }) => (
                            <FormItem className="mt-2">
                              <FormLabel className="text-sm font-medium">
                                Квартира, подъезд, домофон
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className={cn(
                                    'focus:border-primary focus:ring-primary/20 h-11 rounded-lg border-border bg-muted transition-all focus:ring-2',
                                  )}
                                  placeholder="Необязательно"
                                  autoComplete="off"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <section
                        className="mt-4 rounded-lg border border-border/70 bg-card sm:rounded-xl"
                        aria-label="Дополнительные поля заказа"
                      >
                        <button
                          type="button"
                          id="checkout-additional-toggle"
                          aria-expanded={additionalOpen}
                          onClick={() => setAdditionalOpen((o) => !o)}
                          className={cn(
                            'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors sm:gap-3 sm:px-4 sm:py-2.5',
                            'hover:bg-muted/50',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                            additionalOpen && 'bg-muted/30',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9 sm:rounded-lg',
                              isDark ? 'bg-primary/15' : 'bg-primary/10',
                            )}
                          >
                            <StickyNote className="text-primary h-4 w-4" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold leading-tight text-foreground">
                              Дополнительно{' '}
                              <span className="font-normal text-muted-foreground">
                                · по желанию
                              </span>
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground sm:text-xs">
                              Контакты (если отличаются от профиля), регион и комментарий курьеру
                            </span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                              additionalOpen && 'rotate-180',
                            )}
                            aria-hidden
                          />
                        </button>
                        {additionalOpen ? (
                          <div
                            id="checkout-additional-panel"
                            role="region"
                            aria-labelledby="checkout-additional-toggle"
                            className="space-y-3 border-t border-border bg-muted/20 px-3 py-3 sm:space-y-3.5 sm:px-4 sm:py-3.5"
                          >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <FormField
                                control={control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Имя{' '}
                                      <span className="font-normal text-muted-foreground">
                                        (необязательно)
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        className={cn(
                                          'focus:border-primary focus:ring-primary/20 h-10 rounded-lg border-border bg-muted text-sm transition-all focus:ring-2 sm:h-11',
                                        )}
                                        placeholder="Иван"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Фамилия{' '}
                                      <span className="font-normal text-muted-foreground">
                                        (необязательно)
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        className={cn(
                                          'focus:border-primary focus:ring-primary/20 h-10 rounded-lg border-border bg-muted text-sm transition-all focus:ring-2 sm:h-11',
                                        )}
                                        placeholder="Иванов"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <FormField
                                control={control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Email{' '}
                                      <span className="font-normal text-muted-foreground">
                                        (необязательно)
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Mail
                                          className={cn(
                                            'absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2',
                                            isDark ? 'text-gray-500' : 'text-gray-400',
                                          )}
                                        />
                                        <Input
                                          {...field}
                                          type="email"
                                          className={cn(
                                            'focus:border-primary focus:ring-primary/20 h-10 rounded-lg border-border bg-muted pl-10 text-sm transition-all focus:ring-2 sm:h-11',
                                          )}
                                          placeholder="ivan@example.com"
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={control}
                                name="phone"
                                render={({ field, fieldState }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                      Телефон{' '}
                                      <span className="font-normal text-muted-foreground">
                                        (необязательно)
                                      </span>
                                    </FormLabel>
                                    <FormControl>
                                      <PhoneInput
                                        id="checkout-phone"
                                        name={field.name}
                                        ref={field.ref}
                                        value={field.value ?? ''}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        error={!!fieldState.error}
                                        placeholder="+7 (999) 123-45-67"
                                        autoComplete="tel"
                                        className={cn(
                                          'h-10 min-h-10 rounded-lg border-border bg-muted shadow-none sm:h-11 sm:min-h-11',
                                          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                                        )}
                                        inputClassName="h-10 py-0 text-sm sm:h-11"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={control}
                              name="state"
                              render={({ field }) => (
                                <FormItem className="gap-1.5 space-y-0">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    Регион / область
                                  </FormLabel>
                                  <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                                    Только если нужно уточнить; чаще всего подставляется из адреса.
                                  </p>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className={cn(
                                        'focus:border-primary focus:ring-primary/20 h-10 rounded-lg border-border bg-muted text-sm transition-all focus:ring-2 sm:h-11',
                                      )}
                                      placeholder="Московская область"
                                      disabled={isAddressFieldsDisabled}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem className="gap-1.5 space-y-0">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    Комментарий к заказу
                                  </FormLabel>
                                  <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                                    Время, звонок, пожелания. Квартиру укажите выше.
                                  </p>
                                  <FormControl>
                                    <textarea
                                      {...field}
                                      className={cn(
                                        'focus:border-primary focus:ring-primary/20 border-border bg-muted min-h-[4.5rem] w-full resize-none rounded-lg border px-2.5 py-2 text-sm transition-all placeholder:text-muted-foreground focus:ring-2 focus:outline-none sm:min-h-[5.25rem] sm:px-3 sm:py-2.5',
                                      )}
                                      rows={4}
                                      placeholder="Напр.: после 18:00, позвонить заранее…"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ) : null}
                      </section>

                      {/* Чекбокс "Сохранить адрес" - показываем только если выбран новый адрес или адресов нет */}
                      {(!selectedAddressId ||
                        selectedAddressId === 'new' ||
                        addresses.length === 0) && (
                        <div className="mt-3">
                          <FormField
                            control={control}
                            name="saveAddress"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value === true}
                                    onCheckedChange={field.onChange}
                                    className="mt-1 cursor-pointer"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="cursor-pointer text-sm font-normal">
                                    Сохранить адрес для будущих заказов
                                  </FormLabel>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Адрес будет сохранен в вашем профиле
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* self-start + items-start у grid: без растягивания ряда sticky ведёт себя предсказуемее у края документа */}
                <div className="z-10 self-start lg:sticky lg:top-4 lg:h-fit xl:top-5">
                  <Card
                    className={cn(
                      CHECKOUT_CARD_SHELL,
                      'rounded-2xl border shadow-sm',
                      isDark ? 'border-border/60 bg-card/95' : 'border-border/80 bg-card',
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-2.5 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-3.5',
                        getOrderCardHeaderGradient(isDark),
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingBag className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <h2 className="text-base leading-none font-bold sm:text-lg">Ваш заказ</h2>
                    </div>
                    <CardContent className="space-y-0 px-4 pb-4 pt-3 sm:px-5">
                      {/* Список товаров */}
                      {selectedItems.length > 0 && selectedItems.length < items.length && (
                        <div
                          className={cn(
                            'border-primary mb-3 rounded-md border-l-4 p-2.5 sm:rounded-lg sm:p-3',
                            isDark ? 'bg-primary/10' : 'bg-primary/5',
                          )}
                        >
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isDark ? 'text-gray-100' : 'text-gray-900',
                            )}
                          >
                            К оформлению выбрано {checkoutTotalItems} из {totalItems} товаров
                          </p>
                          <Link href="/cart" className="text-primary mt-1 text-xs hover:underline">
                            Вернуться в корзину и изменить выбор
                          </Link>
                        </div>
                      )}
                      {/* До lg: ограниченная высота + свой скролл (мобилка). С lg: без вложенного скролла — иначе колёсико «цепляется»
                          за этот блок и кажется, что страница замирает посредине прокрутки. */}
                      <div
                        className={cn(
                          'space-y-0.5 pr-1 sm:pr-2',
                          'max-h-[min(32vh,17.5rem)] overflow-y-auto sm:max-h-[min(38vh,19rem)]',
                          'lg:max-h-none lg:overflow-visible',
                        )}
                      >
                        {checkoutItems.map((item) => {
                          const productHref =
                            item.productId && String(item.productId).trim() !== ''
                              ? `/product/${item.productId}`
                              : null;
                          const checkoutColorVisual = item.color
                            ? getProductColorVisual(item.color)
                            : null;
                          const checkoutSizeLabel = item.size
                            ? getProductSizeLabel(item.size)
                            : null;
                          const rowClass = cn(
                            'group flex items-center gap-2 rounded-lg border border-transparent p-2 transition-all sm:gap-2.5 sm:rounded-xl sm:p-2.5',
                            productHref && 'hover:border-border hover:bg-muted/60',
                            productHref &&
                              'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                          );
                          const rowInner = (
                            <>
                              <div
                                className={cn(
                                  'relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 transition-all sm:h-16 sm:w-16 sm:rounded-lg',
                                  productHref && 'group-hover:ring-primary/25',
                                  isDark ? 'bg-muted ring-border' : 'bg-muted ring-border/80',
                                )}
                              >
                                <Image
                                  src={item.image || '/placeholder.png'}
                                  alt={item.productTitle || item.name || 'Товар'}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 56px, 64px"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    'line-clamp-2 text-sm font-semibold',
                                    productHref && 'underline-offset-2 group-hover:underline',
                                    isDark ? 'text-gray-100' : 'text-gray-900',
                                  )}
                                >
                                  {item.productTitle || item.name}
                                </p>
                                <p
                                  className={cn(
                                    'mt-1 text-xs tabular-nums',
                                    isDark ? 'text-gray-400' : 'text-gray-600',
                                  )}
                                >
                                  {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                                </p>
                                {checkoutSizeLabel || checkoutColorVisual ? (
                                  <div
                                    className={cn(
                                      'mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 truncate text-xs',
                                      isDark ? 'text-gray-500' : 'text-gray-500',
                                    )}
                                  >
                                    {checkoutSizeLabel ? (
                                      <span className="truncate">{checkoutSizeLabel}</span>
                                    ) : null}
                                    {checkoutColorVisual ? (
                                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                        {checkoutSizeLabel ? (
                                          <span className="shrink-0" aria-hidden>
                                            ·
                                          </span>
                                        ) : null}
                                        <span
                                          className={cn(
                                            'h-3 w-3 shrink-0 rounded-full border border-black/20 dark:border-white/25',
                                            checkoutColorVisual.ring &&
                                              'ring-1 ring-border ring-offset-1',
                                          )}
                                          style={checkoutColorVisual.style}
                                          aria-hidden
                                        />
                                        <span className="truncate">
                                          {checkoutColorVisual.label}
                                        </span>
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                              <div
                                className={cn(
                                  'min-w-[4.5rem] shrink-0 text-right text-sm font-bold tabular-nums sm:min-w-[5rem]',
                                  isDark ? 'text-gray-100' : 'text-gray-900',
                                )}
                              >
                                {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                              </div>
                            </>
                          );
                          if (productHref) {
                            return (
                              <Link
                                key={item._id}
                                href={productHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                prefetch={false}
                                className={rowClass}
                              >
                                {rowInner}
                              </Link>
                            );
                          }
                          return (
                            <div key={item._id} className={rowClass}>
                              {rowInner}
                            </div>
                          );
                        })}
                      </div>

                      <Separator className="my-3 sm:my-4" />

                      {/* Итоги */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
                            Товары ({checkoutTotalItems})
                          </span>
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              isDark ? 'text-gray-100' : 'text-gray-900',
                            )}
                          >
                            {checkoutTotalPrice.toLocaleString()} ₽
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
                            Доставка
                          </span>
                          <span className="font-medium tabular-nums">
                            {deliveryCost === 0 ? (
                              <span className={cn(isDark ? 'text-green-400' : 'text-green-600')}>
                                Бесплатно
                              </span>
                            ) : (
                              <span className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                                {deliveryCost.toLocaleString()} ₽
                              </span>
                            )}
                          </span>
                        </div>

                        {checkoutTotalPrice < DELIVERY_FREE_THRESHOLD &&
                          deliveryMethod === 'courier' && (
                            <div
                              className={cn(
                                'rounded-md p-2 sm:rounded-lg sm:p-2.5',
                                isDark ? 'bg-blue-900/20' : 'bg-blue-50',
                              )}
                            >
                              <p
                                className={cn(
                                  'text-[11px] leading-snug sm:text-xs',
                                  isDark ? 'text-blue-300' : 'text-blue-700',
                                )}
                              >
                                До бесплатной доставки осталось{' '}
                                <span className="font-semibold">
                                  {(DELIVERY_FREE_THRESHOLD - checkoutTotalPrice).toLocaleString()}{' '}
                                  ₽
                                </span>
                              </p>
                            </div>
                          )}
                      </div>

                      <Separator className="my-3 sm:my-4" />

                      {/* Итого */}
                      <div
                        className={cn(
                          'mb-3 flex items-center justify-between rounded-lg bg-primary/5 p-3 sm:mb-4 sm:p-3.5',
                        )}
                      >
                        <span
                          className={cn(
                            'text-lg font-bold sm:text-xl',
                            isDark ? 'text-gray-100' : 'text-gray-900',
                          )}
                        >
                          Итого
                        </span>
                        <span className="text-primary text-lg font-bold sm:text-xl">
                          {totalWithDelivery.toLocaleString()} ₽
                        </span>
                      </div>

                      {/* Кнопка: только создание заказа, оплата — на странице заказа */}
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl transition-all sm:h-12 sm:rounded-2xl"
                        size="lg"
                        disabled={isSubmitDisabled}
                      >
                        {isCreatingOrder ? (
                          <span className="inline-flex items-center justify-center gap-2">
                            <Sparkles className="h-5 w-5 shrink-0 animate-pulse" />
                            Оформление...
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2">
                            <Shield className="h-5 w-5 shrink-0" />
                            {checkoutPayment === 'on_delivery'
                              ? 'Оформить заказ'
                              : 'Перейти к оплате'}
                          </span>
                        )}
                      </Button>
                      <p className="mt-1.5 text-center text-[11px] text-muted-foreground leading-snug sm:text-xs">
                        {checkoutPayment === 'on_delivery'
                          ? 'Заказ будет принят в обработку без онлайн-оплаты'
                          : 'После оформления заказ будет зарезервирован на 30 минут'}
                      </p>

                      {/* Согласие на условия и политику */}
                      {/* <FormField
                        control={control}
                        name="agreeToTerms"
                        render={({ field }) => (
                          <FormItem
                            className={cn(
                              // Всегда flex-row с адаптивом для word-break & выравнивания
                              'xs:space-x-3 xs:p-4 my-4 flex items-start rounded-lg border p-3',
                              isDark
                                ? 'border-gray-700 bg-gray-800/50'
                                : 'border-gray-200 bg-gray-50/50',
                            )}
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="agreeToTerms"
                                className="mt-0.5 shrink-0"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="agreeToTerms"
                              className={cn(
                                // Жёстко ставим text-wrap + разрешаем перенос только ссылкам
                                'w-full cursor-pointer text-sm leading-relaxed font-normal select-none',
                                'flex flex-wrap items-center gap-x-1.5 gap-y-1.5',
                              )}
                              style={{ minWidth: 0 }}
                            >
                              <span className="whitespace-nowrap">Я согласен с </span>
                              <Link
                                href="/terms"
                                className={cn(
                                  'text-primary font-medium hover:underline',
                                  'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                                  'whitespace-nowrap',
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                условиями использования
                              </Link>
                              <span className="whitespace-nowrap">&nbsp;и&nbsp;</span>
                              <Link
                                href="/privacy"
                                className={cn(
                                  'text-primary font-medium hover:underline',
                                  'focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none',
                                  'whitespace-nowrap',
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                политикой конфиденциальности
                              </Link>
                            </FormLabel>
                            {/* Сообщение об ошибке, если чекбокс не отмечен */}
                      {/* <FormMessage className="xs:mt-0 mt-1" />
                          </FormItem>
                        )}
                      /> */}

                      {/* Безопасность */}
                      <div
                        className={cn(
                          'mt-3 flex items-center justify-center gap-2 text-[11px] sm:text-xs',
                          isDark ? 'text-gray-400' : 'text-gray-500',
                        )}
                      >
                        <Shield className="h-4 w-4 shrink-0" />
                        <span>
                          {checkoutPayment === 'on_delivery'
                            ? 'Оплата при получении заказа'
                            : 'Безопасная оплата через YooKassa'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>

          <AddressPickerSheet
            open={addressSheetOpen}
            onOpenChange={setAddressSheetOpen}
            addresses={addresses}
            selectedId={
              selectedAddressId && selectedAddressId !== 'new' ? selectedAddressId : undefined
            }
            onSelect={handleAddressSelect}
            onSelectNew={handleNewAddress}
            isAtLimit={isAtLimit}
            maxAddresses={maxAddresses}
          />
        </div>
      </div>
    </div>
  );
}
