'use client';

import { AddressPickerSheet, AddressPickerSummary, useAddresses } from '@/entities/address';
import {
  getActiveLineQuantity,
  getOrderPayableAmount,
  getOrderStatusText,
  useOrders,
} from '@/entities/order';
import {
  excludeProductIds,
  usePopularProducts,
  useProductRailActions,
  useRecommendedProducts,
} from '@/entities/product';
import { useAddressFormModal } from '@/features/address-form';
import { useAuth, useUserStore } from '@/features/auth';
import { SignInPrompt } from '@/features/auth-modal';
import { ProfileEditModal } from '@/features/profile-edit';
import { cn } from '@/shared';
import { addressService } from '@/shared/api/services';
import { hasDashboardAccess, isStaffRole, roleLabelRu } from '@/shared/lib/user-roles';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import MyBars from '@/widgets/banners/bars/ui/MyBars';
import { ProductCarouselSection } from '@/widgets/product-carousel';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Check,
  Edit,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IoIosSettings } from 'react-icons/io';
import { PiHandbagSimpleFill } from 'react-icons/pi';
import { toast } from 'sonner';

type TabValue = 'profile' | 'orders' | 'addresses';

export function MyAccountPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { updateAvatar } = useUserStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { openCreateAddress, openEditAddress } = useAddressFormModal();

  // React Query data loading state per tab
  const shouldLoadOrders = isAuthenticated && activeTab === 'orders';
  const shouldLoadAddresses = isAuthenticated && activeTab === 'addresses';
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useOrders(shouldLoadOrders);

  const {
    data: addresses = [],
    isLoading: isLoadingAddresses,
    error: addressesError,
    isAtLimit: isAddressesAtLimit,
    maxAddresses,
  } = useAddresses(shouldLoadAddresses);

  const defaultAddressId = useMemo(
    () => addresses.find((address) => address.selected)?._id ?? addresses[0]?._id,
    [addresses],
  );

  const { data: popularProfile = [] } = usePopularProducts(16, isAuthenticated);
  const { data: recommendedRaw = [] } = useRecommendedProducts(16, isAuthenticated);
  const profileRail = useProductRailActions();
  const popularIds = useMemo(
    () => new Set(popularProfile.map((p) => String(p._id))),
    [popularProfile],
  );
  const recommendedForYou = useMemo(
    () => excludeProductIds(recommendedRaw, popularIds),
    [recommendedRaw, popularIds],
  );

  // sync tab with URL param (старые ссылки ?tab=wishlist больше не используются)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'wishlist') {
      urlParams.delete('tab');
      const qs = urlParams.toString();
      const next = qs ? `?${qs}` : '';
      window.history.replaceState(null, '', `${window.location.pathname}${next}`);
      setActiveTab('profile');
      return;
    }
    if (tabParam && ['profile', 'orders', 'addresses'].includes(tabParam)) {
      setActiveTab(tabParam as TabValue);
    }
  }, []);

  // error handling
  useEffect(() => {
    if (ordersError) {
      console.error('Error loading orders:', ordersError);
      toast.error('Не удалось загрузить заказы');
    }
  }, [ordersError]);

  useEffect(() => {
    if (addressesError) {
      console.error('Error loading addresses:', addressesError);
      toast.error('Не удалось загрузить адреса');
    }
  }, [addressesError]);

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот адрес?')) return;

    try {
      await addressService.deleteAddress(id);
      toast.success('Адрес удален');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при удалении адреса');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await addressService.setDefaultAddress(id);
      toast.success('Адрес по умолчанию обновлён');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось обновить адрес по умолчанию',
      );
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      await updateAvatar(file);
      toast.success('Аватар успешно обновлен');
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <SignInPrompt
        title="Необходимо войти"
        description="Войдите в аккаунт, чтобы просматривать личный кабинет"
        intent={{ type: 'profile' }}
      />
    );
  }

  const menuItems = [
    { value: 'profile' as TabValue, label: 'Личные данные', icon: User },
    { value: 'orders' as TabValue, label: 'Заказы', icon: Package },
    { value: 'addresses' as TabValue, label: 'Адреса доставки', icon: MapPin },
  ];

  return (
    <div className="max-container mx-auto min-w-0 max-w-full overflow-x-hidden px-4 py-3">
      <div className="">
        {/* Header */}

        <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
          {/* Sidebar menu */}
          <aside className="hidden space-y-2 lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center border-b p-5">
                  <div className="group relative">
                    <Avatar className="h-24 w-24">
                      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                      <AvatarFallback className="text-2xl">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => avatarFileInputRef.current?.click()}
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={isUploadingAvatar}
                    />
                  </div>
                  {isUploadingAvatar && <p className="mt-2 text-xs text-gray-500">Загрузка...</p>}
                  <h3 className="mt-3 max-w-[180px] text-xl text-center font-roboto font-bold break-words">
                    {user.name}
                  </h3>
                  <p className="max-w-[180px] text-center text-xs break-words text-gray-500">
                    {user.email}
                  </p>
                  <div className="flex justify-center mt-2">
                    <span
                      className="text-muted-foreground max-w-[200px] text-center text-[10px] leading-tight break-all font-mono select-all"
                      title="Скопировать ID"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (navigator.clipboard && user._id) {
                          navigator.clipboard.writeText(user._id);
                        }
                      }}
                    >
                      ID для чата: {user._id}
                    </span>
                  </div>

                  {hasDashboardAccess(user.role) ? (
                    <Button asChild className="mt-4 w-full rounded-md shadow-sm" size="sm">
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Панель магазина
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <nav className="space-y-1 p-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        onClick={() => setActiveTab(item.value)}
                        className={cn(
                          'flex w-full cursor-pointer dark:text-[#f2f2f2] items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          activeTab === item.value
                            ? 'bg-indigo-500 text-white dark:bg-indigo-500'
                            : 'hover:bg-muted/  80',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <Separator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full text-red-500 justify-start"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="min-w-0 max-w-full">
            {/* Mobile: compact profile header + tabs */}
            <Card className="lg:hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="h-14 w-14">
                      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                      <AvatarFallback className="text-lg">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute -right-1 -bottom-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border"
                      onClick={() => avatarFileInputRef.current?.click()}
                      aria-label="Изменить аватар"
                      disabled={isUploadingAvatar}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-roboto font-bold">{user.name}</h2>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsProfileModalOpen(true)}
                          aria-label="Редактировать профиль"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={logout}
                          aria-label="Выйти"
                          className="text-red-500 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isUploadingAvatar ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">Загрузка аватара...</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setActiveTab(item.value)}
                        className={cn(
                          'inline-flex shrink-0  cursor-pointer  items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-indigo-500 dark:text-[#f2f2f2] text-white dark:bg-indigo-500'
                            : 'bg-muted/60 dark:bg-[#272A2E] text-foreground hover:bg-muted',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {hasDashboardAccess(user.role) ? (
                  <div className="mt-4">
                    <Button asChild className="w-full rounded-xl shadow-sm" size="sm">
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Панель магазина
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="min-w-0 max-w-full space-y-3">
                <Card className="hidden md:block">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-2xl font-roboto">Личные данные</CardTitle>
                      <CardDescription className="hidden md:block">
                        Основная информация о вашем профиле
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsProfileModalOpen(true)}
                      aria-label="Редактировать профиль"
                      className="gap-2 border-none bg-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="hidden md:inline">Редактировать</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex w-full flex-col gap-3 md:flex-row md:justify-between">
                      <div className="w-full rounded-xl bg-muted/60 px-5 py-3 dark:bg-[#272A2E]">
                        <label className="block text-xs font-medium text-muted-foreground">
                          Имя
                        </label>
                        <p className="font-roboto text-lg font-bold break-words md:text-base">
                          {user.name}
                        </p>
                      </div>

                      <div className="w-full rounded-xl bg-muted/60 px-5 py-3 dark:bg-[#272A2E]">
                        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          Email
                        </label>
                        <p className="font-roboto text-lg font-bold break-words md:text-base">
                          {user.email}
                        </p>
                      </div>

                      <div className="w-full rounded-xl bg-muted/60 px-5 py-3 dark:bg-[#272A2E]">
                        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          Телефон
                        </label>
                        <p className="font-roboto text-lg font-bold md:text-base">
                          {user.phone || 'Не указан'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-muted-foreground">Роль</label>
                      <div className="mt-1">
                        <Badge variant={isStaffRole(user.role) ? 'default' : 'secondary'}>
                          {roleLabelRu(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid w-full md:mt-0 mt-3 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Link
                    href="/messages?to=owner"
                    className={cn(
                      'group relative flex min-h-[92px] items-center justify-between rounded-3xl bg-card p-4 transition',

                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                    )}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-roboto text-lg font-bold md:text-xl">
                        Сообщения
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Чат с владельцем магазина и другими пользователями
                      </p>
                    </div>
                    <div className="ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 transition group-hover:bg-indigo-500/15">
                      <MessageCircle className="h-6 w-6" aria-hidden />
                    </div>
                  </Link>

                  <Link
                    href="/purchases"
                    className={cn(
                      'group relative flex min-h-[92px] items-center justify-between rounded-3xl bg-card p-4 transition',

                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                    )}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-roboto font-bold md:text-xl">
                        Мои покупки
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Купленные товары и заказы
                      </p>
                    </div>
                    <div className="ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 transition group-hover:bg-indigo-500/15">
                      <PiHandbagSimpleFill className="h-6 w-6" />
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    className={cn(
                      'group relative flex min-h-[92px] items-center justify-between rounded-3xl bg-card p-4 transition sm:col-span-2 lg:col-span-1',

                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                    )}
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-roboto font-bold md:text-xl">
                        Настройки
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">Платёжные способы</p>
                    </div>
                    <div className="ml-3 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 transition group-hover:bg-indigo-500/15">
                      <IoIosSettings className="h-6 w-6" />
                    </div>
                  </Link>
                </div>
                <div className="w-full  min-w-0">
                  <MyBars
                    onBannerClick={(index, banner) => {
                      console.info('[Bars] Banner clicked:', index, banner);
                    }}
                    autoplayDelay={5000}
                  />
                </div>

                {/* Address if exists */}
                {user.address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl font-roboto">Адрес</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                        <p className="text-sm">{user.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}


                {/* Change password */}
                {/* <Card>
                  <Collapsible open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <div>
                        <CardTitle>Смена пароля</CardTitle>
                        <CardDescription>Обновите пароль для безопасности аккаунта</CardDescription>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isChangePasswordOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <ChangePasswordForm />
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card> */}
              </div>
            )}

            {/* Orders */}
            {activeTab === 'orders' && (
              <Card className='p-4'>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl font-roboto font-bold">
                    История заказов
                  </CardTitle>
                  <CardDescription>
                    Просматривайте заказы и оплату. Список купленных товаров — на странице{' '}
                    <Link href="/purchases" className="font-medium text-indigo-500 hover:underline">
                      Мои покупки
                    </Link>
                    .
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-gray-600">Загрузка заказов...</p>
                    </div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-sm font-medium text-gray-900">
                        У вас пока нет заказов
                      </p>
                      <p className="mb-6 text-sm text-gray-600">
                        Начните делать покупки, чтобы увидеть историю заказов
                      </p>
                      <Button asChild>
                        <Link href="/products">Перейти к покупкам</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(orders || []).map((order) => {
                        const status = order.order_status;
                        const totalAmount = getOrderPayableAmount(order);
                        const originalTotal = Number(order.totalAmount ?? order.total ?? 0);
                        const orderNumber = order._id.slice(-8).toUpperCase();
                        const remainingQty = (order.products ?? []).reduce(
                          (sum, p) => sum + getActiveLineQuantity(p, status),
                          0,
                        );
                        const originalQty = (order.products ?? []).reduce(
                          (sum, p) => sum + (Number(p.quantity) || 0),
                          0,
                        );
                        return (
                          <Card key={order._id} className="bg-muted/40 p-4 dark:bg-[#272A2E]">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-xl font-roboto">
                                    Заказ {orderNumber}
                                  </CardTitle>
                                  <CardDescription>
                                    от{' '}
                                    {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </CardDescription>
                                </div>
                                <Badge
                                  className={
                                    status === 'DELIVERED'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : status === 'PAID'
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : status === 'CANCELLED'
                                          ? 'bg-red-100 text-red-800 border-red-200'
                                          : status === 'REFUSED'
                                            ? 'bg-orange-100 text-orange-800 border-orange-200'
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }
                                >
                                  {getOrderStatusText(status, order.payment_type)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center gap-0.5 text-sm">
                                  <span className="font-bold">Товаров:</span>
                                  <span className="font-bold">
                                    {remainingQty < originalQty
                                      ? `${remainingQty} из ${originalQty}`
                                      : remainingQty}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <span className="font-bold">Сумма:</span>
                                  <span className="font-bold">
                                    {new Intl.NumberFormat('ru-RU', {
                                      style: 'currency',
                                      currency: 'RUB',
                                    }).format(totalAmount)}
                                  </span>
                                  {originalTotal > totalAmount + 0.009 ? (
                                    <span className="text-muted-foreground text-xs font-normal line-through">
                                      {new Intl.NumberFormat('ru-RU', {
                                        style: 'currency',
                                        currency: 'RUB',
                                      }).format(originalTotal)}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="pt-2">
                                  <Button className="h-11 rounded-xl" size="sm" asChild>
                                    <Link href={`/my-orders/${order._id}`}>Подробнее</Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <div className="space-y-3">
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2 sm:px-4">
                  <h2 className="font-roboto text-xl font-bold sm:text-2xl">Адреса доставки</h2>
                  <Button
                    size="sm"
                    className="shrink-0 gap-1"
                    disabled={isAddressesAtLimit}
                    onClick={() => openCreateAddress()}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Добавить адрес</span>
                    <span className="sm:hidden">Добавить</span>
                  </Button>
                </div>

                {isLoadingAddresses ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-sm text-gray-600">Загрузка адресов...</p>
                    </CardContent>
                  </Card>
                ) : addresses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MapPin className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-sm font-medium text-gray-900">
                        У вас нет сохраненных адресов
                      </p>
                      <p className="mb-6 text-sm text-gray-600">
                        Добавьте адрес для быстрого оформления заказов
                      </p>
                      <Button onClick={() => openCreateAddress()}>Добавить адрес</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="mb-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Адрес по умолчанию используется при оформлении заказа
                      </p>
                      <AddressPickerSummary
                        addresses={addresses}
                        selectedId={defaultAddressId}
                        onOpenPicker={() => setAddressSheetOpen(true)}
                        pickerOpen={addressSheetOpen}
                      />
                      <AddressPickerSheet
                        open={addressSheetOpen}
                        onOpenChange={setAddressSheetOpen}
                        addresses={addresses}
                        selectedId={defaultAddressId}
                        onSelect={handleSetDefaultAddress}
                        onSelectNew={() => {
                          setAddressSheetOpen(false);
                          openCreateAddress({ preferDefault: true });
                        }}
                        isAtLimit={isAddressesAtLimit}
                        maxAddresses={maxAddresses}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {addresses.map((address) => (
                        <Card key={address._id} className="relative">
                          <CardHeader className="px-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <CardTitle className="font-roboto text-xl">
                                  Адрес доставки
                                </CardTitle>
                                {address.selected && (
                                  <Badge variant="default" className="ml-2">
                                    <Check className="mr-1 h-4 w-4" />
                                    По умолчанию
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditAddress(address._id)}
                                  className=""
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAddress(address._id)}
                                  className="p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-600">{address.address_line1}</p>
                              <p className="text-gray-600">
                                {address.city}
                                {address.state && `, ${address.state}`}
                                {address.pincode && `, ${address.pincode}`}
                              </p>
                              <p className="text-gray-600">{address.country}</p>
                              {address.landmark && (
                                <p className="text-gray-500 italic">Ориентир: {address.landmark}</p>
                              )}
                              {address.mobile && (
                                <p className="mt-2 flex items-center gap-1 text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  {String(address.mobile)}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
        <ProfileEditModal open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
      </div>
           {recommendedForYou.length > 0 ? (
            <ProductCarouselSection
              title="Рекомендуем для вас"
              subtitle="Категории из ваших заказов — новые товары, которые могут подойти"
              products={recommendedForYou}
              onAddToCart={profileRail.onAddToCart}
              onToggleWishlist={profileRail.onToggleWishlist}
              isInWishlist={profileRail.isInWishlist}
              isInCart={profileRail.isInCart}
            />
          ) : null}
    </div>
  );
}
